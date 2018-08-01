const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)
const { findUserRelations, relationshipsForUser, userDetailsForRelation } = require('../utility/db-helper')

module.exports = (app) => {

  app.get('/friends', async (req, res) => {

    const { userId } = req

    var results = await relationshipsForUser(userId)

    // fitler only relations that are accepted
    results = results.filter(object => {
      return object.status == 'accepted'
    })

    // retrieve information for each user
    results = await Promise.all(results.map(async object => {
      const userDetails = await userDetailsForRelation(userId, object)
      if(userDetails) {
        return {
          userId: userDetails.id,
          userName: userDetails.name
        }
      } else {
        return null
      }
    }))

    res.json(results.filter(Boolean))
  })

  app.post('/friends',
    [
      checkQuery('targetUser').isLength({ min: 10 }),
    ],
   async (req, res) => {

    const { userId } = req
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
        // user already interacted
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

  app.get('/friends/requests', (req, res) => {

  }) 
}