const jwtHelper = require('../utility/jwt-helper')
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = "400399637600-gk47ln8f1rgfnr3kb1r07bd6mb4b1dtl.apps.googleusercontent.com"
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const client = new OAuth2Client("400399637600-ue5fh76ce0eif3f98kcb2nisennkh61i.apps.googleusercontent.com",
"HJayRGYKx-ss8GUa4BcSUwdG", "")

module.exports = (app) => {

  app.use(async (req, res, next) => {

    // skip auth and register paths
    const { path, method } = req

    if(path == "/auth" || (path == "/users" && method == 'POST')) {

      const { code } = req.query

      var googleIdToken = null

      if(code) {
        // server is responsible to obtain id_token
        try {
          // Now that we have the code, use that to acquire tokens.
          const serverPayload = await client.getToken(code)
          console.log(serverPayload)

        } catch (err) {
          console.log("auth middleware", err)
          return res.status(500).send(err)
        }
      }

      if(!googleIdToken) {
        // code is not provided, obtain id_token as param
        googleIdToken = req.query.googleToken
      }

      if(!googleIdToken || googleIdToken.length < 10) {
        return res.sendStatus(422)
      }

      // update library refresh token if applicable
      const userFromDb = await User.findOne({ googleId: googleIdToken })

      client.setCredentials({
        refresh_token: userFromDb.refresh_token
      })

      // refresh access tokens
      const { tokens } = await client.refreshAccessToken()

      // get token info
      const tokenInfo = await oAuth2client.getTokenInfo(tokens.access_token)

      console.log(tokenInfo)
      

      // verify provided google token
      try {
        const ticket = await client.verifyIdToken({
          idToken: googleToken,
          audience: GOOGLE_CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
          // Or, if multiple clients access the backend:
          //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
        });

        const payload = ticket.getPayload()
        
        req.googleId = payload['sub']
        req.googleName = payload['name']
        req.googleEmail = payload['email']

        return next()
      } catch(err) {
        console.log("processing google token", err)
        return res.sendStatus(401)
      }
    }

    const bearer = req.headers['authorization'].split(' ')

    if(typeof bearer != 'undefined' && bearer != null && bearer.length == 2) {

      const token = bearer[1]

      let decodedInfo = jwtHelper.verify(token)      

      if(decodedInfo != null) {
        req.userId = decodedInfo.userId
        req.googleId = decodedInfo.googleId
        return next()
      }
    }

    // failed to verify token, return
    res.status(401).send()
  })
}