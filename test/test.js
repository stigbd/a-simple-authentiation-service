let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let User = require('../models/user');
var chai = require('chai');
var chaiHttp = require('chai-http');
var jwt = require('jsonwebtoken');
let should = chai.should();
let dotenv = require('dotenv').config();
chai.use(chaiHttp);

before(function (done) {
  mongoose.connect('mongodb://localhost/test', {useMongoClient: true}, done);
});

after(function(){
  mongoose.connection.close()
});

describe('/', () => {
  describe('GET /', () => {
    it('should return status code 200 when GET /', () => {
      return chai.request('http://localhost:3003')
      .get("/")
      .then(res => {
        res.should.have.status(200);
      })
      .catch(err => {
        console.error(err);
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
  });
});

describe('/user', () => {
  before(function(done) {
    let user = new User({
      email: 'req.body.email',
      password: 'passwordToSave',
      admin: 'req.body.admin',
      name: 'req.body.name'
      });
    user.save(done);
  });

  describe('/GET user', () => {
    it('should return status code 200 and a list of users when valid jwt and user is admin', () => {
      var token = jwt.sign({
        id: 1,
      }, process.env.SECRET, { expiresIn: 60*60 });
      return chai.request('http://localhost:3003')
      .get('/user')
      .set('Authorization', token)
      .then(res => {
        res.should.have.status(200);
        // check for valid list
      })
      .catch(err => {
        // console.error(err);
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });

    it('should return status code 401 when GET user with invalid jwt', () => {
      return chai.request('http://localhost:3003')
      .get("/user")
      .then(res => {
        res.should.have.status(401);
      })
      .catch(err => {
        //console.error(err);
        //throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
    it('should return status code 403 when user not admin');
  });
  describe('/POST user', () => {
    it('should return status code 201 and location header when posting new user');
    it('should return status code 400 when username is missing');
    it('should return status code 400 when password is missing');
  });
});

describe('/user/:id', () => {
  describe('/GET user/:id', () => {
    it('should return status code 200 and a user-object when good jwt');
    it('should return status code 403 when user is different from caller');
  });
});

describe('/authenticate', () => {
  describe('/POST authenticate', () => {
    it('should return status code 200 and a jwt when good username/password');
    it('should return status code 401 with bad username/password');
  });
});
