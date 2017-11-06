'use strict';

let express = require('express');
let app = express();
let morgan = require('morgan');
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
let User = require('./models/user');

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

app.post('/user', function(req, res){
  let user = new User({
    email: req.body.email,
    password: req.body.password
  });
  user.save(function(err, data){
    if(err){
      return res.json({error: true});
    }
    res.json({error:false})
  });
});

app.get('/user', function(req, res){
  User.find({}, function(err, users) {
    var userMap = {};
    users.forEach(function(user) {
      userMap[user._id] = user;
    });
    res.send(userMap);
  });
});

app.listen(3000);
console.log('Listening on localhost:3000');
