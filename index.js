const express = require('express')
const mongoose = require('mongoose')
const config = require('./config/keys')
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./openapi.json')
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client("400399637600-ue5fh76ce0eif3f98kcb2nisennkh61i.apps.googleusercontent.com",
"HJayRGYKx-ss8GUa4BcSUwdG", "")

// import all schemas before connect to mongoose/mongodb
require('./models/User')
require('./models/Relationship')
require('./models/Expense')
require('./models/Plan')
require('./models/InsecureSession')

mongoose.connect(config.mongoURI, { useNewUrlParser: true })

const app = express()

// setup docs to be served at api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// setupmiddlewares
require('./middlewares/apikey-middleware')(app)
require('./middlewares/auth-middleware')(app)
require('./middlewares/json-middleware')(app)

// setup route handles
require('./routes/user-routes')(app, googleClient)
require('./routes/auth-routes')(app, googleClient)
require('./routes/relationship-routes')(app)
require('./routes/plan-routes')(app)
require('./routes/expense-routes')(app)
require('./routes/session-routes')(app, googleClient)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log('Example app listening on port: ' + PORT))
