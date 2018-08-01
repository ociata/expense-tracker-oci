const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)

module.exports = {
  relationshipsForUser: async function(userId) {
    var results = []

    let query = { $or: [ {firstUser: userId}, {secondUser: userId} ] }

    try {
      results = await Relationship.find(query)
    } catch(err) {
      console.log('user relationships fail', err)
    }

    return results
  },

  userDetailsForRelation: async function(userId, relation) {

    const otherUserId = !relation.firstUser.equals(userId) ? relation.firstUser : relation.secondUser

    var otherUser = null

    try {
      otherUser = await User.findById(otherUserId)
    } catch(err) {
      console.log('retrieving user detials', err)
    }

    return otherUser
  },

  relationForId: async function(relationId) {

    var result = null

    try {
      result = Relationship.findById(relationId)
    } catch (err) {
      console.log('unable to fetch relation', err)
    }

    return result
  }
}