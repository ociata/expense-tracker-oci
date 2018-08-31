const { check, validationResult } = require('express-validator/check')
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const InsecureSession = mongoose.model(model.INSECURE_SESSION_MODEL)
const jwtHelper = require('../utility/jwt-helper')
const { verifyTokenValue } = require('../utility/google-token-helper')

module.exports = (app, googleClient) => {
  app.post('/auth', [
    check('googleId').isLength({ min: 10 }),
    check('googleToken').isLength({ min: 10 })
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // get params
    const { googleId, googleToken } = req.query

    var idToUse = null

    // verify provided google token
    idToUse = await verifyTokenValue(googleClient, googleToken)

    if(!idToUse) {
      // token missing, check insecure sessions
      try {
        const storedSession = await InsecureSession.findOne({userReference: googleId})
        
        if (!storedSession) {
          // no session, obviosly return
          return res.sendStatus(409)
        }

        googleClient.setCredentials({
          refresh_token: storedSession.refreshToken
        })
  
        // refresh access tokens
        const tokens = await googleClient.refreshAccessToken()
  
        // get token info
        // const tokenInfo = await googleClient.getTokenInfo(tokens.access_token)
        
        idToUse = await verifyTokenValue(googleClient, tokens.credentials.id_token)

        if (idToUse != googleId) {
          return res.sendStatus(409)
        }

      } catch(err) {
        console.log("POST /auth", err)
        return res.sendStatus(409)
      }
    }

    var existingUser = null

    //make sure such user don't exists
    try {
      existingUser = await User.findOne({googleId: idToUse})

    } catch (error) {
      // todo: add papertrail logs
      console.log('app.post/users', error)
    }

    if(null != existingUser) {
      
      // generate token and return it
      let token = jwtHelper.sign(existingUser.id, existingUser.googleId)

      res.set('Auth-Token', token)

      return res.json({ 
        googleId: existingUser.googleId,
        name: existingUser.name,
        email: existingUser.email,
        userId: existingUser.id
      })
    } else {
      res.set('content-type', 'text/plain')
      return res.status(404).send()
    }
  })
}
