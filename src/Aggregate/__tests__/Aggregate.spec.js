require('jest')
const { every, isFunction } = require('lodash')

const { Aggregate } = require('../../../dist/main')

const { getDefinition, INITIAL_STATE } = require('./getDefinition.mocks')

const serializedInitialState = JSON.stringify(INITIAL_STATE)

describe('Aggregate', () => {
  it('Aggregate is a function', () => {
    expect(typeof Aggregate).toBe('function')
  })

  describe('User = Aggregate(definition)', () => {
    it('User is a function', () => {
      const User = Aggregate(getDefinition())
      expect(typeof User).toBe('function')
    })
    it('User.name === definition.type', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      expect(User.name).toBe(definition.type)
    })
    it('User.context === definition.context', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      expect(User.context).toBe(definition.context)
    })
    it('User.type === definition.type', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      expect(User.type).toBe(definition.type)
    })
    it('User.description === definition.description || ``', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      expect(User.description).toBe(definition.description)

      const User2 = Aggregate({ ...definition, description: undefined })
      expect(User2.description).toBe('')
    })
  })
})
