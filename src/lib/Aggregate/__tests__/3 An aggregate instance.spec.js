import 'jest'
import { every, isFunction, range } from 'lodash'

import { Aggregate, DomainEvent } from 'lib-export'

import { definition } from 'lib-tests/TodoList'
import ListCreated from 'lib-tests/TodoList/events/ListCreated'

const toSerializedEvent = e => ({
  name: e.name,
  payload: e.getSerializedPayload(),
})

describe('aggregate.version', () => {
  it('it is calculated as ((snapshot && snapshot.version) || 0) + ((events && events.length) || 0)', () => {
    const serialize = definition.serializeState || JSON.stringify
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.version).toBe(0)

    const aggregate10 = AggregateType('x', {
      serializedState: serialize(definition.initialState),
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
        serializedState: serialize(definition.initialState),
        version: 3,
      },
      [toSerializedEvent(ListCreated({ identity: 'my-list', name: 'My List' }))]
    )
    expect(aggregate4.version).toBe(4)
  })
  it('does not change when the aggregate produces new events', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    aggregate.execute.CreateList({ identity: 'x', name: 'A list' })

    expect(aggregate.getNewEvents().length > 0).toBe(true)
    expect(aggregate.version).toBe(0)
  })
})

describe('aggregate.needsSnapshot', () => {
  it('is true if aggregate was rebuilt from a number of events >= of definition.snapshotThreshold', () => {
    const snapshotThreshold = Math.ceil(Math.random() * 10)
    const AggregateType = Aggregate({
      ...definition,
      snapshotThreshold,
    })

    const initial = AggregateType('x')
    initial.execute.CreateList({ identity: 'x', name: 'A list' })
    const snapshot = {
      version: initial.getNewEvents().length,
      serializedState: initial.getSerializedState(),
    }

    const aggregate = AggregateType('x', snapshot)
    range(snapshotThreshold).forEach((_, idx) =>
      aggregate.execute.ChangeListName({ name: `New name ${idx}` })
    )
    const newSerializedEvents = aggregate.getNewEvents().map(toSerializedEvent)

    const aggregateToSnapshot = AggregateType(
      'x',
      snapshot,
      newSerializedEvents
    )
    expect(newSerializedEvents.length).toBe(snapshotThreshold)
    expect(aggregateToSnapshot.needsSnapshot).toBe(true)
  })
  it('is always false if a snapshotThreshold was not specified in definition', () => {
    const AggregateType = Aggregate({
      ...definition,
      snapshotThreshold: undefined,
    })

    const initial = AggregateType('x')
    initial.execute.CreateList({ identity: 'x', name: 'A list' })
    const snapshot = {
      version: initial.getNewEvents().length,
      serializedState: initial.getSerializedState(),
    }

    const aggregate = AggregateType('x', snapshot)
    range(5).forEach((_, idx) =>
      aggregate.execute.ChangeListName({ name: `New name ${idx}` })
    )
    const newSerializedEvents = aggregate.getNewEvents().map(toSerializedEvent)

    const aggregateToSnapshot = AggregateType(
      'x',
      snapshot,
      newSerializedEvents
    )
    expect(newSerializedEvents.length > 0).toBe(true)
    expect(aggregateToSnapshot.needsSnapshot).toBe(false)
  })
})

describe('aggregate.query', () => {
  it('is a dictionary of functions keyed by definition.queries[*].name', () => {
    const definitionQueryNames = definition.queries.map(({ name }) => name)
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(Object.keys(aggregate.query)).toEqual(definitionQueryNames)
    expect(every(aggregate.query, isFunction)).toBe(true)
  })
  it('every query[queryName](input: any) maps to the corresponding query handler. Current aggregate state is passed as first argument, while `input` as second argument', () => {
    const AggregateType = Aggregate({
      ...definition,
      initialState: {
        total: 0,
      },
      errors: [],
      events: [
        DomainEvent({
          name: 'AmountAdded',
          reducer: (state, payload) => ({
            total: state.total + payload.amount,
          }),
        }),
      ],
      commands: [
        {
          name: 'AddAmount',
          raisableErrors: [],
          emittableEvents: ['AmountAdded'],
          handler: (amount, { emit }) => {
            emit.AmountAdded({ amount })
          },
        },
      ],
      queries: [
        {
          name: 'getTotal',
          handler: state => state.total,
        },
        {
          name: 'getTotalDividedBy',
          handler: (state, divisor) => state.total / divisor,
        },
      ],
    })

    const aggregate = AggregateType('x')
    aggregate.execute.AddAmount(100)
    expect(aggregate.query.getTotal()).toBe(100)
    expect(aggregate.query.getTotalDividedBy(20)).toBe(5)

    aggregate.execute.AddAmount(200)
    expect(aggregate.query.getTotal()).toBe(300)
    expect(aggregate.query.getTotalDividedBy(2)).toBe(150)
  })
  it('aggregate.query[queryName](input: any) does not catch errors thrown by the corresponding query handler', () => {
    const e = new Error()
    const AggregateType = Aggregate({
      ...definition,
      queries: [
        {
          name: 'throwingQuery',
          handler: () => {
            throw e
          },
        },
      ],
    })

    const aggregate = AggregateType('x')

    try {
      aggregate.query.throwingQuery()
      throw new Error('aggregate.query.throwingQuery should not catch')
    } catch (error) {
      expect(error).toBe(e)
    }
  })
})

describe('aggregate.execute', () => {
  it('is a dictionary of functions keyed by definition.commands[*].name', () => {
    const commands = [
      {
        name: 'DoThis',
        raisableErrors: [],
        emittableEvents: [],
        handler: () => {},
      },
      {
        name: 'DoThat',
        raisableErrors: [],
        emittableEvents: [],
        handler: () => {},
      },
    ]
    const AggregateType = Aggregate({
      ...definition,
      commands,
    })
    const aggregate = AggregateType('x')
    expect(Object.keys(aggregate.execute)).toEqual(
      commands.map(({ name }) => name)
    )
    expect(every(aggregate.execute, isFunction)).toBe(true)
  })
  it('every aggregate.execute[commandName](input: any) maps to the corresponding command handler. `input` is passed as first argument while a CommandHandlerInterface as second argument', () => {
    const DoThisCommand = {
      name: 'DoThis',
      raisableErrors: [],
      emittableEvents: [],
      handler: jest.fn(() => {}),
    }
    const DoThisInput = {}
    const DoThatCommand = {
      name: 'DoThat',
      raisableErrors: [],
      emittableEvents: [],
      handler: jest.fn(() => {}),
    }
    const DoThatInput = {}
    const AggregateType = Aggregate({
      ...definition,
      commands: [DoThisCommand, DoThatCommand],
    })
    const aggregate = AggregateType('x')

    aggregate.execute.DoThis(DoThisInput)
    expect(DoThisCommand.handler).toHaveBeenCalledTimes(1)
    expect(DoThisCommand.handler).toHaveBeenCalledWith(
      DoThisInput,
      expect.objectContaining({
        query: expect.any(Object),
        error: expect.any(Object),
        emit: expect.any(Object),
      })
    )

    aggregate.execute.DoThat(DoThatInput)
    expect(DoThatCommand.handler).toHaveBeenCalledTimes(1)
    expect(DoThatCommand.handler).toHaveBeenCalledWith(
      DoThatInput,
      expect.objectContaining({
        query: expect.any(Object),
        error: expect.any(Object),
        emit: expect.any(Object),
      })
    )
  })
  it('aggregate.execute[commandName](input: any) does not catch errors thrown by the corresponding command handler', () => {
    const e = new Error()
    const DoThisCommand = {
      name: 'DoThis',
      raisableErrors: [],
      emittableEvents: [],
      handler: jest.fn(() => {
        throw e
      }),
    }
    const AggregateType = Aggregate({
      ...definition,
      commands: [DoThisCommand],
    })
    const aggregate = AggregateType('x')

    try {
      aggregate.execute.DoThis({})
      throw new Error('aggregate.execute.DoThis should not catch')
    } catch (error) {
      expect(error).toBe(e)
    }
  })
})

describe('aggregate.appendEvents(events: SerializedDomainEvent[]): AggregateInstance ', () => {
  it('returns a new instance of the same aggregate with events appended to its history', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    aggregate.execute.ChangeListName({ name: 'X' })
    aggregate.execute.ChangeListName({ name: 'y' })

    const newEvents = aggregate.getNewEvents()
    const newSerializedState = aggregate.getSerializedState()

    const newInstance = AggregateType('x').appendEvents(
      newEvents.map(toSerializedEvent)
    )

    expect(aggregate.version).toBe(0)
    expect(newInstance.version).toBe(newEvents.length)
    expect(newInstance.getSerializedState()).toBe(newSerializedState)
  })
})

describe('aggregate.clone(): AggregateInstance', () => {
  it('returns another instance of the same aggregate, as it was before producing any event', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    const initialSerializedState = aggregate.getSerializedState()

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    expect(aggregate.getNewEvents().length > 0).toBe(true)

    const clone = aggregate.clone()

    expect(clone instanceof AggregateType).toBe(true)
    expect(clone.identity).toEqual(aggregate.identity)
    expect(clone.version).toBe(aggregate.version)
    expect(clone.getSerializedState()).toEqual(initialSerializedState)
  })
})

describe('aggregate.New', () => {
  it('is a reference to the AggregateType factory which generated the instance', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.New).toBe(AggregateType)
  })
})

describe('aggregate.isDirty(): boolen', () => {
  it('returns true if aggregate produced new events, false otherwise', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    expect(aggregate.getNewEvents().length > 0).toBe(true)
    expect(aggregate.isDirty()).toBe(true)
  })
  it('returns false if aggregate did not produce new events', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')

    expect(aggregate.getNewEvents().length === 0).toBe(true)
    expect(aggregate.isDirty()).toBe(false)
  })
})

describe('aggregate.getNewEvents(): DomainEventInstance[]', () => {
  it('returns the list of produced events', () => {
    const SomethingHappened = DomainEvent({
      name: 'SomethingHappened',
      reducer: state => state,
    })
    const AggregateType = Aggregate({
      ...definition,
      errors: [],
      queries: [],
      events: [SomethingHappened],
      commands: [
        {
          name: 'myCommand',
          raisableErrors: [],
          emittableEvents: ['SomethingHappened'],
          handler: (input, { emit }) => {
            emit.SomethingHappened(input)
          },
        },
      ],
    })
    const aggregate = AggregateType('x')
    const initialNewEvents = aggregate.getNewEvents()

    aggregate.execute.myCommand({ some: 'payload' })
    const newEvents = aggregate.getNewEvents()

    expect(initialNewEvents).toEqual([])
    expect(newEvents.length).toEqual(1)
    expect(newEvents[0].name).toEqual('SomethingHappened')
    expect(newEvents[0].payload).toEqual({ some: 'payload' })
    expect(newEvents[0] instanceof SomethingHappened).toBe(true)
  })
})

describe('aggregate.consistencyPolicy(): ConsistencyPolicy', () => {
  it('returns the consistency policy to use to persist the new events. defaults to 0.', () => {
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.getConsistencyPolicy()).toEqual(0)
  })
})

describe('aggregate.getSerializedState(): string', () => {
  it('returns the aggregate state serialized as a string', () => {
    const serialize = definition.serializeState || JSON.stringify
    const serializedInitialState = serialize(definition.initialState)
    const AggregateType = Aggregate(definition)
    const aggregate = AggregateType('x')
    expect(aggregate.getSerializedState()).toEqual(serializedInitialState)

    aggregate.execute.CreateList({ identity: 'x', name: 'My List' })
    const newEvents = aggregate.getNewEvents()

    const expectedNewState = newEvents.reduce(
      (state, event) => event.applyToState(state),
      definition.initialState
    )
    const expectedNewSerializedState = serialize(expectedNewState)

    expect(aggregate.getSerializedState()).toEqual(expectedNewSerializedState)
  })
})

describe('aggregate.getSnapshot(): AggregateSnapshot', () => {
  it('returns a snapshot of the aggregate as it was before producing new events', () => {
    const AggregateType = Aggregate(definition)

    const aggregate = AggregateType('x')
    const expectedSnapshot = {
      serializedState: aggregate.getSerializedState(),
      version: aggregate.version,
    }

    aggregate.execute.CreateList({ identity: 'x', name: 'MyList' })
    aggregate.execute.ChangeListName({ name: 'MyListX' })

    expect(aggregate.getSnapshot()).toEqual(expectedSnapshot)
  })
})

describe('aggregate.toString(): string', () => {
  it('returns `[object {context}:{type}(identity) #{version}+{newEvents.length}]` if aggregate is not a singleton', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })
    const aggregate = AggregateType('x')
    aggregate.execute.CreateList({ identity: 'x', name: 'a' })
    const newEvents = aggregate.getNewEvents()
    expect(aggregate.toString()).toBe(
      `[object ${definition.context}:${definition.type}(x) #${
        aggregate.version
      }+${newEvents.length}]`
    )

    const newAggregate = AggregateType('x').appendEvents(
      newEvents.map(toSerializedEvent)
    )
    expect(newAggregate.toString()).toBe(
      `[object ${definition.context}:${definition.type}(x) #${
        newEvents.length
      }+0]`
    )
  })
  it('returns `[object {context}:{type} #{version}+{newEvents.length}]` if aggregate is a singleton', () => {
    const AggregateType = Aggregate({ ...definition, singleton: true })
    const aggregate = AggregateType()
    aggregate.execute.CreateList({ identity: 'x', name: 'a' })
    const newEvents = aggregate.getNewEvents()
    expect(aggregate.toString()).toBe(
      `[object ${definition.context}:${definition.type} #${aggregate.version}+${
        newEvents.length
      }]`
    )

    const newAggregate = AggregateType().appendEvents(
      newEvents.map(toSerializedEvent)
    )
    expect(newAggregate.toString()).toBe(
      `[object ${definition.context}:${definition.type} #${newEvents.length}+0]`
    )
  })
})
