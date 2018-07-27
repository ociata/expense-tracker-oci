const jwt = require('jsonwebtoken');
const config = require('../config/keys')

module.exports = {
  
  sign: (userId, googleId) => {

    return jwt.sign({ userId, googleId },
      config.token_secret,
     { expiresIn: 60 * 60 }); // time is in seconds
  },

  verify: (token) => {
    var decoded = null

    try {
      decoded = jwt.verify(token, config.token_secret)
    } catch (err) {
      // todo: add logging solution
      console.log(err)
    }

    return decoded
  }
}