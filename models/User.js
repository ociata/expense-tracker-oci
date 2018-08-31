const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose

const userSchema = new Schema({
  googleId: { type: String, required: true },
  email: String,
  name: String,
  refresh_token: { type: String, required: false, default: null }
})

mongoose.model(model.USERS_MODEL, userSchema)

