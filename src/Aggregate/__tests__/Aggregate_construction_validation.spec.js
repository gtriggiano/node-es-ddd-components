require('jest')

const { Aggregate, BadAggregateConstruction } = require('../../../dist/main')

const { getDefinition } = require('./getDefinition.mocks')

describe('AggregateConstructor([identity] [, snapshot] [, events]) throws `BadAggregateConstruction` when:', () => {
  it('identity is neither nil nor a string', () => {
    const User = Aggregate(getDefinition())
    expect(() => User(2)).toThrow(BadAggregateConstruction)
    expect(() => User({})).toThrow(BadAggregateConstruction)
    expect(() => User(false)).toThrow(BadAggregateConstruction)
  })
  it('identity is undefined and aggregate is NOT a singleton', () => {
    const User = Aggregate(getDefinition())
    expect(() => User()).toThrow(BadAggregateConstruction)
    expect(() => User('x')).not.toThrow()
  })
  it('identity is a string and aggregate is a singleton', () => {
    const UserSingleton = Aggregate({ ...getDefinition(), singleton: true })
    expect(() => UserSingleton('x')).toThrow(BadAggregateConstruction)
    expect(() => UserSingleton()).not.toThrow()
  })
  it('snapshot is neither falsy nor a valid snapshot object', () => {
    const User = Aggregate(getDefinition())
    expect(() => User('x', 'bad')).toThrow(BadAggregateConstruction)
    expect(() => User('x', 3)).toThrow(BadAggregateConstruction)
    expect(() => User('x', false)).not.toThrow()
    expect(() => User('x', { serializedState: '{}', version: 'x' })).toThrow(
      BadAggregateConstruction
    )
    expect(() => User('x', { serializedState: '{}', version: 2 })).not.toThrow()
  })
  it('events is neither falsy nor an array of valid serialized events', () => {
    const User = Aggregate(getDefinition())
    expect(() => User('x', null, false)).not.toThrow()
    expect(() => User('x', null, {})).toThrow(BadAggregateConstruction)
    expect(() => User('x', null, true)).toThrow(BadAggregateConstruction)
    expect(() => User('x', null, [])).not.toThrow()
    expect(() => User('x', null, [null])).toThrow(BadAggregateConstruction)
    expect(() =>
      User('x', null, [
        { name: 'Created', data: '{}' },
        { name: 'Created', data: 2 },
      ])
    ).toThrow(BadAggregateConstruction)
    expect(() => User('x', null, [{ name: 'Created' }])).toThrow(
      BadAggregateConstruction
    )
    expect(() => User('x', null, [{ data: 'Created' }])).toThrow(
      BadAggregateConstruction
    )
  })
})
