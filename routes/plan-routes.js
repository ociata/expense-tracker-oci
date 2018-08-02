const { validationResult, buildCheckFunction } = require('express-validator/check')
const checkQuery = buildCheckFunction(['query'])
const checkBody = buildCheckFunction(['body'])
const mongoose = require('mongoose')
const model = require('../models/model-keys')
const { plansWithAdminUserId, addPlan, addExpense, detailsForUserIds } = require('../utility/db-helper')

module.exports = (app) => {

  app.get('/plans', async (req, res) => {

    const { userId } = req

    var results = await plansWithAdminUserId(userId)

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
}