import 'jest'
import { pick } from 'lodash'

import {
  Aggregate,
  Repository,
  InMemoryEventStore,
  InMemorySnapshotService,
} from 'lib-export'

import TodoList, { definition as todoListDefinition } from 'lib-tests/TodoList'

const getDefinition = () => ({
  eventStore: InMemoryEventStore(),
  snapshotService: InMemorySnapshotService(),
})

describe('Returned value', () => {
  it('is a promise', () => {
    const definition = getDefinition()
    const repository = Repository(definition)

    const todoList = TodoList('x')
    todoList.execute.CreateList({ identity: 'x', name: 'A list' })

    const ret = repository.persist([todoList])
    expect(typeof ret.then).toBe('function')
    expect(typeof ret.catch).toBe('function')
  })
  it('promised value is `{aggregates: Aggregates[], persistedEvents: PersistedDomainEvent[]}`', async () => {
    const definition = getDefinition()
    const repository = Repository(definition)

    const todoList = TodoList('x')
    todoList.execute.CreateList({ identity: 'x', name: 'A list' })

    const ret = await repository.persist([todoList])
    expect(ret.aggregates.length).toBe(1)
    expect(ret.persistedEvents.length > 0).toBe(true)
  })
})

describe('Invocation of `eventStore.appendEventsToAggregates(insertions, cId)', () => {
  it('every insertion describes a request to append events for a dirty aggregate', async () => {
    const definition = getDefinition()
    const spyAppendEventsToAggregates = jest.spyOn(
      definition.eventStore,
      'appendEventsToAggregates'
    )

    const repository = Repository(definition)
    const todoListA = TodoList('A')
    todoListA.execute.CreateList({ identity: 'A', name: 'A list' })
    todoListA.execute.ChangeListName({ name: 'Another list' })

    const todoListB = TodoList('B')
    todoListB.execute.CreateList({ identity: 'B', name: 'A list' })

    await repository.persist([todoListA, todoListB])

    expect(spyAppendEventsToAggregates.mock.calls.length).toBe(1)
    const insertions = spyAppendEventsToAggregates.mock.calls[0][0]

    expect(insertions.length).toBe(2)
    expect(insertions[0].aggregate).toEqual(
      pick(todoListA, ['context', 'type', 'identity'])
    )
    expect(insertions[0].expectedAggregateVersion).toBe(0)
    expect(insertions[0].eventsToAppend).toEqual(
      todoListA.getNewEvents().map(({ name, getSerializedPayload }) => ({
        name,
        payload: getSerializedPayload(),
      }))
    )

    expect(insertions[1].aggregate).toEqual(
      pick(todoListB, ['context', 'type', 'identity'])
    )
    expect(insertions[1].expectedAggregateVersion).toBe(0)
    expect(insertions[1].eventsToAppend).toEqual(
      todoListB.getNewEvents().map(({ name, getSerializedPayload }) => ({
        name,
        payload: getSerializedPayload(),
      }))
    )
  })
  it('clean aggregates do not get mapped to insertion objects', async () => {
    const definition = getDefinition()
    const spyAppendEventsToAggregates = jest.spyOn(
      definition.eventStore,
      'appendEventsToAggregates'
    )

    const repository = Repository(definition)
    const todoListA = TodoList('A')
    const todoListB = TodoList('B')
    todoListB.execute.CreateList({ identity: 'A', name: 'A list' })
    todoListB.execute.ChangeListName({ name: 'Another list' })

    await repository.persist([todoListA, todoListB])

    expect(spyAppendEventsToAggregates.mock.calls.length).toBe(1)
    const insertions = spyAppendEventsToAggregates.mock.calls[0][0]

    expect(insertions.length).toBe(1)
    expect(insertions[0].aggregate).toEqual(
      pick(todoListB, ['context', 'type', 'identity'])
    )
  })
  it('if only clean aggregates get passed to `persist` then `` does not get invoked', async () => {
    const definition = getDefinition()
    const spyAppendEventsToAggregates = jest.spyOn(
      definition.eventStore,
      'appendEventsToAggregates'
    )

    const repository = Repository(definition)
    const todoListA = TodoList('A')
    const todoListB = TodoList('B')

    await repository.persist([todoListA, todoListB])

    expect(spyAppendEventsToAggregates.mock.calls.length).toBe(0)
  })
  it('if `eventStore.appendEventsToAggregates` rejects with `e` then rejects with `e`', done => {
    const definition = getDefinition()
    const error = new Error()
    const spyAppendEventsToAggregates = jest
      .spyOn(definition.eventStore, 'appendEventsToAggregates')
      .mockImplementation(() => new Promise((_, reject) => reject(error)))

    const repository = Repository(definition)
    const todoListA = TodoList('A')
    todoListA.execute.CreateList({ identity: 'A', name: 'A list' })
    todoListA.execute.ChangeListName({ name: 'Another list' })

    repository
      .persist([todoListA])
      .then(() => {
        done(new Error('repository.persist() should reject'))
      })
      .catch(e => {
        expect(e).toBe(error)
        done()
      })
  })
  it('cId === correlationId || ``', async () => {
    const definition = getDefinition()
    const spyAppendEventsToAggregates = jest.spyOn(
      definition.eventStore,
      'appendEventsToAggregates'
    )

    const repository = Repository(definition)
    const todoListA = TodoList('A')
    todoListA.execute.CreateList({ identity: 'A', name: 'A list' })

    await repository.persist([todoListA])

    expect(spyAppendEventsToAggregates.mock.calls.length).toBe(1)
    expect(spyAppendEventsToAggregates.mock.calls[0][1]).toBe('')

    const todoListB = TodoList('B')
    todoListB.execute.CreateList({ identity: 'B', name: 'A list' })

    await repository.persist([todoListB], 'xyz')

    expect(spyAppendEventsToAggregates.mock.calls.length).toBe(2)
    expect(spyAppendEventsToAggregates.mock.calls[1][1]).toBe('xyz')
  })
})
