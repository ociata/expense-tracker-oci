//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let server = require('../index')
const config = require('../config/keys')
let mongoose = require("mongoose")
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)

const { googleDetails } = require('./test-constants')

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client("400399637600-ue5fh76ce0eif3f98kcb2nisennkh61i.apps.googleusercontent.com",
"HJayRGYKx-ss8GUa4BcSUwdG", "")

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let should = chai.should()
const assert = chai.assert

chai.use(chaiHttp)

describe('Auth', () => {
  beforeEach(async () => {
    // prepare db before each test

    // clear collection
    await User.remove({})
  })

  describe('POST /users', () => {
    it('should create user with proper token', async function () {      

      const { googleId, refreshToken, name, email } = googleDetails


      googleClient.setCredentials({
        refresh_token: refreshToken
      })

      const tokens = await googleClient.refreshAccessToken()

      const token = tokens.credentials.id_token

      var result = await chai.request(server)
                      .post(`/users?googleToken=${token}`)
                      .set('Content-Type', 'application/json')
                      .set('api_key', config.api_key)
                      .send()

      result.should.have.status(201)
      // name is not retrieved from google token
      result.body.should.have.property('userId')
      result.body.should.have.property('googleId').eql(googleId)
      result.body.should.have.property('email').eql(email)
    })
  })
})