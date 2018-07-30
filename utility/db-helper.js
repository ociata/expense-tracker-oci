const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)

module.exports = {
  
}