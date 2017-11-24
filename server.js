'use strict';

let express = require('express');
let cors = require('cors');
let app = express();
let morgan = require('morgan');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let User = require('./models/user');
let bcrypt = require('bcrypt');
let jsonwebtoken = require('jsonwebtoken');
let jwt = require('express-jwt');
let dotenv = require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'));
app.use(cors());
mongoose.Promise = global.Promise;

// Set up mongodb connection
let dbConnectionString;
if(process.env.NODE_ENV === 'test') {
  dbConnectionString =
  'mongodb://'
  + process.env.DBHOST
  + ':'
  + process.env.DBPORT
  + '/'
  + process.env.TEST_DATABASE;
}
if(process.env.NODE_ENV !== 'test') {
  dbConnectionString =
  'mongodb://'
  + process.env.DBHOST
  + ':'
  + process.env.DBPORT
  + '/'
  + process.env.DATABASE;
}
mongoose.connect(dbConnectionString, {useMongoClient: true}, function(err, db) {
  if (err) {
      console.error('Error connecting to mongodb: ', error.message);
  } else {
    console.log('Connected to the following db: ', dbConnectionString);
  }
});

// ===== Public Routes =====

// Get root
app.get('/', (req, res) => {
  res.send('hello world, from a simple authentication service');
});

// Create a new user
app.post('/user', function(req, res){
  let data = {
    email: req.body.email
  };
  if(!data.email) {
    return res.status(400).json({errorName: 'ValidationError', errorMessage: '`email` is required' });
  }
  let newUser = new User({
    email: req.body.email,
    password: req.body.password,
    admin: req.body.admin,
    name: req.body.name
  });
  newUser.save(function(err, data){
    if(err && err.name === 'MongoError' && err.message.includes('E11000')){
      err.name = 'DuplicationError';
      err.message = 'User already exists';
      return res.status(400).json({errorName: err.name, errorMessage: err.message });
    }
    if(err && err.name === 'ValidationError'){
      return res.status(400).json({errorName: err.name, errorMessage: err.message });
    }
    if(err){
      console.error(err);
      return res.status(500).json({error: true});
    }
    res.status(201).location('/user/' + newUser.id).send();
  });
});

// Authenticate a user given email and password:
app.post('/authenticate', function(req, res){
  let data = {
    email: req.body.email
  };
  User.find(data, function(err, user) {
    if(!user){
      return res.sendStatus(404);
    }
    if(err){
      return res.sendStatus(500);
    }
    if(req.email !== user.email) {
      return res.sendStatus(401);
    }
    var payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      admin: user.admin
    };
    let token = jsonwebtoken.sign(payload, process.env.SECRET, {
      expiresIn: 1440 // expires in 1 hour
    });
    res.json({error: false, token: token});
  });
});

// ===== Protected Routes =====
var auth = jwt({ secret: process.env.SECRET});

// Get a list of users
// Only users with admin-role should have access to this
app.get('/user', auth, (req, res) => {
  if(!req.user.admin) {
   return res.sendStatus(403);
  }
  User.find({}, function(err, users) {
    var userMap = {};
    users.forEach(function(user) {
      var payload = {
        id: user.id,
        name: user.name,
        email: user.email,
        admin: user.admin
      };
      userMap[user._id] = payload;
    });
    res.send(userMap);
  });
});

// Get an individual user
// Only the user or an admin should have access to this
app.get('/user/:id', auth, (req, res) => {
  var id = req.params.id;
  let user = User.findById(id, function(err, user) {
    if(err){
      console.log(err);
      return res.sendStatus(500);
    }
    if(!user){
      return res.sendStatus(404);
    }
    var payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      admin: user.admin
    };
    res.send(payload);
  });
});

// Update user (i.e. only name and password can be changed for now)
app.put('/user/:id', auth, (req, res) => {
  var id = req.params.id;
  let user = User.findById(id, function(err, user) {
    if(err) {
      return res.sendStatus(500);
    }
    if(!user) {
      return res.sendStatus(404);
    }
    var passwordToSave = bcrypt.hashSync(req.body.password, 10);
    user.name = req.body.name;
    user.password = passwordToSave;
    user.save(function(err, data){
      if(err){
        return res.sendStatus(500);
      }
    });
  })
  res.sendStatus(204);
});

// Delete a user.
// Only the user or an admin shold have access to this
app.delete('/user/:id', auth, (req, res) => {
  var id = req.params.id;
  User.findByIdAndRemove(id, function(err, user) {
    if(!user) {
      return res.sendStatus(404);
    }
    res.sendStatus(204);
  });
});

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({'message': 'Invalid token'});
  }
});

app.listen(process.env.PORT);
console.log('Listening on ', process.env.HOST + ':' + process.env.PORT);
