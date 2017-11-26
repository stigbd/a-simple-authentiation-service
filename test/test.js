'use strict'

let mongoose = require('mongoose')
mongoose.Promise = global.Promise
let User = require('../models/user')
var chai = require('chai')
var chaiHttp = require('chai-http')
var jwt = require('jsonwebtoken')

let should = chai.should()
require('dotenv').config()
chai.use(chaiHttp)
var dirtyChai = require('dirty-chai')

chai.use(dirtyChai)

let dbConnectionString = 'mongodb://' +
process.env.DBHOST +
':' +
process.env.DBPORT +
'/' +
process.env.TEST_DATABASE

before(function (done) {
  mongoose.connect(dbConnectionString, {useMongoClient: true}, function (err) {
    if (err) {
      console.error('Error connecting to mongodb: ', err.message)
    } else {
      console.log('Connected to the following db: ', dbConnectionString)
    }
  })
  done()
})

after(function (done) {
  mongoose.connection.close(function (err) {
    if (err) {
      console.error(err)
    }
    done()
  })
})

describe('/', () => {
  describe('GET /', () => {
    it('should return status code 200 when GET /', () => {
      return chai.request('http://localhost:3003')
        .get('/')
        .then(res => {
          res.should.have.status(200)
        })
        .catch(err => {
          console.error(err)
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })
})

describe('/user', () => {
  describe('/GET user', () => {
    let adminToken, userToken
    let userId, adminId

    before(function (done) {
      let user = new User({
        email: 'user',
        password: 'user',
        admin: false,
        name: 'User'
      })
      let admin = new User({
        email: 'admin',
        password: 'admin',
        admin: true,
        name: 'Admin'
      })
      var adminPayload = {
        name: admin.name,
        email: admin.email,
        admin: admin.admin
      }
      var userPayload = {
        name: user.name,
        email: user.email,
        admin: user.admin
      }
      adminToken = jwt.sign(adminPayload, process.env.SECRET, { expiresIn: 1440 })
      userToken = jwt.sign(userPayload, process.env.SECRET, { expiresIn: 1440 })

      user.save(function (err) {
        if (err) {
          console.error(err)
        }
        userId = user.id
      }) // It is now guaranteed to finish before 'it' starts.
      admin.save(function (err) {
        if (err) {
          console.error(err)
        }
        adminId = admin.id
        done()
      }) // It is now guaranteed to finish before 'it' starts.
    })

    after(function (done) {
      User.findByIdAndRemove(userId, function (err) {
        if (err) {
          console.error(err)
        }
      })
      User.findByIdAndRemove(adminId, function (err) {
        if (err) {
          console.error(err)
        }
      })
      done()
    })
    it('should return status code 200 and a list of users when GET user valid jwt and user is admin', () => {
      return chai.request('http://localhost:3003')
        .get('/user')
        .set('Authorization', 'Bearer ' + adminToken) // Should Bearer be included?
        .then(res => {
          res.should.have.status(200)
          res.should.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })

    it('should return status code 401 when GET user with invalid jwt', () => {
      return chai.request('http://localhost:3003')
        .get('/user')
        .then(res => {
          res.should.have.status(401)
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 403 when user not admin', () => {
      return chai.request('http://localhost:3003')
        .get('/user')
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(403)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })

  describe('/POST user', () => {
    after(function (done) {
      User.findOneAndRemove({email: 'newUser'}, function (err) {
        if (err) {
          console.error(err)
        }
        done()
      })
    })

    it('should return status code 201 and location header when posting new user', () => {
      let user = new User({
        email: 'newUser',
        password: 'user',
        admin: false,
        name: 'User'
      })
      return chai.request('http://localhost:3003')
        .post('/user')
        .send(user)
        .then(res => {
          res.should.have.status(201)
          res.should.have.header('Location')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 400 when email is missing', () => {
      return chai.request('http://localhost:3003')
        .post('/user')
        .send({
          password: 'userWithEmailMissing',
          admin: false,
          name: 'User'
        })
        .then(res => {
          res.should.have.status(400)
          res.should.be.json()
          res.body.should.have.property('errorName')
          res.body.errorName.should.equal('ValidationError')
          res.body.should.have.property('errorMessage')
          res.body.errorMessage.should.include('`email` is required')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 400 when password is missing', () => {
      return chai.request('http://localhost:3003')
        .post('/user')
        .send({
          email: 'userWithPasswordMissing',
          admin: false,
          name: 'User'
        })
        .then(res => {
          res.should.have.status(400)
          res.should.be.json()
          res.body.should.have.property('errorName')
          res.body.errorName.should.equal('ValidationError')
          res.body.should.have.property('errorMessage')
          res.body.errorMessage.should.include('`password` is required')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 400 when duplicate user, i.e. email', () => {
      let user = new User({
        email: 'user',
        password: 'user',
        admin: false,
        name: 'User'
      })
      return chai.request('http://localhost:3003')
        .post('/user')
        .send(user)
        .then(res => {
          res.should.have.status(400)
          res.should.be.json()
          res.body.should.have.property('errorName')
          res.body.errorName.should.equal('DuplicationError')
          res.body.should.have.property('errorMessage')
          res.body.errorMessage.should.include('User already exists')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })
})

describe('/user/:id', () => {
  describe('/GET user/:id', () => {
    let adminId, userId

    let user = new User({
      email: 'user',
      password: 'user',
      admin: false,
      name: 'User'
    })
    let admin = new User({
      email: 'admin',
      password: 'admin',
      admin: false,
      name: 'Admin'
    })
    var userPayload = {
      name: user.name,
      email: user.email,
      admin: user.admin
    }
    let userToken = jwt.sign(userPayload, process.env.SECRET, { expiresIn: 1440 })

    before(function (done) {
      user.save(function (err) {
        if (err) {
          console.error(err)
        }
        userId = user.id
      }) // It is now guaranteed to finish before 'it' starts.
      admin.save(function (err) {
        if (err) {
          console.error(err)
        }
        adminId = admin.id
        done()
      }) // It is now guaranteed to finish before 'it' starts.
    })

    after(function (done) {
      User.findByIdAndRemove(userId, function (err) {
        if (err) {
          console.error(err)
        }
      })
      User.findByIdAndRemove(adminId, function (err) {
        if (err) {
          console.error(err)
        }
        done()
      })
    })

    it('should return status code 200 and a user-object when good jwt and user is identical to caller', () => {
      return chai.request('http://localhost:3003')
        .get('/user/' + userId)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(200)
          res.should.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 404 when nonExistingUser', () => {
      var id = require('mongoose').Types.ObjectId()
      return chai.request('http://localhost:3003')
        .get('/user/' + id)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(404)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 401 when bad jwt', () => {
      return chai.request('http://localhost:3003')
        .get('/user/' + userId)
        .set('Authorization', 'Bearer ' + 'badUserToken')
        .then(res => {
          res.should.have.status(401)
          res.should.be.json()
          res.body.should.have.property('message')
          res.body.message.should.equal('Invalid token')
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 403 when user is different from caller', () => {
      return chai.request('http://localhost:3003')
        .get('/user/' + adminId)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(403)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })

  describe('/PUT user/:id', () => {
    let adminId, userId

    let user = new User({
      email: 'user',
      password: 'user',
      admin: false,
      name: 'User'
    })
    let admin = new User({
      email: 'admin',
      password: 'admin',
      admin: false,
      name: 'Admin'
    })
    var userPayload = {
      name: user.name,
      email: user.email,
      admin: user.admin
    }
    let userToken = jwt.sign(userPayload, process.env.SECRET, { expiresIn: 1440 })

    before(function (done) {
      user.save(function (err) {
        if (err) {
          console.error(err)
        }
        userId = user.id
      }) // It is now guaranteed to finish before 'it' starts.
      admin.save(function (err) {
        if (err) {
          console.error(err)
        }
        adminId = admin.id
        done()
      }) // It is now guaranteed to finish before 'it' starts.
    })

    after(function (done) {
      User.findByIdAndRemove(userId, function (err) {
        if (err) {
          console.error(err)
          throw err
        }
      })
      User.findByIdAndRemove(adminId, function (err) {
        if (err) {
          console.error(err)
          throw err
        }
        done()
      })
    })

    it('should return status code 204 when user is updated with good jwt', () => {
      return chai.request('http://localhost:3003')
        .put('/user/' + userId)
        .set('Authorization', 'Bearer ' + userToken)
        .send(user)
        .then(res => {
          res.should.have.status(204)
          res.should.not.be.json()
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 404 when user not found', () => {
      var id = require('mongoose').Types.ObjectId()
      return chai.request('http://localhost:3003')
        .put('/user/' + id)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(404)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 401 when bad jwt', () => {
      return chai.request('http://localhost:3003')
        .put('/user/' + userId)
        .set('Authorization', 'Bearer ' + 'badUserToken')
        .then(res => {
          res.should.have.status(401)
          res.should.be.json()
          res.body.should.have.property('message')
          res.body.message.should.equal('Invalid token')
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 403 user is different from caller', () => {
      return chai.request('http://localhost:3003')
        .put('/user/' + adminId)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(403)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })

  describe('/DELETE user/:id', () => {
    let adminId, userId

    let user = new User({
      email: 'user',
      password: 'user',
      admin: false,
      name: 'User'
    })
    let admin = new User({
      email: 'admin',
      password: 'admin',
      admin: false,
      name: 'Admin'
    })
    var userPayload = {
      name: user.name,
      email: user.email,
      admin: user.admin
    }
    let userToken = jwt.sign(userPayload, process.env.SECRET, { expiresIn: 1440 })

    before(function (done) {
      user.save(function (err) {
        if (err) {
          console.error(err)
        }
        userId = user.id
      }) // It is now guaranteed to finish before 'it' starts.
      admin.save(function (err) {
        if (err) {
          console.error(err)
        }
        adminId = admin.id
        done()
      }) // It is now guaranteed to finish before 'it' starts.
    })

    after(function (done) {
      User.findByIdAndRemove(userId, function (err) {
        if (err) {
          console.error(err)
          throw err
        }
      })
      User.findByIdAndRemove(adminId, function (err) {
        if (err) {
          console.error(err)
          throw err
        }
        done()
      })
    })

    it('should return status code 204 when user is deleted with good jwt', () => {
      return chai.request('http://localhost:3003')
        .delete('/user/' + userId)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(204)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 404 when user not found', () => {
      var id = require('mongoose').Types.ObjectId()
      return chai.request('http://localhost:3003')
        .delete('/user/' + id)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(404)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 401 when bad jwt', () => {
      return chai.request('http://localhost:3003')
        .delete('/user/' + userId)
        .set('Authorization', 'Bearer ' + 'badUserToken')
        .then(res => {
          res.should.have.status(401)
          res.should.be.json()
          res.body.should.have.property('message')
          res.body.message.should.equal('Invalid token')
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 403 user is different from caller', () => {
      return chai.request('http://localhost:3003')
        .delete('/user/' + adminId)
        .set('Authorization', 'Bearer ' + userToken)
        .then(res => {
          res.should.have.status(403)
          res.should.not.be.json()
        })
        .catch(err => {
        // console.error(err);
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })
})

describe('/authenticate', () => {
  describe('/POST authenticate', () => {
    let userId
    before(function (done) {
      let user = new User({
        email: 'user',
        password: 'user',
        admin: false,
        name: 'User'
      })
      user.save(function (err) {
        if (err) {
          console.error(err)
        }
        userId = user.id
        done()
      })
    })

    after(function (done) {
      User.findByIdAndRemove(userId, function (err) {
        if (err) {
          console.error(err)
        }
      })
      done()
    })

    it('should return status code 200 and a jwt when good username/password', () => {
      return chai.request('http://localhost:3003')
        .post('/authenticate')
        .send({
          email: 'user',
          password: 'user'
        })
        .then(res => {
          res.should.have.status(200)
          res.should.be.json()
          res.body.should.have.property('token')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 401 and message with bad username', () => {
      return chai.request('http://localhost:3003')
        .post('/authenticate')
        .send({
          email: 'badUsername',
          password: 'user'
        })
        .then(res => {
          res.should.have.status(401)
          res.should.be.json()
          res.body.should.have.property('message')
          res.body.message.should.equal('Bad username')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
    it('should return status code 401 and message with bad password', () => {
      return chai.request('http://localhost:3003')
        .post('/authenticate')
        .send({
          email: 'user',
          password: 'badPassword'
        })
        .then(res => {
          res.should.have.status(401)
          res.should.be.json()
          res.body.should.have.property('message')
          res.body.message.should.equal('Bad password')
        })
        .catch(err => {
          throw err // Re-throw the error if the test should fail when an error happens
        })
    })
  })
})
