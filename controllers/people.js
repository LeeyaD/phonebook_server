// this file contains our route handlers
const jwt = require('jsonwebtoken')
const peopleRouter = require('express').Router()
const Person = require('../models/person')
const User = require('../models/user')
const middleware = require('../utils/middleware')

peopleRouter.get('/', async (request, response) => {
  const people = await Person
    .find({}).populate('user', { username: 1, name: 1 })
  response.json(people)
})

peopleRouter.get('/:id', async (request, response, next) => {
  const person = await Person.findById(request.params.id)
  if (person) {
    response.json(person)
  } else {
    response.status(404).end()
  }
})

peopleRouter.post('/', async (request, response, next) => {
  const body = request.body
  const user = request.user

  const person = new Person({
    name: body.name,
    number: body.number,
    user: user.toJSON().id
  })

  const savedPerson = await person.save()
  user.toJSON().contacts = user.toJSON().contacts.concat(savedPerson._id)
  await user.save()

  response.status(201).json(savedPerson)
})

peopleRouter.delete('/:id', async (request, response) => {
  const person = await Person.findById(request.params.id)
  const user = request.user.toJSON()

  if (user.id === person.user.toString()) {
    await Person.findByIdAndRemove(request.params.id)
    response.status(204).end()
  } else {
    response.status(401).json({ error: 'user not authorized to delete contact' })
  }
})

peopleRouter.put('/:id', async (request, response, next) => {
  const { name, number } = request.body

  const updatedPerson = await Person.findByIdAndUpdate(
    request.params.id,
    { name, number },
    { new: true, runValidators: true, context: 'query' }
  )

  response.json(updatedPerson)
})

module.exports = peopleRouter