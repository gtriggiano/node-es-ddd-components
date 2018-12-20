import 'jest'
import { every, isFunction } from 'lodash'

import { Aggregate } from '../../../../dist/main/lib'

import { definition, initialState } from '../../../../dist/main/tests/TodoList'
import ListCreated from '../../../../dist/main/tests/TodoList/events/ListCreated'
import ListNameChanged from '../../../../dist/main/tests/TodoList/events/ListNameChanged'

const toSerializedEvent = e => ({
  name: e.name,
  serializedPayload: e.getSerializedPayload(),
})
const serializedInitialState = JSON.stringify(initialState)

describe('aggregate = AggregateType(identity [, snapshot] [, events])', () => {
  it('aggregate.identity === identity', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.identity).toBe('x')
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
  it('aggregate.version === ((snapshot && snapshot.version) || 0) + (events && events.length) || 0', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.version).toBe(0)

    const aggregate10 = AggregateType('x', {
      serializedState: serializedInitialState,
      version: 10,
    })
    expect(aggregate10.version).toBe(10)

    const aggregate1 = AggregateType('x', null, [
      toSerializedEvent(ListCreated({ identity: 'my-list', name: 'My List' })),
    ])
    expect(aggregate1.version).toBe(1)

    const aggregate4 = AggregateType(
      'x',
      {
        serializedState: serializedInitialState,
        version: 3,
      },
      [toSerializedEvent(ListCreated({ identity: 'my-list', name: 'My List' }))]
    )
    expect(aggregate4.version).toBe(4)
  })
  it('aggregate.snapshotKey is a string: [{definition.snapshotPrefix}:]AGGREGATE_SNAPSHOT:{definition.context}:{definition.type}[(id)]', () => {
    const AggregateType = Aggregate({
      ...definition,
      snapshotPrefix: 'test',
    })
    const aggregate = AggregateType('x')
    expect(aggregate.snapshotKey).toBe(
      `test:AGGREGATE_SNAPSHOT:${definition.context}:${definition.type}(x)`
    )

    const SingletonAggregateType = Aggregate({
      ...definition,
      singleton: true,
      snapshotPrefix: 'test',
    })
    const singletonAggregateType = SingletonAggregateType()
    expect(singletonAggregateType.snapshotKey).toBe(
      `test:AGGREGATE_SNAPSHOT:${definition.context}:${definition.type}`
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
  it('aggregate.getSerializedState() returns the serialization of the current state', () => {
    const AggregateType = Aggregate(definition)

    const aggregate = AggregateType('x')
    expect(aggregate.getSerializedState()).toEqual(serializedInitialState)

    const listCreatedEvent = ListCreated({
      identity: 'one',
      name: 'List name',
    })

    const aggregate1 = AggregateType('x', undefined, [
      toSerializedEvent(listCreatedEvent),
    ])
    expect(aggregate1.getSerializedState()).toEqual(
      JSON.stringify(listCreatedEvent.applyToState(initialState))
    )
  })
  it('aggregate.getSnapshot() returns a snapshot of the aggregate as it was before emitting events', () => {
    const AggregateType = Aggregate(definition)

    const aggregate = AggregateType('x')
    const serializedInitialState = aggregate.getSerializedState()

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    aggregate.execute.ChangeListName({ name: 'MyListX' })

    const version = aggregate.version
    expect(aggregate.getSnapshot()).toEqual({
      serializedState: serializedInitialState,
      version,
    })
  })
  it('aggregate.isDirty() returns true if aggregate has emitted new events, false otherwise', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    expect(aggregate.isDirty()).toBe(false)

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    expect(aggregate.isDirty()).toBe(true)
  })
  it('aggregate.getConsistencyPolicy() returns the consistency policy to use to persist the new events. defaults to 0.', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.getConsistencyPolicy()).toEqual(0)
  })
  it('aggregate.clone() returns another instance indentical to the one holding the clone fn, with the same state it had at instantiation time', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    const originalSerializedState = aggregate.getSerializedState()

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })

    const sameAggregateType = aggregate.clone()

    expect(sameAggregateType instanceof AggregateType).toBe(true)
    expect(sameAggregateType.identity).toEqual(aggregate.identity)

    expect(sameAggregateType.version).toBe(aggregate.version)

    expect(aggregate.getNewEvents().length).toEqual(1)
    expect(sameAggregateType.getNewEvents().length).toEqual(0)

    expect(originalSerializedState).toEqual(
      sameAggregateType.getSerializedState()
    )
  })
  it('aggregate.getNewEvents() returns the list of emitted domain event instances', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    expect(aggregate.getNewEvents()).toEqual([])

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    aggregate.execute.ChangeListName({ name: 'AList' })

    const newEvents = aggregate.getNewEvents()

    expect(newEvents.length).toEqual(2)
    expect(newEvents[0].name).toEqual('ListCreated')
    expect(newEvents[0].payload).toEqual({ identity: 'x', name: 'MyList' })
    expect(newEvents[0] instanceof ListCreated).toBe(true)
    expect(newEvents[1].name).toEqual('ListNameChanged')
    expect(newEvents[1].payload).toEqual({ name: 'AList' })
    expect(newEvents[1] instanceof ListNameChanged).toBe(true)
  })
  it('aggregate.appendEvents() returns a new instance of the same aggregate with newEvents appended', () => {
    const AggregateType = Aggregate({
      ...definition,
      queries: [
        ...definition.queries,
        {
          name: 'getName',
          handler: state => state.name,
        },
      ],
    })
    const aggregate = AggregateType('x')
    const otherAggregate = aggregate.appendEvents([
      toSerializedEvent(ListCreated({ identity: 'x', name: 'MyList' })),
    ])

    expect(aggregate.context).toEqual(otherAggregate.context)
    expect(aggregate.type).toEqual(otherAggregate.type)
    expect(aggregate.identity).toEqual(otherAggregate.identity)
    expect(otherAggregate.version).toEqual(aggregate.version + 1)
    expect(aggregate.query.getName()).toEqual(undefined)
    expect(otherAggregate.query.getName()).toEqual('MyList')
  })
  it('aggregate.toString() === `[object {context}:{type}(identity) #{version}+{totalEmittedEvents}]`', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })
    const aggregate = AggregateType('x')
    aggregate.execute.CreateList({ identity: 'x', name: 'a' })
    expect(aggregate.toString()).toBe(
      `[object ${definition.context}:${definition.type}(x) #0+1]`
    )
  })

  describe('aggregate.needsSnapshot', () => {
    it('is a boolean', () => {
      const AggregateType = Aggregate(definition)
      const aggregate = AggregateType('x')
      expect(typeof aggregate.needsSnapshot).toBe('boolean')
    })
    it('is true if aggregate was rebuilt from a number of events > of definition.snapshotThreshold', () => {
      const AggregateType = Aggregate({
        ...definition,
        snapshotThreshold: 2,
      })

      const aggregate = AggregateType('x')

      expect(AggregateType('x').needsSnapshot).toBe(false)
    })
    it('is always false if a snapshotThreshold was not specified in definition', () => {
      const AggregateType = Aggregate({
        ...definition,
        snapshotThreshold: undefined,
      })

      const aggregate = AggregateType('x')

      expect(aggregate.needsSnapshot).toBe(false)
    })
  })
})
