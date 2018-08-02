const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)
const Plan = mongoose.model(model.PLAN_MODEL)
const Expense = mongoose.model(model.EXPENSE_MODEL)

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
  },

  plansWithAdminUserId: async function(userId) {
    
    var result = []

    try {
      const query = { admins: { $elemMatch: { _id: userId } } }

      result = await Plan.find(query)
    } catch(err) {
      console.log('unable to fetch plans for userId', err)
    }

    return result
  },

  addPlan: async function(description, money, userId) {

    // we do not check values here, be sure they are checked before calling this method

    var result = null

    try {
      result = await new Plan({ 
        description,
        money: {
          value: money
        },
        admins: [userId],
        expenses: []
      }).save()
    } catch(err) {
      console.log('error creating plan', err)
    }

     return result
  },

  addExpense: async function(value, description, referenceId, type) {

    var result = null

    try {
      result = await new Expense({ value, description, referenceId, type }).save()

    } catch(err) {
      console.log('unable to create expense', err)
    }

    return result
  },

  detailsForUserIds: async function(userIds) {
    var result = []

    var dbIds = userIds.map(object => { return new mongoose.Types.ObjectId(object) })

    try {
      const query = { _id: { $in: dbIds } }
      result = await User.find(query)
    } catch(err) {
      console.log('unable to fetch user details', err)
    }

    return result
  }
}