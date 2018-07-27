const config = require('../config/keys')

module.exports = (app) => {
  app.use((req, res, next) => {
    const { api_key } = req.headers
    if(typeof api_key == 'undefined' || api_key == null || api_key != config.api_key) {
      //provided api key is missing or wrong
      return res.status(401).send()
    }

    next()
  })
}