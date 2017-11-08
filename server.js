'use strict';

let express = require('express');
let app = express();
let morgan = require('morgan');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let User = require('./models/user');
let bcrypt = require('bcrypt');
let jwt = require('jsonwebtoken');
let dotenv = require('dotenv').config();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('combined'))

// Set up mongodb connection
mongoose.connect("mongodb://localhost/demo", {useMongoClient: true});


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
    password: passwordToSave
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
    let token = jwt.sign(user, process.env.SECRET, {
      expiresIn: 1440 // expires in 1 hour
    });
    res.json({error: false, token: token});
  })
});

// ===== Protected Routes =====

// Get a list of users
// Only users with admin-role should have access to this
app.get('/user', (req, res) => {
  // if (!req.headers.authorization) {
  //     return res.status(401).json({'message':'Unauthorized'});
  // }
  let decoded = jwt.verify(req.headers.authorization, process.env.SECRET, function(err, decoded) {
    if (err) {
      console.error(err.stack);
      return res.status(401).json({'message':'Unauthorized'});
    }
    User.find({}, function(err, users) {
      var userMap = {};
      users.forEach(function(user) {
        userMap[user._id] = user;
      });
      res.send(userMap);
    });
  });
});

// Get an individual user
// Only the user or an admin should have access to this
app.get('/user/:id', (req, res) => {
  var id = req.params.id;
  console.log('get user-id', id);
  User.findById(id, function(err, user) {
    if(!user){
      return res.status(404).json({'message':'User not found'});
    }
    if(err){
      return res.status(500).json({'message': 'Internal server error'});
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
app.delete('/user/:id', (req, res) => {
  var id = req.params.id;
  console.log('delete user-id', id);
  User.findByIdAndRemove(id, function(err, user) {
    if(err){
      return res.status(500).json({'message': 'Internal server error'});
    }
    res.status(204).json();
  });
});

app.listen(3000);
console.log('Listening on localhost:3000');
