const mongoose = require('mongoose')
const model = require('./model-keys')
const { Schema } = mongoose

const expenseSchema = new Schema({
  value: { type: Number, required: true },
  description: { type: String, required: true },
  type: { type: String,
    required: true,
    enums: [
      "pending",
      "payed",
      "unplanned"
    ] 
  }
})

mongoose.model(model.EXPENSE_MODEL, expenseSchema)

