const supertest = require('supertest')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const helper = require('./test_helper')
const app = require('../app')
// returns a 'superagent' objt, used to make HTTP reqs to backend
const api = supertest(app)

const Person = require('../models/person')
const User = require('../models/user')


describe('when there are initially some people saved', () => {
  beforeEach(async () => {
    await Person.deleteMany({})
    await Person.insertMany(helper.initialPeople)
  })

  test('people are returned as json', async () => {
    await api
      .get('/api/persons')
      .expect(200)
      .expect('Content-Type', /application\/json/)
      // regex > string, b/c strs have to match exactly 
  }, 100000)
  
  test('all people are returned', async () => {
    const response = await api.get('/api/persons')
  
    expect(response.body).toHaveLength(helper.initialPeople.length)
  })
  
  test('a specific person is within the returned people', async () => {
    const response = await api.get('/api/persons')
  
    const names = response.body.map(p => p.name)
    expect(names).toContain(
      'Steve Rogers'
    )
  })

  test('person has a property of id', async () => {
    const people = await helper.peopleInDb()
    expect(people[0].id).toBeDefined()
  })

  describe('viewing a specific person', () => {
    test('succeeds with valid id', async () => {
      const people = await helper.peopleInDb()
    
      const personToView = people[0]
    
      const resultPerson = await api
        .get(`/api/persons/${personToView.id}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)
    
      expect(resultPerson.body).toEqual(personToView)
    })
  
    test('fails with status code 404 if person does not exist', async () => {
      const nonExistingId = await helper.nonExistingId()
      await api
        .get(`/api/persons/${nonExistingId}`)
        .expect(404)
    })
  
    test('fails with status code 400 if id is not valid', async () => {
      const invalidId = 'h4b5a6154c465559015493b6'
      await api
        .get(`/api/persons/${invalidId}`)
        .expect(400)
    })
  })

  describe('addition of a new person', () => {
    test('succeeds with valid data', async () => {
      const newPerson = {
        name: 'Dawson Creek',
        number: '053-98765'
      }

      await api
        .post('/api/persons')
        .send(newPerson)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    
      const peopleNow = await helper.peopleInDb()
      expect(peopleNow).toHaveLength(helper.initialPeople.length + 1)
      
      const names = peopleNow.map(p => p.name)
      expect(names).toContain('Dawson Creek')
    })
  
    test('fails with status code 400 if data is invalid', async () => {
      const newPerson = {
        number: '234-56789'
      }
    
      await api
        .post('/api/persons')
        .send(newPerson)
        .expect(400)
    
      const peopleNow = await helper.peopleInDb()
      expect(peopleNow).toHaveLength(helper.initialPeople.length)
    })
  })

  describe('deletion of a person', () => {
    test('succeeds with status code 204 if id is valid', async () => {
      const peopleBefore = await helper.peopleInDb()
      const personToDelete = peopleBefore[0]
    
      await api
        .delete(`/api/persons/${personToDelete.id}`)
        .expect(204)
    
      const peopleAfter = await helper.peopleInDb()
    
      expect(peopleAfter).toHaveLength(
        helper.initialPeople.length - 1
      )
    
      const names = peopleAfter.map(p => p.name)
    
      expect(names).not.toContain(personToDelete.name)
    })
  })
})

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'LPforLife',
      name: 'Leeya Davis',
      password: 'leekwangsoo',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with status code 401 if password is invalid', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'Bill',
      name: 'William',
      password: 'ab',
    }

    await api
    .post('/api/users')
    .send(newUser)
    .expect(401)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Chris Pine',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('expected `username` to be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

afterAll(async () => {
  await mongoose.connection.close()
})
