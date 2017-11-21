var chai = require('chai');
var chaiHttp = require('chai-http');
let should = chai.should();
chai.use(chaiHttp);

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
  describe('/GET user', () => {
    it('should return status code 401 with no Authentication header');
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
    it('should return status code 200 and a list of users when user is admin');
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
    it('should return status code 401 with bad username/password');
    it('should return status code 200 and a jwt when good username/password');
  });
});
