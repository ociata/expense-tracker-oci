const jwtHelper = require('../utility/jwt-helper')

module.exports = (app) => {

  app.use((req, res, next) => {

    // skip auth and register paths
    const { path, method } = req

    if(path == "/auth" || (path == "/users" && method == 'POST')) {
      return next()
    }

    const bearer = req.headers['authorization'].split(' ')

    if(typeof bearer != 'undefined' && bearer != null && bearer.length == 2) {

      const token = bearer[1]

      let decodedInfo = jwtHelper.verify(token)      

      if(decodedInfo != null) {
        req.userId = decodedInfo.userId
        return next()
      }
    }

    // failed to verify token, return
    res.status(401).send()
  })
}