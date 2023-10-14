const Person = require('../models/person')
const User = require('../models/user')

const initialPeople = [
  {
    name: 'Steve Rogers',
    number: '123-45567',
  },
  {
    name: 'Jenny J',
    number: '867-53095',
  },
]

const nonExistingId = async () => {
  const person = new Person({ 
    name: 'willremovethissoon', 
    number: '123-56787'
  })
  await person.save()
  await person.deleteOne()
  return person.id.toString()
}

const peopleInDb = async () => {
  const people = await Person.find({})
  return people.map(person => person.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialPeople, 
  nonExistingId, 
  peopleInDb,
  usersInDb
}