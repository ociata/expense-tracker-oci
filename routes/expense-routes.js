const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const checkBody = buildCheckFunction(['body'])
const checkPath = buildCheckFunction(['params'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const Expense = mongoose.model(model.EXPENSE_MODEL)
const Plan = mongoose.model(model.PLAN_MODEL)

module.exports = (app) => {
  app.get('/expenses', 
  [checkQuery('planId').isLength({ min: 10 })],
  async (req, res) => {

      const { userId } = req
      const { planId } = req.query

      var result = null

      try {
        // make sure plan exists
        result = await Plan.findOne({ _id: planId })
      } catch(err) {

        console.log('/plans PATCH', err);
      }

       // validate input
       var errors = validationResult(req)
       if (!errors.isEmpty() || !result ) {
         return res.status(422).json({ errors: errors.array() })
       }

       //check if user is among admins of this plan
       if(!result.admins && result.admins.filter(o => o.equals(userId)).length == 0) {
          return res.sendStatus(403)
       }

       try {
          result = await Plan.findById(planId)
                      .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
                      .select("-__v")
       } catch(err) {
         console.log("PATCH /plans money", err)
       }

       res.json(result.expenses)
  })
}