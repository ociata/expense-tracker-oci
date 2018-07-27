const express = require('express')

module.exports = (app) => {
  app.use((req, res, next) => {
    
    let contentType = req.headers['content-type']    

    //make sure body is in json
    if(typeof contentType == 'undefined' || contentType == null || contentType != 'application/json') {
      return res.status(406).send()
    }

    //inform the encoding back
    res.set('Content-Type', 'application/json')

    next()
  })

  app.use(express.json());       // to support JSON-encoded bodies
  app.use(express.urlencoded({extended: true}))
}