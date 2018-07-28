const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const checkParams = buildCheckFunction(['params'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)

module.exports = (app) => {
  app.post('/users/:userId/friends',
    [
      checkParams('userId').isLength({ min: 10 }),
      checkQuery('targetUser').isLength({ min: 10 }),
    ],
   async (req, res) => {

    const { userId } = req.params
    const { targetUser } = req.query

    // validate input
    var errors = validationResult(req)
    if (!errors.isEmpty() || userId == targetUser) {
      return res.status(422).json({ errors: errors.array() })
    }

    var relation = null
    var statusCode = 500

    try {
      // userId could be stored as first or secondUser so search for both combinations
      let query = { $or: [ {firstUser: userId, secondUser: targetUser}, {firstUser: targetUser, secondUser: userId} ] }

      relation = await Relationship.findOne(query)

      if(relation.status != 'pending') {
        statusCode = 403
      } else {
        statusCode = 200
      }

    } catch (err) {
      // unable to find relation, simply ignore to try create a new one
    }

    if(403 != statusCode && null == relation) {
      // no such relation, create new one
      try {
        relation = await new Relationship({ 
          firstUser: userId,
          secondUser: targetUser,
          status: "pending" })
          .save()

        statusCode = 201
      } catch(err) {
        // most likely the id validation failed
        return res.sendStatus(404)
      }
    }

    res.status(statusCode).json({
      requestId: relation.id,
      requestStatus: relation.status
    })
  })
}