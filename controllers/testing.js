const testingRouter = require('express').Router()
const Person = require('../models/person')
const User = require('../models/user')

testingRouter.post('/reset', async (request, response) => {
  await Person.deleteMany({})
  await User.deleteMany({})

  response.status(204).end()
})

module.exports = testingRouter