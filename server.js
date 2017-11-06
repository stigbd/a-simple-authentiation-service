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
