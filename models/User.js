const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose

const userSchema = new Schema({
  googleId: String
})

mongoose.model(model.USERS_MODEL, userSchema)

