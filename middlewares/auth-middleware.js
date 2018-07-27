const jwtHelper = require('../utility/jwt-helper')

module.exports = (app) => {

  app.use((req, res, next) => {

    // skip auth and register paths
    const { path, method } = req

    if(path == "/auth" || (path == "/user" && method == 'POST')) {
      return next()
    }

    const token = req.headers['bearerauth']    

    if(typeof token != 'undefined' && token != null) {

      let decodedInfo = jwtHelper.verify(token)

      console.log(decodedInfo)
      

      if(decodedInfo != null) {
        next()
      }
    }

    // failed to verify token, return
    res.status(401).send()
  })
}