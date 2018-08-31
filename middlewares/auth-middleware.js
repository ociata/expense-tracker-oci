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

    if(path == "/auth" || (path == "/users" && method == 'POST') || path == '/security') {
      // skip auth
      return next()
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