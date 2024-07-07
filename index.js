const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const db = require('./helpers/userModel')
const cors = require('cors')
const queries = require('./helpers/userModel')
require('dotenv').config()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
        .then(() => console.log('Connected to MongoDB database'))
        .catch((err) => console.log('Error connecting to MongoDB database: ', err));


app.post('/api/users', async (req, res) => {
  const username = req.body.username;
  const user = await db.createUser(username);
  
  if (typeof(user) !== 'string') {
    return res.json({username: user.username, _id: user._id.toString()});
  } else {
    return res.json(user);
  }
});

app.get('/api/users', async (req, res) => {
  const users = await db.findAllUsers();
  return res.json(users);
});

app.post('/api/users/:_id/exercises', async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  let formattedDate = null;

  if (!_id || !description || !duration) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }
  
  if(!date) {
    formattedDate = new Date();
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) {
      return res.status(400).json({ error: 'Invalid date format '});
    }
    formattedDate = parsedDate;
  }

  try {
    const user = await queries.logExercise(_id, description, duration, formattedDate);
    return user ? res.json({ 
      username: user[0].username,
      description: user[1].description,
      duration: parseInt(user[1].duration, 10),
      date: user[1].date ? user[1].date.toDateString() : user[1].date,     
      _id: user[0]._id
    }) : null

  } catch (err) {
    return res.status(500).json({ error : 'Internal Server Error '});
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  const { _id } = req.params;
  let { from, to, limit } = req.query ? req.query : null;

  const dateFormat = /^(19|20)\d\d-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/

  if (!from || !dateFormat.test(from)) {
    from = new Date('1970-01-01');
  } else {
    from = new Date(from);
  }

  if (!to || !dateFormat.test(to)) {
    to = new Date('2050-01-01');
  } else {
    to = new Date(to);
  }

 // Validate 'limit' and convert to an integer if valid
 limit = parseInt(limit, 10);
 if (isNaN(limit) || limit <= 0) {
   limit = 0; // No limit if 'limit' is missing or invalid
 } 

 try {
    const user = await queries.findAllExerciseById(_id, from, to, limit);  
    return res.json({ 
      username: user.username, 
      count: user.count,
      _id: user._id, 
      log: user.log
    });
 } catch (err) {
  return err;
 }
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
