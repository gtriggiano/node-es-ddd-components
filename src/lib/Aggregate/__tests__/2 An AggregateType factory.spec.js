import 'jest'
import { every, isFunction } from 'lodash'

import { Aggregate, BadAggregateConstruction } from 'lib-export'
import { definition } from 'lib-tests/TodoList'
import ListCreated from 'lib-tests/TodoList/events/ListCreated'
import ListNameChanged from 'lib-tests/TodoList/events/ListNameChanged'

const toSerializedEvent = e => ({
  name: e.name,
  payload: e.getSerializedPayload(),
})

describe('AggregateType(identity: AggregateIdentity, snapshot?: AggregateSnapshot, events?: SerializedDomainEvent[]) throws `BadAggregateConstruction` when:', () => {
  it('identity is neither nil nor a string', () => {
    const AggregateType = Aggregate(definition)
    const AggregateTypeSingleton = Aggregate({ ...definition, singleton: true })

    expect(() => AggregateType(2)).toThrow(BadAggregateConstruction)
    expect(() => AggregateType({})).toThrow(BadAggregateConstruction)
    expect(() => AggregateType(false)).toThrow(BadAggregateConstruction)
    expect(() => AggregateType([])).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x')).not.toThrow(BadAggregateConstruction)
    expect(() => AggregateTypeSingleton()).not.toThrow(BadAggregateConstruction)
  })
  it('identity is undefined and aggregate is NOT a singleton', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })

    expect(() => AggregateType()).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x')).not.toThrow()
  })
  it('identity is a string and aggregate is a singleton', () => {
    const AggregateTypeSingleton = Aggregate({ ...definition, singleton: true })

    expect(() => AggregateTypeSingleton('x')).toThrow(BadAggregateConstruction)
    expect(() => AggregateTypeSingleton()).not.toThrow()
  })
  it('snapshot is neither falsy nor a valid snapshot object', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })

    expect(() => AggregateType('x', 'bad')).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x', 3)).toThrow(BadAggregateConstruction)
    expect(() =>
      AggregateType('x', { serializedState: '{}', version: 'x' })
    ).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x', false)).not.toThrow()
    expect(() => AggregateType('x', '')).not.toThrow()
    expect(() =>
      AggregateType('x', { serializedState: '{}', version: 2 })
    ).not.toThrow()
  })
  it('events is neither falsy nor an array of serialized domain events recognized by the aggregate', () => {
    const AggregateType = Aggregate(definition)

    expect(() => AggregateType('x', null, {})).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x', null, true)).toThrow(
      BadAggregateConstruction
    )
    expect(() => AggregateType('x', null, [null])).toThrow(
      BadAggregateConstruction
    )
    expect(() =>
      AggregateType('x', null, [{ name: 'UnknownEvent', payload: 'dsaa' }])
    ).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x', null, false)).not.toThrow()
    expect(() => AggregateType('x', null, [])).not.toThrow()
    expect(() =>
      AggregateType('x', null, [
        toSerializedEvent(ListCreated({ identity: 'a', name: 'A list' })),
        toSerializedEvent(ListNameChanged({ name: 'A list' })),
      ])
    ).not.toThrow()
  })
})

describe('AggregateType(identity: AggregateIdentity, snapshot?: AggregateSnapshot, events?: SerializedDomainEvent[]) returns an `aggregate` instance', () => {
  it('aggregate is recognized as an `instanceof AggregateType`', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate instanceof AggregateType).toBe(true)
  })
  it('aggregate.context === AggregateType.context', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.context).toBe(AggregateType.context)
  })
  it('aggregate.type === AggregateType.type', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.type).toBe(AggregateType.type)
  })
  it('aggregate.identity === identity', () => {
    const AggregateType = Aggregate(definition)
    const AggregateTypeSingleton = Aggregate({ ...definition, singleton: true })

    const aggregate = AggregateType('x')
    const aggregateSingleton = AggregateTypeSingleton()
    expect(aggregate.identity).toBe('x')
    expect(aggregateSingleton.identity).toBe(undefined)
  })
  it('aggregate.version is a number', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.version).toBe('number')
  })
  it('aggregate.needsSnapshot is a boolean', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.needsSnapshot).toBe('boolean')
  })
  it('aggregate.snapshotKey is a string: [{definition.snapshotPrefix}:]AGGREGATE_SNAPSHOT:{definition.context}:{definition.type}[(id)]', () => {
    const snapshotPrefix = `prefix${Math.floor(Math.random() * 1000)}`
    const AggregateType = Aggregate({
      ...definition,
      snapshotPrefix,
    })
    const aggregate = AggregateType('x')
    expect(aggregate.snapshotKey).toBe(
      `${snapshotPrefix}:AGGREGATE_SNAPSHOT:${definition.context}:${
        definition.type
      }(x)`
    )

    const SingletonAggregateType = Aggregate({
      ...definition,
      singleton: true,
      snapshotPrefix,
    })
    const singletonAggregateType = SingletonAggregateType()
    expect(singletonAggregateType.snapshotKey).toBe(
      `${snapshotPrefix}:AGGREGATE_SNAPSHOT:${definition.context}:${
        definition.type
      }`
    )

    const NoPrefixAggregateType = Aggregate({
      ...definition,
      snapshotPrefix: undefined,
    })
    const noPrefixAggregateType = NoPrefixAggregateType('x')
    expect(noPrefixAggregateType.snapshotKey).toBe(
      `AGGREGATE_SNAPSHOT:${definition.context}:${definition.type}(x)`
    )
  })
  it('aggregate.query is a dictionary of functions keyed by definition.queries[*].name', () => {
    const definitionQueryNames = definition.queries.map(({ name }) => name)
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(Object.keys(aggregate.query)).toEqual(definitionQueryNames)
    expect(every(aggregate.query, isFunction)).toBe(true)
  })
  it('aggregate.execute is a dictionary of functions keyed by definition.commands[*].name', () => {
    const definitionCommandsNames = definition.commands.map(({ name }) => name)
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(Object.keys(aggregate.execute)).toEqual(definitionCommandsNames)
    expect(every(aggregate.execute, isFunction)).toBe(true)
  })
  it('aggregate.appendEvents is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.appendEvents).toBe('function')
  })
  it('aggregate.clone is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.clone).toBe('function')
  })
  it('aggregate.New is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.New).toBe('function')
  })
  it('aggregate.isDirty is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.isDirty).toBe('function')
  })
  it('aggregate.getNewEvents is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.getNewEvents).toBe('function')
  })
  it('aggregate.getConsistencyPolicy is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.getConsistencyPolicy).toBe('function')
  })
  it('aggregate.getSerializedState is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.getSerializedState).toBe('function')
  })
  it('aggregate.getSnapshot is a function', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(typeof aggregate.getSnapshot).toBe('function')
  })
})
