const { check, validationResult } = require('express-validator/check')
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)

module.exports = (app) => {
  app.post('/users', [
    check('googleId').isLength({ min: 10, max: 50 }),
  ], async (req, res) => {

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    // get params
    const { googleId, name } = req.body

    var createdUser = null

    //make sure such user don't exists
    try {
      createdUser = await User.findOne({googleId: googleId})
      if(null != createdUser) {
        res.set('content-type', 'text/plain')
        return res.status(409).send("Requested resource cannot be created as it already exists")
      }      

      createdUser = await new User({ googleId, name }).save()

    } catch (error) {
      // todo: add papertrail logs
      console.log('app.post/users', error)
    }

    // return newly created user together with his id from db
    res.status(201).json({ 
      googleId: createdUser.googleId,
      name: createdUser.name,
      userId: createdUser.id
    })
  })
}