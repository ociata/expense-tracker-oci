//During the test the env variable is set to test
process.env.NODE_ENV = 'test';

let server = require('../index')

const config = require('../config/keys')

let mongoose = require("mongoose")
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const InsecureSession = mongoose.model(model.INSECURE_SESSION_MODEL)

const { googleDetails } = require('./test-constants')

//Require the dev-dependencies
let chai = require('chai')
let chaiHttp = require('chai-http')
let should = chai.should()
const expect = chai.expect;

chai.use(chaiHttp)

describe('Auth', () => {
  beforeEach(async () => {
    // prepare db before each test

    // clear collections
    await User.remove({})
    await InsecureSession.remove({})

    const { googleId, name, email, refreshToken } = googleDetails

    // store
    await new User({ googleId, name, email}).save()
    await new InsecureSession({ userReference: googleId, refreshToken }).save()
  })

  describe('POST /auth', () => {
    it('should auth with expired token when security off', (done) => {      
      const expiredToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjQwYzZiMDliNDQ5NjczNDUzYzNkYTY5OWUyZGY1NTI3ZjkxZTY4MDMifQ.eyJhenAiOiI0MDAzOTk2Mzc2MDAtZ2s0N2xuOGYxcmdmbnIza2IxcjA3YmQ2bWI0YjFkdGwuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiI0MDAzOTk2Mzc2MDAtZ2s0N2xuOGYxcmdmbnIza2IxcjA3YmQ2bWI0YjFkdGwuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMTM1ODI5MDYxODAzNzA4ODc2NTAiLCJoZCI6InRvZG9yb3YuaW8iLCJlbWFpbCI6Im9jaUB0b2Rvcm92LmlvIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImF0X2hhc2giOiJ3WDNNU0tKbnRzYjNnZ082b0dNOU5RIiwiZXhwIjoxNTMzNDc3MTcwLCJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJpYXQiOjE1MzM0NzM1NzAsIm5hbWUiOiJIcmlzdG8gVG9kb3JvdiIsInBpY3R1cmUiOiJodHRwczovL2xoNi5nb29nbGV1c2VyY29udGVudC5jb20vLXQwVVVJY1h0TWR3L0FBQUFBQUFBQUFJL0FBQUFBQUFBQUFBL0FBbm5ZN3Azc0hEMC1Uc0lieHZBRmFVRkVQOGpjeU9uLVEvczk2LWMvcGhvdG8uanBnIiwiZ2l2ZW5fbmFtZSI6IkhyaXN0byIsImZhbWlseV9uYW1lIjoiVG9kb3JvdiIsImxvY2FsZSI6ImVuIn0.KpXfyR-dM1uaoVNE6DPMQdZvul3lHl0l5InLpWdxKzPwnHOwY0k3paEpUNjy7o8zAihpOPlLq4C6Hi_ctbHvDFi0TbTLZLkhrvll4tHAaTIwm9gGamVdEfAeL_JAITCkC0VUfTmA_HXV3pkjZezI_1mmiavQyU9fQkT0asUUGXw5-RY8Cu_461eZFqrqhvG-8NvB5XRbTZFI5P5oKiqoCiR2jpKpTmsaQsBRaTFNSqpHXP5gtbCPRCwL1FKmFnjv_HZCP8FtMOdazGOSrbs-V9M7Akm773gzG0-Lt_vpes14kj5kmrLa-G9JV1Ye6006g2OeegkUGl8RV_TkaPr9QQ"

      const { googleId, name, email } = googleDetails

      chai.request(server)
        .post(`/auth?googleToken=${expiredToken}&googleId=${googleId}`)
        .set('Content-Type', 'application/json')
        .set('api_key', config.api_key)
        .send()
        .end(async (err, res) => {
        
          var passErr = null

          try {
            // check provided user to match db
            const user = await User.findOne({ googleId })
            res.body.should.have.property('userId').eql(user.id)
          } catch (err) {
            passErr = err
          }

          res.should.have.status(200)
          res.body.should.have.property('googleId').eql(googleId)
          res.body.should.have.property('name').eql(name)
          res.body.should.have.property('email').eql(email)
          done(passErr)
        })
    })
  })
})