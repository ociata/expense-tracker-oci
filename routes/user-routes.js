const { validationResult, buildCheckFunction, check } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)
const jwtHelper = require('../utility/jwt-helper')

module.exports = (app) => {
  app.get('/users', async (req, res) => {

    const { userId } = req

    var result = []

    try {
      
      result = await User.find({ _id: { $ne: userId } })

      // retrieve all user relations and append them
      const query = { $or: [ {firstUser: userId}, {secondUser: userId} ] }
      const relations = await Relationship.find(query)

      result = result.map((userObj) => {

        var relation = 'none'
        //check in all relations whether user is there
        for (var i = 0; i < relations.length; i++) {
          const relationObj = relations[i]
          
          if(relationObj.firstUser.equals(userObj.id) || relationObj.secondUser.equals(userObj.id)) {
            if(relationObj.status) {
              relation = relationObj.status
            }
            break
          }
      }

        return {
          name: userObj.name,
          userId: userObj.id,
          relation: relation
        }
      })
    } catch(err) {
      // todo: add papertrail logs
      console.log(err)
    }

    res.json(result)
  })

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

    // generate token and return it
    let token = jwtHelper.sign(createdUser.id, createdUser.googleId)
    res.set('Auth-Token', token)

    // return newly created user together with his id from db
    res.status(201).json({ 
      googleId: createdUser.googleId,
      name: createdUser.name,
      userId: createdUser.id
    })
  })

  app.put('/users', async (req, res) => {

    const { userId } = req
    const { name } = req.body

    var userRecord = null

    // try updating user record
    try {
      userRecord = await User.findByIdAndUpdate(userId, {name}, {new: true})

    } catch (err) {
      // todo: add papertrail log
      console.log(err)
    }

    if(null == userRecord) {
      res.sendStatus(404)
    } else {
      res.status(200).json({ 
        googleId: userRecord.googleId,
        name: userRecord.name,
        userId: userRecord.id
      })
    }
  })

  app.delete('/users', async (req, res) => {

    const { userId, googleId } = req

    if(googleId.indexOf('rg') != 0) {
      //only allow random/generic users for deletion
      return res.sendStatus(401)
    }

    var statusCode = 500

    try {
      await User.findById(userId).remove()
      statusCode = 202
    } catch(err) {
      console.log(err)
    }

    res.sendStatus(statusCode)
  }) 
}