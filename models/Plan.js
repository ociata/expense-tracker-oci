const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose
const User = mongoose.model(model.USERS_MODEL)
const Expense = mongoose.model(model.EXPENSE_MODEL)

const planSchema = new Schema({

  description: { type: String, required: true },
  admins: [{
    type: Schema.Types.ObjectId,
    refs: model.USERS_MODEL,
    validate: (value) => {
      return new Promise((res, rej) => {
        User.findById({_id: value}, (err, doc) => {
          res(!err && doc)
        })
      })
    }
  }],
  money: {
    value: {
      type: Number,
      required: true
    },
    updated: { type: Date, default: Date.now },
  },
  expenses: [{
    type: Schema.Types.ObjectId,
    refs: model.EXPENSE_MODEL,
    validate: (value) => {
      return new Promise((res, rej) => {
        Expense.findById({_id: value}, (err, doc) => {
          if(!err && doc) {
            res(true)
          } else {
            rej()
          }
        })
      })
    }
  }]
})

mongoose.model(model.PLAN_MODEL, planSchema)
