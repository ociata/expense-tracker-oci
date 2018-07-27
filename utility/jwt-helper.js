const jwt = require('jsonwebtoken');
const config = require('../config/keys')

module.exports = (userId, googleId) => {

  return jwt.sign({ userId, googleId },
     config.token_secret,
    { expiresIn: 60 * 60 }); // time is in seconds
}