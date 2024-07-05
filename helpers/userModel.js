const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true}
});

const exerciseSchema = new mongoose.Schema({
    description: { type: String, required: true },
    duration: { type: String, required: true },
    date: { type: Date, required: true },
    id: { type: String, required: true}
})

const queries = {};

const users = mongoose.model('users', userSchema);
const exercise = mongoose.model('exercise', exerciseSchema);

queries.findOneByUsername = async (username) => {
    try {
        const user = await users.findOne({ username: username });
        return user ? user : null;

    } catch (err) {
        console.error('Error querying for user', err);
    }
}

queries.findOneById = async (_id) => {
    try {
        const user = await users.findById(_id);
        return user ? user : null;
    } catch (err) {
        console.error('Error looking up user: ', err);
    }
}

queries.findAllUsers = async() => {
    try {
        const allUsers = await users.find();
        return allUsers ? allUsers : null
    } catch (err) {
        console.error('Error querying users', err);
    }
}

queries.findAllExerciseById = async (_id, from, to, limit) => {
    try {
        const user = await queries.findOneById(_id);
    
        if (!user) {
            throw new Error('User not found');
        };

        const logs = await exercise.find(
            { 
                id: _id, 
                date : {
                    $gte: from,
                    $lte: to
                }
            }, 
            {
                _id: 0, id: 0, __v: 0, 
            }
        ).limit(limit);

        const formattedLogs = logs.map(log => ({
            ...log.toObject(),
            date: log.date.toDateString()
        }))

        
        const results = {
            _id: user._id.toString(),
            username: user.username,
            count: logs.length,
            log: formattedLogs 
        }
        return logs ? results : null 
    } catch (err) {
        console.error('error finding user: ', err)
        return { error: 'Internal Server Error' };
    }
    
}

queries.createUser = async (username) => {
    try {
        const user = await queries.findOneByUsername(username);
        const userExists = user === null ? false : true;
    
        if (userExists) {
            return user;
        } else {
            const newUser = new users({
                username: username
            });
            const data = await newUser.save();
           
            return data;
        }
    } catch (err) {
        console.error('Error creating user: ', err);
        return null;
    }
}

queries.logExercise = async (_id, description, duration, date) => {
    try {
        // Check if user exists
        const user = await queries.findOneById(_id);
        const userExists = user ? user : null;
        if (userExists === null) {
            console.log('User with given id do not exist');
            return null;
        }

        const newExercise = new exercise({
            description: description,
            duration: duration,
            date: date,
            id: _id
        });

        const data = await newExercise.save();
        console.log(data)
        return [user, data];
    } catch (err) {
        console.error('Error logging exercise: ', err)
        return null;
    }
}

module.exports = queries;
