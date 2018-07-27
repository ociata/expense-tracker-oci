const { check, validationResult } = require('express-validator/check')
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)

module.exports = (app) => {
  app.post('/auth', [
    check('googleId').isLength({ max: 50 }),
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // get params
    const { googleId } = req.body

    var existingUser = null

    //make sure such user don't exists
    try {
      existingUser = await User.findOne({googleId: googleId})

    } catch (error) {
      // todo: add papertrail logs
      console.log('app.post/users', error)
    }

    if(null != existingUser) {
        
      return res.json({ 
        googleId: existingUser.googleId,
        name: existingUser.name,
        userId: existingUser.id
      })
    } else {
      res.set('content-type', 'text/plain')
      return res.status(404).send()
    }
  })
}