const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)
const { relationshipsForUser, userDetailsForRelation, relationForId } = require('../utility/db-helper')

module.exports = (app) => {

  app.get('/friends', async (req, res) => {

    const { userId } = req
    var status = req.query.status

    var results = await relationshipsForUser(userId)

    if(status) {
      status = status.split(',')
      // fitler relation results
      results = results.filter(object => {
        return status.includes(object.status)
      })
    }

    // retrieve information for each user
    results = await Promise.all(results.map(async object => {
      const userDetails = await userDetailsForRelation(userId, object)
      if(userDetails) {
        return {
          targetUser: {
            userId: userDetails.id,
            name: userDetails.name,
            email: userDetails.email
          },
          requestId: object.id,
          requestStatus: object.status,
          myRequest: object.firstUser.equals(userId)
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

    // get user details
    const targetUserDetails = await User.findById(targetUser)

    res.status(statusCode).json({
      requestId: relation.id,
      requestStatus: relation.status,
      myRequest: relation.firstUser.equals(userId),
      targetUser: {
        userId: targetUserDetails.id,
        name: targetUserDetails.name,
        email: targetUserDetails.email,
      }
    })
  })

  app.patch(
    '/friends',
    [
      checkQuery('requestId').isLength({ min: 10 }),
      checkQuery('accept').isBoolean()
    ],
    async (req,res) => {

      // validate input
      var errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      const { userId } = req
      const { requestId, accept } = req.query 

      // find the relation in db and make sure accepting person is second user to prevent self accept from the issuer
      var relation = await relationForId(requestId)
      if(!relation || !relation.secondUser.equals(userId)) {
        return res.sendStatus(404)
      }

      // update status
      relation.status = accept == 'true' ? "accepted" : "rejected"
      relation = await relation.save()

      res.json({
        requestId: relation.id,
        requestStatus: relation.status
      })
  })
}