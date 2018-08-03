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

      try {
        const oldPlan = await Plan.findOne({ description })
        
        if(oldPlan) {
          return res.sendStatus(409)
        }
      } catch(err) {
        console.log('/plans POST', err)
      }

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

  app.get(
    '/plans/:planId',
    [
      checkPath('planId').isLength({ min: 10 })
    ],
    async (req,res) => {

      // validate input
      var errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
      }

      const { planId } = req.params

      var result = null
      var statusCode = 404

      try {
        // make sure plan exists
        result = await Plan.findById(planId)
          .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
          .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
          .select("-__v")
      } catch(err) {

        console.log('/plans/:planId GET', err);
      }

      if(result) {
        statusCode = 200
      }

      res.status(statusCode).json(result)
    }
  )

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

  app.post('/plans/:planId/admins',
    [
      checkPath('planId').isLength({ min: 10 }),
      checkQuery('targetUser').isLength({ min: 10 })
    ],
    async (req, res) => {

      const { planId } = req.params
      const { userId } = req
      const { targetUser } = req.query

      var result = null
      var targetUserDb = null

      try {
        // make sure plan and targetUser exists
        result = await Plan.findById(planId)
        targetUserDb = await User.findById(targetUser)
      } catch(err) {
        console.log('/plans/admins POST', err);
      }

       // validate input
       var errors = validationResult(req)
       if (!errors.isEmpty() || !result || !targetUserDb ) {
         return res.status(422).json({ errors: errors.array() })
       }

       //check if user is among admins of this plan
       if(!result.admins && result.admins.filter(o => o.equals(userId)).length == 0) {
          return res.sendStatus(403)
       }

       try {
          var exists = false
          for (let index = 0; index < result.admins.length; index++) {
            const element = result.admins[index];
            if (element.equals(targetUserDb.id)) {
              exists = true
              break
            }
          }

          // do not make duplicates
          if(!exists) {
            result.admins.push(targetUserDb.id)
            await result.save()
          }

          result = await Plan.findById(planId)
            .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
            .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
            .select("-__v")

       } catch(err) {
          console.log("/plans/admins POST", err)
       }

       res.json(result)
  })

  app.delete(
    '/plans/:planId/admins',
    [
      checkPath('planId').isLength({ min: 10 }),
      checkQuery('targetUser').isLength({ min: 10 })
    ],
    async (req, res) => {

      const { planId } = req.params
      const { userId } = req
      const { targetUser } = req.query

      var result = null
      var targetUserDb = null

      try {
        // make sure plan and targetUser exists
        result = await Plan.findById(planId)
        targetUserDb = await User.findById(targetUser)
      } catch(err) {
        console.log('/plans/admins DELETE', err);
      }

       // validate input
       var errors = validationResult(req)
       if (!errors.isEmpty() || !result || !targetUserDb ) {
         return res.status(422).json({ errors: errors.array() })
       }

       //check if user is among admins of this plan
       if(!result.admins && result.admins.filter(o => o.equals(userId)).length == 0) {
          return res.sendStatus(403)
       }

       try {
          var userIndex = -1
          for (let index = 0; index < result.admins.length; index++) {
            const element = result.admins[index];
            if (element.equals(targetUserDb.id)) {
              userIndex = index
              break
            }
          }

          // remove object
          if(userIndex > -1) {
            result.admins.splice(userIndex, 1)
            await result.save()
          }

          result = await Plan.findById(planId)
            .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
            .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
            .select("-__v")

          } catch(err) {
              console.log("/plans/admins DELETE", err)
          }

          res.json(result)
    })

    app.post(
      '/plans/:planId/expenses',
      [
        checkPath('planId').isLength({ min: 10 }),
        checkBody('value').isNumeric(),
        checkBody('description').isLength({ min: 3 }),
        checkBody('type').isIn(['pending', 'payed', 'unplanned'])
      ],
      async (req, res) => {

        const { planId } = req.params
        const { userId } = req

        var result = null

        try {
          // make sure plan and targetUser exists
          result = await Plan.findById(planId)
        } catch(err) {
          console.log('/plans/admins POST', err);
        }

        // validate input
        var errors = validationResult(req)
        if (!errors.isEmpty() || !result) {
          return res.status(422).json({ errors: errors.array() })
        }

        //check if user is among admins of this plan
        if(!result.admins && result.admins.filter(o => o.equals(userId)).length == 0) {
            return res.sendStatus(403)
        }

        const { value, description, type, referenceId } = req.body

        try {
          // first create expense
          const expense = await new Expense({value, description, type, referenceId}).save()

          // now add it to plan expenses
          result.expenses.push(expense.id)
          await result.save()

          result = await Plan.findById(result.id)
            .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
            .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
            .select("-__v")

        } catch(err) {
          console.log('/plans/expenses POST', err)
        }

        res.json(result)
      }
    )

    app.delete(
      '/plans/:planId/expenses',
      [
        checkPath('planId').isLength({ min: 10 }),
        checkQuery('expenseId').isLength({ min: 10 })
      ],
      async (req, res) => {

        const { planId } = req.params
        const { userId } = req

        var result = null

        try {
          // make sure plan and targetUser exists
          result = await Plan.findById(planId)
            .populate({path: "expenses", model: model.EXPENSE_MODEL})
        } catch(err) {
          console.log('/plans/admins POST', err);
        }

        // validate input
        var errors = validationResult(req)
        if (!errors.isEmpty() || !result) {
          return res.status(422).json({ errors: errors.array() })
        }

        //check if user is among admins of this plan
        if(!result.admins && result.admins.filter(o => o.equals(userId)).length == 0) {
            return res.sendStatus(403)
        }

        const { expenseId } = req.query

        try {
          var foundIndex = -1
          for (let index = 0; index < result.expenses.length; index++) {
            const element = result.expenses[index];
            if (element.equals(expenseId)) {
              foundIndex = index
              break
            }
          }

          // remove object
          if(foundIndex > -1) {
            result.expenses.splice(foundIndex, 1)
            result.expenses = result.expenses.map(o => o.id)
            await result.save()
          }

          // refresh result
          result = await Plan.findById(result.id)
            .populate({path: "admins", model: model.USERS_MODEL, select: "name _id"})
            .populate({path: "expenses", model: model.EXPENSE_MODEL, select: "-__v"})
            .select("-__v")

        } catch(err) {
          console.log('/plans/expenses POST', err)
        }

        res.json(result)
      }
    )
}