'use strict';

let express = require('express');
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
mongoose.Promise = global.Promise;

// Set up mongodb connection
mongoose.connect("mongodb://localhost/demo", {useMongoClient: true})
  .catch(function(error){
    console.error('Error connecting to mongodb: ', error.message);
  });

// ===== Public Routes =====

// Get root
app.get('/', (req, res) => {
  res.send('hello world, from a simple authentication service');
});

// Create a new user
app.post('/user', function(req, res){
  var passwordToSave = bcrypt.hashSync(req.body.password, 10);
  let user = new User({
    email: req.body.email,
    password: passwordToSave,
    admin: req.body.admin,
    name: req.body.name
  });
  user.save(function(err, data){
    if(err){
      return res.json({error: true});
    }
    res.json({error:false})
  });
});

// Authenticate a user given email and password:
app.post('/authenticate', function(req, res){
  let data = {
    email: req.body.email
  };
  User.findOne(data).lean().exec(function(err, user){
    if(err){
      return res.json({error: true});
    }
    if(!user){
      return res.status(404).json({'message':'User not found'});
    }
    if(!bcrypt.compareSync(req.body.password, user.password)){
      return res.status(404).json({'message': 'Password does not match'});
    }
    console.log(user);
    var payload = {
      name: user.name,
      email: user.email,
      admin: user.admin
    };
    let token = jsonwebtoken.sign(payload, process.env.SECRET, {
      expiresIn: 1440 // expires in 1 hour
    });
    res.json({error: false, token: token});
  })
});

// ===== Protected Routes =====
var auth = jwt({ secret: process.env.SECRET});

// Get a list of users
// Only users with admin-role should have access to this
app.get('/user', auth, (req, res, err) => {
  if(!user.admin) {
    res.status(403).json({'message' : 'Forbidden'});
  }
  User.find({}, function(err, users) {
    var userMap = {};
    users.forEach(function(user) {
    userMap[user._id] = user;
    });
    res.send(userMap);
  });
});

// Get an individual user
// Only the user or an admin should have access to this
app.get('/user/:id', auth, (req, res) => {
  var id = req.params.id;
  User.findById(id, function(err, user) {
    if(!user){
      return res.status(404).json({'message':'User not found'});
    }
    if(err){
      return res.status(500).json({'message': 'Internal server error'});
    }
    if(req.user.email !== user.email) {
      return res.status(401).json({'message': 'Unauthorized'})
    }
    res.send(user);
  });
});

// Update user (i.e. only password can be changed for now)
//app.put('/user', function(req, res){
//  return res.status()
//});

// Delete a user.
// Only the user or an admin shold have access to this
app.delete('/user/:id', auth, (req, res) => {
  var id = req.params.id;
  User.findByIdAndRemove(id, function(err, user) {
    if(err){
      return res.status(500).json({'message': 'Internal server error'});
    }
    res.status(204).json();
  });
});

app.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    res.status(401).send({'message': 'Invalid token'});
  }
});

app.listen(3000);
console.log('Listening on localhost:3000');
