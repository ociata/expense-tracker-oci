const { check, validationResult } = require('express-validator/check')
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const InsecureSession = mongoose.model(model.INSECURE_SESSION_MODEL)
const { verifyTokenValue } = require('../utility/google-token-helper')

module.exports = (app, googleClient) => {
  app.delete('/security', [
    check('googleId').isLength({ min: 10 }),
    check('serverCode').isLength({ min: 10 })
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // get params
    const { googleId, serverCode } = req.query

    var serverPayload = null

    // server is responsible to obtain id_token
    try {
      // Now that we have the code, use that to acquire tokens.
      const { tokens } = await googleClient.getToken(serverCode)
      serverPayload = tokens
      console.log(serverPayload)

    } catch (err) {
      console.log("DELETE /security", err)
      return res.status(500).send(err)
    }

    if(!serverPayload) {
      // store refresh token
      return res.sendStatus(400)
    }
    
    const tokenGoogleId = await verifyTokenValue(googleClient, serverPayload.id_token)

    if (tokenGoogleId != googleId) {
      return res.sendStatus(500)
    }

    await new InsecureSession({ userReference: googleId, refreshToken: serverPayload.refresh_token }).save()

    res.status(200).json({
      updatedGoogleToken: serverPayload.id_token
    })
  }) 
}