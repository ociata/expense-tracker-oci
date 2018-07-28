const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose
const User = mongoose.model(model.USERS_MODEL)

const relationshipSchema = new Schema({
  firstUser: { 
    type: Schema.Types.ObjectId,
    refs: model.USERS_MODEL,
    required: true,
    validate: (value) => {
      return new Promise((res, rej) => {
        User.findById({_id: value}, (err, doc) => {
          res(!err && doc)
        })
      })
    }
  },
  secondUser: {
    type: Schema.Types.ObjectId,
    refs: model.USERS_MODEL,
    required: true,
    validate: (value) => {
      return new Promise((res, rej) => {
        User.findById({_id: value}, (err, doc) => {
          res(!err && doc)
        })
      })
    }
   },
  status: {
    type: String,
    required: true,
    enums: [
      "pending",
      "accepted",
      "rejected"
    ]
  }
})

mongoose.model(model.RELATIONSHIP_MODEL, relationshipSchema)
