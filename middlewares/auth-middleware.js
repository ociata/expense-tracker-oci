const jwtHelper = require('../utility/jwt-helper')
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = "400399637600-gk47ln8f1rgfnr3kb1r07bd6mb4b1dtl.apps.googleusercontent.com"
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

module.exports = (app) => {

  app.use(async (req, res, next) => {

    // skip auth and register paths
    const { path, method } = req

    if(path == "/auth" || (path == "/users" && method == 'POST')) {

      const { googleToken } = req.query

      if(!googleToken || googleToken.length < 10) {
        return res.sendStatus(422)
      }

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