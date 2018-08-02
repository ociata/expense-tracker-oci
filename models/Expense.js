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
  },
  referenceId: { type: Schema.Types.ObjectId, refs: model.EXPENSE_MODEL, default: null }
})

mongoose.model(model.EXPENSE_MODEL, expenseSchema)

