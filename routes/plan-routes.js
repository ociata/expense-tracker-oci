const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const checkBody = buildCheckFunction(['body'])
const checkPath = buildCheckFunction(['params'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const { addPlan, addExpense, detailsForUserIds } = require('../utility/db-helper')
const User = mongoose.model(model.USERS_MODEL)
const Relationship = mongoose.model(model.RELATIONSHIP_MODEL)
const Plan = mongoose.model(model.PLAN_MODEL)
const Expense = mongoose.model(model.EXPENSE_MODEL)

module.exports = (app) => {

  app.get('/plans', async (req, res) => {

    const { userId } = req

    var results = []

    var dbIds = [userId].map(object => { return new mongoose.Types.ObjectId(object) })

    try {
      results = await Plan.find({ admins: { $in: dbIds } }).select('-expenses -money').populate({path: "admins", model: "users", select: "name _id"})
    } catch(err) {
      console.log('GET /plans', err)
    }

    res.json(results)
  }),

  app.post('/plans',
    [
      checkBody('description').isLength({ min: 3 }),
      checkBody('money').isNumeric()
    ],
    async (req, res) => {

      // validate input
      var errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      const { userId } = req
      const { description, money, planned } = req.body

      var statusCode = 500

      // first try to create the plan
      var plan = await addPlan(description, money, userId)
      var expenseObjects = []

      if(plan) {
        statusCode = 200
        // we managed to create plan, see and add expenses if provided
        if(planned && planned instanceof Array) {
          await Promise.all(planned.map(async expense => {
              //make sure we have properties
              const { value, description, referenceId } = expense
              if(value && description) {
                const newExpense = await addExpense(value, description, referenceId, 'pending')
                
                if(newExpense) {
                  try {
                    plan.expenses.push(newExpense.id)
                    await plan.save()
                    //store the whole object in order to return it
                    expenseObjects.push(newExpense)
                  } catch(err) {
                    console.log('/plans POST', err)
                  }
                }
              }
            })
          )
        }
      }

      const userObjects = await detailsForUserIds([userId])
            
      res.status(statusCode).json({
        money: plan.money,
        id: plan.id,
        description: plan.description,
        expenses: expenseObjects,
        admins: userObjects.map(object => {
          return {
            id: object.id,
            name: object.name
          }
        })
      })
  })

  app.patch('/plans/:planId',[
      checkQuery('value').isNumeric(),
      checkPath('planId').isLength({ min: 10 })
    ], async (req, res) => {

      const { planId } = req.params
      const { userId } = req
      const { value } = req.query

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
        result.money = { value }
        result = await Plan.findByIdAndUpdate(planId, { money: { value } }, { new: true })
                      .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
                      .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
                      .select("-__v")
       } catch(err) {
         console.log("PATCH /plans money", err)
       }

       res.json(result)
  })
}