const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose
const User = mongoose.model(model.USERS_MODEL)

const insecureSessionSchema = new Schema({
  refreshToken: { type: String, required: true },
  userReference: { 
    type: String,
    required: true,
    validate: (value) => {
      return new Promise((res, rej) => {
        User.findOne({googleId: value}, (err, doc) => {
          res(!err && doc)
        })
      })
    }
  }
})

mongoose.model(model.INSECURE_SESSION_MODEL, insecureSessionSchema)