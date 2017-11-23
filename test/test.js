let mongoose = require('mongoose');
mongoose.Promise = global.Promise;
let User = require('../models/user');
var chai = require('chai');
var chaiHttp = require('chai-http');
var jwt = require('jsonwebtoken');
let should = chai.should();
let dotenv = require('dotenv').config();
chai.use(chaiHttp);
let adminToken, userToken;

let user = new User({
  email: 'user',
  password: 'user',
  admin: false,
  name: 'User'
});
let admin = new User({
  email: 'admin',
  password: 'admin',
  admin: true,
  name: 'Admin'
});

before(function (done) {
  dbConnectionString =
  'mongodb://'
  + process.env.DBHOST
  + ':'
  + process.env.DBPORT
  + '/'
  + process.env.TEST_DATABASE;
  mongoose.connect(dbConnectionString, {useMongoClient: true}, function(err, db) {
    if (err) {
        console.error('Error connecting to mongodb: ', error.message);
    } else {
      console.log('Connected to the following db: ', dbConnectionString);
    }
  });
  done();
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
    var adminPayload = {
      name: admin.name,
      email: admin.email,
      admin: admin.admin
    };
    var userPayload = {
      name: user.name,
      email: user.email,
      admin: user.admin
    };
    adminToken = jwt.sign(adminPayload, process.env.SECRET, { expiresIn: 1440 });
    userToken = jwt.sign(userPayload, process.env.SECRET, { expiresIn: 1440 });
    user.save();
    admin.save();
    done();
  });

  after(function(done) {
    User.collection.remove();
    done();
  });

  describe('/GET user', () => {
    it('should return status code 200 and a list of users when valid jwt and user is admin', () => {
      return chai.request('http://localhost:3003')
      .get('/user')
      .set('Authorization', 'Bearer ' + adminToken) // Should Bearer be included?
      .then(res => {
        res.should.have.status(200);
        res.should.be.json;
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
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
    it('should return status code 403 when user not admin', () => {
      return chai.request('http://localhost:3003')
      .get('/user')
      .set('Authorization', 'Bearer ' + userToken)
      .then(res => {
        res.should.have.status(403);
        res.should.not.be.json;
      })
      .catch(err => {
        // console.error(err);
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
  });

  describe('/POST user', () => {
    before(function(done) {
      User.collection.remove(function(err, removed) {
        if(err) {
          console.error(err);
        }
      });
      done();
    });
    it('should return status code 201 and location header when posting new user', () => {
      user.email = 'newUser';
      return chai.request('http://localhost:3003')
      .post('/user')
      .send(user)
      .then(res => {
        res.should.have.status(201);
        res.should.have.header('Location');
      })
      .catch(err => {
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
    it('should return status code 400 when email is missing', () => {
      return chai.request('http://localhost:3003')
      .post('/user')
      .send({
        password: 'userWithEmailMissing',
        admin: false,
        name: 'User'
        })
      .then(res => {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property("errorName");
        res.body.errorName.should.equal("ValidationError");
        res.body.should.have.property("errorMessage");
        res.body.errorMessage.should.include("`email` is required");
      })
      .catch(err => {
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
    it('should return status code 400 when password is missing', () => {
      return chai.request('http://localhost:3003')
      .post('/user')
      .send({
        email: 'userWithPasswordMissing',
        admin: false,
        name: 'User'
        })
      .then(res => {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property("errorName");
        res.body.errorName.should.equal("ValidationError");
        res.body.should.have.property("errorMessage");
        res.body.errorMessage.should.include("`password` is required");
      })
      .catch(err => {
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
    it('should return status code 400 when duplicate user, i.e. email', () => {
      user.email = 'newUser';
      return chai.request('http://localhost:3003')
      .post('/user')
      .send(user)
      .then(res => {
        res.should.have.status(400);
        res.should.be.json;
        res.body.should.have.property("errorName");
        res.body.errorName.should.equal("DuplicationError");
        res.body.should.have.property("errorMessage");
        res.body.errorMessage.should.include("User already exists");
      })
      .catch(err => {
        throw err; // Re-throw the error if the test should fail when an error happens
      });
    });
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
    it('should return status code 401 and message with bad username');
    it('should return status code 401 and message with bad password');
  });
});
