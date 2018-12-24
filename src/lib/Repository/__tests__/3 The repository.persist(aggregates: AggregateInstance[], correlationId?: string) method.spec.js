import 'jest'
import { noop, pick } from 'lodash'

import {
  Aggregate,
  DomainEvent,
  Repository,
  InMemoryEventStore,
  InMemorySnapshotService,
  RepositoryBadAggregatesListProvided,
  RepositoryWriteError,
  RepositoryWriteConcurrencyError,
  STRICT_CONSISTENCY_POLICY,
  SOFT_CONSISTENCY_POLICY,
  NO_CONSISTENCY_POLICY,
} from 'lib-export'

import TodoList, { definition as todoListDefinition } from 'lib-tests/TodoList'

const getDefinition = () => ({
  eventStore: InMemoryEventStore(),
  snapshotService: InMemorySnapshotService(),
})

describe('Throwing cases', () => {
  it('throws `RepositoryBadAggregatesListProvided` if `aggregates` is not a list of valid aggregate instances unique by context, type and identity', () => {
    const definition = getDefinition()
    const repository = Repository(definition)
    const todoListX = TodoList('x')
    const todoListY = TodoList('y')

    expect(() => repository.persist(1)).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.persist([1])).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.persist([todoListX, null])).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.persist([todoListX, todoListX])).toThrowError(
      RepositoryBadAggregatesListProvided
    )

    expect(() => repository.persist([todoListX, todoListY])).not.toThrow()
  })
})

describe('Returned value', () => {
  it('is a promise of a `result` object with `.aggregates` and `.persistedEvents` keys', async () => {
    const definition = getDefinition()
    const repository = Repository(definition)

    const todoList = TodoList('x')
    todoList.execute.CreateList({ identity: 'x', name: 'A list' })

    const result = await repository.persist([todoList])
    expect(Object.keys(result)).toEqual(['aggregates', 'persistedEvents'])
  })
  it('result.aggregates is a list of reloaded instances. The order of entities is preserved', async () => {
    const definition = getDefinition()
    const repository = Repository(definition)

    const result = await repository.persist([TodoList('x'), TodoList('y')])
    const [todoListX, todoListY] = result.aggregates
    expect(todoListX instanceof TodoList).toBe(true)
    expect(todoListX.identity).toBe('x')
    expect(todoListY instanceof TodoList).toBe(true)
    expect(todoListY.identity).toBe('y')
  })
  it('result.persistedEvents is the value promised by the call to eventStore.appendEventsToAggregates()', async () => {
    const definition = getDefinition()
    const repository = Repository(definition)

    const list = []
    jest
      .spyOn(definition.eventStore, 'appendEventsToAggregates')
      .mockImplementation(() => Promise.resolve(list))

    const todoList = TodoList('x')
    todoList.execute.CreateList({ identity: 'x', name: 'A list' })

    const result = await repository.persist([todoList])

    expect(result.persistedEvents).toBe(list)
  })
})

describe('Interaction with `eventStore`', () => {
  describe('The call to eventStore.appendEventsToAggregates(insertions: EventStoreInsertion[], corrId: string)', () => {
    it('happens if there is at least one dirty aggregate to persist', async () => {
      const definition = getDefinition()
      const spyAppendEventsToAggregates = jest.spyOn(
        definition.eventStore,
        'appendEventsToAggregates'
      )

      const repository = Repository(definition)

      await repository.persist([])

      await repository.persist([TodoList('A')])

      const todoList = TodoList('A')
      todoList.execute.CreateList({ identity: 'A', name: 'A list' })
      await repository.persist([todoList])

      expect(spyAppendEventsToAggregates).toHaveBeenCalledTimes(1)
    })
    it('the length of the insertions list is equal to the number of dirty aggregates', async () => {
      const definition = getDefinition()
      const spyAppendEventsToAggregates = jest.spyOn(
        definition.eventStore,
        'appendEventsToAggregates'
      )

      const repository = Repository(definition)
      const todoList = TodoList('x')
      todoList.execute.CreateList({ identity: 'A', name: 'A list' })

      const cleanAggregate = TodoList('y')
      await repository.persist([todoList, cleanAggregate]) // Calls eventStore.appendEventsToAggregates passing one insertion

      const insertions = spyAppendEventsToAggregates.mock.calls[0][0]
      expect(insertions.length).toBe(1)
    })
    it('corrId === correlationId || ``', async () => {
      const definition = getDefinition()
      const spyAppendEventsToAggregates = jest.spyOn(
        definition.eventStore,
        'appendEventsToAggregates'
      )

      const repository = Repository(definition)
      const todoList = TodoList('x')
      todoList.execute.CreateList({ identity: 'A', name: 'A list' })

      const {
        aggregates: [list],
      } = await repository.persist([todoList], 'a correlation')

      list.execute.ChangeListName({ name: 'Another' })
      await repository.persist([list])

      const firstCorrelationId = spyAppendEventsToAggregates.mock.calls[0][1]
      expect(firstCorrelationId).toBe('a correlation')
      const secondCorrelationId = spyAppendEventsToAggregates.mock.calls[1][1]
      expect(secondCorrelationId).toBe('')
    })

    describe('The insertion: EventStoreInsertion object', () => {
      it('insertion.aggregate is an object to identify the aggregate: {context, type, identity}', async () => {
        const definition = getDefinition()
        const spyAppendEventsToAggregates = jest.spyOn(
          definition.eventStore,
          'appendEventsToAggregates'
        )

        const repository = Repository(definition)
        const todoList = TodoList('A')
        todoList.execute.CreateList({ identity: 'A', name: 'A list' })

        const todoListClean = TodoList('B')

        const TodoListSingleton = Aggregate({
          ...todoListDefinition,
          singleton: true,
        })
        const todoListSingleton = TodoListSingleton()
        todoListSingleton.execute.CreateList({
          identity: 'single',
          name: 'A list',
        })

        await repository.persist([todoList, todoListClean, todoListSingleton])

        const insertions = spyAppendEventsToAggregates.mock.calls[0][0]

        expect(insertions.map(({ aggregate }) => aggregate)).toEqual([
          pick(todoList, ['context', 'type', 'identity']),
          pick(todoListSingleton, ['context', 'type', 'identity']),
        ])
      })
      it("insertion.eventsToAppend is the list of aggregate.getNewEvents(), but each event's `.payload` is serialized", async () => {
        const definition = getDefinition()
        const spyAppendEventsToAggregates = jest.spyOn(
          definition.eventStore,
          'appendEventsToAggregates'
        )

        const repository = Repository(definition)
        const todoList = TodoList('A')
        todoList.execute.CreateList({ identity: 'A', name: 'A list' })
        todoList.execute.ChangeListName({ name: 'Another list' })

        await repository.persist([todoList])

        const [insertion] = spyAppendEventsToAggregates.mock.calls[0][0]
        expect(insertion.eventsToAppend).toEqual(
          todoList.getNewEvents().map(({ name, getSerializedPayload }) => ({
            name,
            payload: getSerializedPayload(),
          }))
        )
      })
      describe('insertion.expectedAggregateVersion', () => {
        it('=== aggregate.version if aggregate.getConsistencyPolicy === STRICT_CONSISTENCY_POLICY', async () => {
          const definition = getDefinition()
          const spyAppendEventsToAggregates = jest.spyOn(
            definition.eventStore,
            'appendEventsToAggregates'
          )

          const repository = Repository(definition)
          const AggregateType = Aggregate({
            ...todoListDefinition,
            events: [
              DomainEvent({
                name: 'Event',
                reducer: () => {},
              }),
            ],
            commands: [
              {
                name: 'DoIt',
                raisableErrors: [],
                emittableEvents: ['Event'],
                handler: (_, { emit }) => {
                  emit.Event()
                },
              },
            ],
          })
          const aggregate = AggregateType('x', {
            version: Math.ceil(Math.random() * 20),
            serializedState: JSON.stringify(todoListDefinition.initialState),
          })
          aggregate.execute.DoIt()

          expect(aggregate.getConsistencyPolicy()).toBe(
            STRICT_CONSISTENCY_POLICY
          )

          await repository.persist([aggregate]).catch(noop)

          const [insertion] = spyAppendEventsToAggregates.mock.calls[0][0]
          expect(insertion.expectedAggregateVersion).toBe(aggregate.version)
        })
        it('=== -1 if aggregate.getConsistencyPolicy === SOFT_CONSISTENCY_POLICY', async () => {
          const definition = getDefinition()
          const spyAppendEventsToAggregates = jest.spyOn(
            definition.eventStore,
            'appendEventsToAggregates'
          )

          const repository = Repository(definition)
          const AggregateType = Aggregate({
            ...todoListDefinition,
            events: [
              DomainEvent({
                name: 'Event',
                reducer: () => {},
              }),
            ],
            commands: [
              {
                name: 'DoIt',
                raisableErrors: [],
                emittableEvents: ['Event'],
                handler: (_, { emit }) => {
                  emit.Event(null, SOFT_CONSISTENCY_POLICY)
                },
              },
            ],
          })
          const aggregate = AggregateType('x', {
            version: Math.ceil(Math.random() * 20),
            serializedState: JSON.stringify(todoListDefinition.initialState),
          })
          aggregate.execute.DoIt()

          expect(aggregate.getConsistencyPolicy()).toBe(SOFT_CONSISTENCY_POLICY)

          await repository.persist([aggregate]).catch(noop)

          const [insertion] = spyAppendEventsToAggregates.mock.calls[0][0]
          expect(insertion.expectedAggregateVersion).toBe(-1)
        })
        it('=== -2 if aggregate.getConsistencyPolicy === NO_CONSISTENCY_POLICY', async () => {
          const definition = getDefinition()
          const spyAppendEventsToAggregates = jest.spyOn(
            definition.eventStore,
            'appendEventsToAggregates'
          )

          const repository = Repository(definition)
          const AggregateType = Aggregate({
            ...todoListDefinition,
            events: [
              DomainEvent({
                name: 'Event',
                reducer: () => {},
              }),
            ],
            commands: [
              {
                name: 'DoIt',
                raisableErrors: [],
                emittableEvents: ['Event'],
                handler: (_, { emit }) => {
                  emit.Event(null, NO_CONSISTENCY_POLICY)
                },
              },
            ],
          })
          const aggregate = AggregateType('x', {
            version: Math.ceil(Math.random() * 20),
            serializedState: JSON.stringify(todoListDefinition.initialState),
          })
          aggregate.execute.DoIt()

          expect(aggregate.getConsistencyPolicy()).toBe(NO_CONSISTENCY_POLICY)

          await repository.persist([aggregate]).catch(noop)

          const [insertion] = spyAppendEventsToAggregates.mock.calls[0][0]
          expect(insertion.expectedAggregateVersion).toBe(-2)
        })
      })
    })
  })
})

describe('Behaviour in case of eventStore.appendEventsToAggregates() failure with `error`', () => {
  it('fails with `RepositoryWriteError` exposing the eventStore error at error.data.originalError', async () => {
    const definition = getDefinition()
    const error = new Error(`${Math.random()}`)
    jest
      .spyOn(definition.eventStore, 'appendEventsToAggregates')
      .mockImplementation(() => Promise.reject(error))

    const repository = Repository(definition)
    const todoList = TodoList('A')
    todoList.execute.CreateList({ identity: 'A', name: 'A list' })

    try {
      await repository.persist([todoList])
      throw new Error(
        'repository.persist() should fail with `RepositoryWriteError`'
      )
    } catch (e) {
      expect(e instanceof RepositoryWriteError).toBe(true)
      expect(e.message).toBe(error.message)
      expect(e.data.originalError).toBe(error)
    }
  })
  it('if error.concurrency === true fails with `RepositoryWriteConcurrencyError` exposing the eventStore error at error.data.originalError', async () => {
    const definition = getDefinition()
    const error = new Error(`${Math.random()}`)
    error.concurrency = true

    jest
      .spyOn(definition.eventStore, 'appendEventsToAggregates')
      .mockImplementation(() => Promise.reject(error))

    const repository = Repository(definition)
    const todoList = TodoList('A')
    todoList.execute.CreateList({ identity: 'A', name: 'A list' })

    try {
      await repository.persist([todoList])
      throw new Error(
        'repository.persist() should fail with `RepositoryWriteError`'
      )
    } catch (e) {
      expect(e instanceof RepositoryWriteConcurrencyError).toBe(true)
      expect(e.message).toBe(error.message)
      expect(e.data.originalError).toBe(error)
    }
  })
})

describe('Behaviour in case of eventStore.getEventsOfAggregate() failure with `error`', () => {
  it('DOES NOT fail but result.aggregates is undefined', async () => {
    const definition = getDefinition()
    const error = new Error()
    jest
      .spyOn(definition.eventStore, 'getEventsOfAggregate')
      .mockImplementation(() => Promise.reject(error))

    const repository = Repository(definition)
    const todoList = TodoList('A')
    todoList.execute.CreateList({ identity: 'A', name: 'A list' })

    const result = await repository.persist([todoList])
    expect(result.aggregates).toBe(undefined)
  })
})
