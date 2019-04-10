# a-simple-authentiation-service

A small service where a user can register and authenticate. Upon succesfull authentication a jwt will be returned.

Inspired by <https://ciphertrick.com/2017/01/11/token-based-authentication-node-js-using-jwt/>

## Prerequisites
You need to have a mongo database running.
```
docker run -p 127.0.0.1:27017:27017 --name some-mongo -d mongo
```

## Running
```
git clone https://github.com/stigbd/a-simple-authentication-service.git
cd a-simple-authentication-service
npm install
nano .env # add environment variables
npm run dev
```

### Environment variables
Put the following in a file with filename .env:
```
SECRET=secret
HOST=localhost
PORT=3003
DBHOST=localhost
DBPORT=27017
TEST_DATABASE=user
```
## Using
```
curl -i -H "Accept: application/json" -X GET http://localhost:3003/secret # should return 401 Unauthorized
curl -i -H "Content-Type: application/json" -d '{"email":"user@example.com", "password":"secret"}' -X POST http://localhost:3003/user # To create a user
curl -i -H "Content-Type: application/json" -d '{"email":"user@example.com", "password":"secret"}' -X POST http://localhost:3003/authenticate # To authenticate the user and get a jsonwebtoken
curl -i -H "Authorization: Bearer <paste in your jsontoken from the body in the preceeding call>" -X GET http://localhost:3003/secret # should return 200 Ok and a secret message in the body

```
## Testing
```
npm run start_test # to start the server in test mode
npm run test # in another terminal window
```
Use mocha and chai-http for testing:
<http://chaijs.com/plugins/chai-http/>
