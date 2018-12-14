require('jest')
const { every, isFunction } = require('lodash')

const { Aggregate } = require('../../../dist/main')

const {
  getDefinition,
  INITIAL_STATE,
  RenamedEvent,
} = require('./getDefinition.mocks')

const serializedInitialState = JSON.stringify(INITIAL_STATE)

describe('The instance properties. user = User(identity [, snapshot] [, events])', () => {
  it('user.identity === identity', () => {
    const definition = getDefinition()
    const User = Aggregate(definition)
    const user = User('x')
    expect(user.identity).toBe('x')
  })
  it('user.context === User.context', () => {
    const definition = getDefinition()
    const User = Aggregate(definition)
    const user = User('x')
    expect(user.context).toBe(User.context)
  })
  it('user.type === User.type', () => {
    const definition = getDefinition()
    const User = Aggregate(definition)
    const user = User('x')
    expect(user.type).toBe(User.type)
  })
  it('user.version === ((snapshot && snapshot.version) || 0) + (events && events.length) || 0', () => {
    const definition = getDefinition()
    const User = Aggregate(definition)
    const user = User('x')
    expect(user.version).toBe(0)

    const user10 = User('x', {
      serializedState: serializedInitialState,
      version: 10,
    })
    expect(user10.version).toBe(10)

    const user1 = User('x', null, [
      { data: '{"name": "Bob"}', name: 'Created' },
    ])
    expect(user1.version).toBe(1)

    const user4 = User(
      'x',
      {
        serializedState: serializedInitialState,
        version: 3,
      },
      [{ data: '{"name": "Bob"}', name: 'Created' }]
    )
    expect(user4.version).toBe(4)
  })
  it('user.snapshotKey is a string: [definition.snapshotPrefix:]AGGREGATE_SNAPSHOT:context:type[(id)]', () => {
    const definition = getDefinition()

    const User = Aggregate({
      ...definition,
      context: 'AContext',
      type: 'TestType',
      snapshotPrefix: 'test',
    })
    const user = User('x')
    expect(user.snapshotKey).toBe(
      'test:AGGREGATE_SNAPSHOT:AContext:TestType(x)'
    )

    const SingletonUser = Aggregate({
      ...definition,
      context: 'AContext',
      type: 'SingletonType',
      singleton: true,
      snapshotPrefix: 'test',
    })
    const singletonUser = SingletonUser()
    expect(singletonUser.snapshotKey).toBe(
      'test:AGGREGATE_SNAPSHOT:AContext:SingletonType'
    )

    const NoPrefixUser = Aggregate({
      ...definition,
      context: 'AContext',
      type: 'NoPrefixType',
    })
    const noPrefixUser = NoPrefixUser('x')
    expect(noPrefixUser.snapshotKey).toBe(
      'AGGREGATE_SNAPSHOT:AContext:NoPrefixType(x)'
    )
  })
  it('user.query is a ditionary of functions keyed by definition.queries[*].name', () => {
    const definition = getDefinition()
    const definitionQueryNames = definition.queries.map(({ name }) => name)
    const User = Aggregate(definition)
    const user = User('x')
    expect(Object.keys(user.query)).toEqual(definitionQueryNames)
    expect(every(user.query, isFunction)).toBe(true)
  })
  it('user.execute is a dictionary of functions keyed by definition.commands[*].name', () => {
    const definition = getDefinition()
    const definitionCommandsNames = definition.commands.map(({ name }) => name)
    const User = Aggregate(definition)
    const user = User('x')
    expect(Object.keys(user.execute)).toEqual(definitionCommandsNames)
    expect(every(user.execute, isFunction)).toBe(true)
  })
  describe('user.needsSnapshot', () => {
    it('is a boolean', () => {
      const User = Aggregate(getDefinition())
      const user = User('x')
      expect(typeof user.needsSnapshot).toBe('boolean')
    })
    it('is true if aggregate was rebuilt from a number of events > of User definition.snapshotThreshold', () => {
      const definition = getDefinition()
      const User = Aggregate({
        ...definition,
        snapshotThreshold: 2,
      })

      const user = User('x')

      expect(User('x').needsSnapshot).toBe(false)
    })
    it('is always false if a snapshotThreshold was not passed in Type definition', () => {
      const definition = getDefinition()
      const User = Aggregate({
        ...definition,
        snapshotThreshold: undefined,
      })

      const user = User('x')

      expect(user.needsSnapshot).toBe(false)
    })
  })
})

describe('The instance methods. user = User(identity [, snapshot] [, events])', () => {
  describe('.getSerializedState(): string', () => {
    it('return the serialization of the current state', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)

      const user = User('x')
      expect(user.getSerializedState()).toEqual(serializedInitialState)

      const user1 = User('x', undefined, [
        { data: '{"name": "Bob"}', name: 'Created' },
      ])
      expect(user1.getSerializedState()).toEqual(
        JSON.stringify({
          ...INITIAL_STATE,
          created: true,
          name: 'Bob',
        })
      )
    })
  })
  describe('.isDirty(): boolean', () => {
    it('return true if aggregate has emitted new events, false otherwise', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')

      expect(user.isDirty()).toBe(false)

      user.execute.Create({ name: 'Bob' })
      expect(user.isDirty()).toBe(true)
    })
  })
  describe('.getNewEvents()', () => {
    it('return an empty array by default', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')
      expect(user.getNewEvents()).toEqual([])
    })
    it('return the list of emitted events', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')

      user.execute.Create({ name: 'Bob' })
      user.execute.Rename({ name: 'Joe' })

      const newEvents = user.getNewEvents()

      expect(newEvents.length).toEqual(2)
      expect(newEvents[0].name).toEqual('Created')
      expect(newEvents[0].data).toEqual({ name: 'Bob' })
      expect(newEvents[0].name).toEqual('Renamed')
      expect(newEvents[1].data).toEqual({ name: 'Joe' })
    })
  })
  describe('.getConsistencyPolicy()', () => {
    it('return the consistency policy to use to persist the new events. defaults to 0.', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')
      expect(user.getConsistencyPolicy()).toEqual(0)
    })
  })
  describe('.clone()', () => {
    it('return another instance indentical to the one holding the clone fn, with the same state it had at instantiation time', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')

      const originalSerializedState = user.getSerializedState()

      user.execute.Create({ name: 'Bob' })

      const sameUser = user.clone()

      expect(sameUser instanceof User).toBe(true)
      expect(sameUser.identity).toEqual(user.identity)

      expect(sameUser.getVersion()).toBe(user.getVersion())

      expect(user.getNewEvents().length).toEqual(1)
      expect(sameUser.getNewEvents().length).toEqual(0)

      expect(originalSerializedState).toEqual(sameUser.getSerializedState())
    })
  })
  describe('.appendEvents(): Aggregate', () => {
    it('return a new instance of the same aggregate with newEvents appended', () => {
      const definition = getDefinition()
      const User = Aggregate(definition)
      const user = User('x')
      const otherUser = user.appendEvents([RenamedEvent({ name: 'joe' })])

      expect(user.context).toEqual(otherUser.context)
      expect(user.type).toEqual(otherUser.type)
      expect(user.id).toEqual(otherUser.id)
      expect(otherUser.getVersion()).toEqual(user.getVersion() + 1)
      expect(otherUser.query.getName()).toEqual('joe')
    })
  })
})
