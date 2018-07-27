const express = require('express')
const mongoose = require('mongoose')
const config = require('./config/keys')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json')

// import all schemas before connect to mongoose/mongodb
require('./models/User')

mongoose.connect(config.mongoURI, { useNewUrlParser: true })

const model = require('./models/model-keys')
const User = mongoose.model(model.USERS_MODEL)

const app = express()

// setup docs to be served at api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// todo: remove this when real endpoints are ready
app.get('/', (req, res) => res.send('Hello World!'))

app.get('/newUser', (req, res) => {
  console.log(req.query.googleId)
  new User({ googleId: req.query.googleId }).save((err) => {
    console.log(err)
  })

  res.send('Create user with Google Id: '+ req.query.googleId)
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log('Example app listening on port: ' + PORT))
