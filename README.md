# a-simple-authentiation-service

A small service where a user can register and authenticate. Upon succesfull authentication a jwt will be returned.

Inspired by <https://ciphertrick.com/2017/01/11/token-based-authentication-node-js-using-jwt/>

Use ```docker run -p 127.0.0.1:27017:27017 --name some-mongo -d mongo```
to start mongodb

## Usage
```
git clone https://github.com/stigbd/a-simple-authentication-service.git
cd a-simple-authentication-service
npm install
nano .env # add environment variables
npm run dev
```

### Environment variables
Example:
```
SECRET=secret
HOST=localhost
PORT=3003
DBHOST=localhost
DBPORT=27017
TEST_DATABASE=user
```

## Testing
```
npm run start_test # to start the server in test mode
npm run test # in another terminal window
```
Use mocha and chai-http for testing:
<http://chaijs.com/plugins/chai-http/>
