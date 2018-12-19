import 'jest'
import { pick } from 'lodash'

import {
  Aggregate,
  Repository,
  InMemoryEventStore,
  InMemorySnapshotService,
} from '../../../../dist/main/lib'

import TodoList, {
  definition as todoListDefinition,
} from '../../../../dist/main/tests/TodoList'

const getDefinition = () => ({
  eventStore: InMemoryEventStore(),
  snapshotService: InMemorySnapshotService(),
})

describe('A repository instance `load(aggregates)` method.', () => {
  describe('Interaction with `snapshotService', () => {
    it('calls snapshotService.loadAggregateSnapshot(aggregate.snapshotKey)', async () => {
      const definition = getDefinition()
      const spyLoadAggregateSnapshot = jest.spyOn(
        definition.snapshotService,
        'loadAggregateSnapshot'
      )

      const repository = Repository(definition)
      const todoList = TodoList('x')

      await repository.load([todoList])

      expect(spyLoadAggregateSnapshot.mock.calls.length).toBe(1)
      expect(spyLoadAggregateSnapshot.mock.calls[0][0]).toBe(
        todoList.snapshotKey
      )
    })
    it('rejects with `e` if snpshotService.loadAggregateSnapshot() rejects with `e`', done => {
      const definition = getDefinition()
      const error = new Error()
      const spyLoadAggregateSnapshot = jest
        .spyOn(definition.snapshotService, 'loadAggregateSnapshot')
        .mockImplementation(() => new Promise((_, reject) => reject(error)))

      const repository = Repository(definition)
      const todoList = TodoList('x')

      repository
        .load([todoList])
        .then(() => {
          done(new Error('repository.load() should reject'))
        })
        .catch(e => {
          expect(e).toBe(error)
          done()
        })
        .then(() => {
          spyLoadAggregateSnapshot.mockRestore()
        })
    })
    it('fires an async snapshotService.saveAggregateSnapshot(aggregate.snapshotKey, {version: aggregate.version, serializedState: aggregate.getSerializedState()}) if aggregate.needsSnapshot after rebuilding', done => {
      const definition = getDefinition()
      const spySaveAggregateSnapshot = jest.spyOn(
        definition.snapshotService,
        'saveAggregateSnapshot'
      )

      const repository = Repository(definition)
      const TodoList = Aggregate({
        ...todoListDefinition,
        snapshotThreshold: 2,
      })
      const todoList = TodoList('x')

      todoList.execute.CreateList({ identity: 'x', name: 'A list' })
      todoList.execute.ChangeListName({ name: 'New name' })
      todoList.execute.ChangeListName({ name: 'Another name' })

      repository.persist([todoList]).then(({ aggregates: [todoList] }) => {
        expect(spySaveAggregateSnapshot.mock.calls.length).toBe(1)

        const persistedSnapshotKey = spySaveAggregateSnapshot.mock.calls[0][0]
        const persistedSnapshot = spySaveAggregateSnapshot.mock.calls[0][1]
        expect(persistedSnapshotKey).toBe(todoList.snapshotKey)
        expect(persistedSnapshot).toEqual({
          version: todoList.version,
          serializedState: todoList.getSerializedState(),
        })
        done()
      })
    })
  })

  describe('Interaction with `eventStore`', () => {
    describe('When a `snapshot` has been retrieved', () => {
      it('calls eventstore.getEventsOfAggregate(aggregate, snapshot.version)', async () => {
        const definition = getDefinition()
        const spyGetEventsOfAggregate = jest.spyOn(
          definition.eventStore,
          'getEventsOfAggregate'
        )

        const repository = Repository(definition)
        const todoList = TodoList('x')

        await definition.snapshotService.saveAggregateSnapshot(
          todoList.snapshotKey,
          {
            version: 10,
            serializedState: todoList.getSerializedState(),
          }
        )

        await repository.load([todoList])

        expect(spyGetEventsOfAggregate.mock.calls.length).toBe(1)
        expect(spyGetEventsOfAggregate.mock.calls[0][0]).toBe(todoList)
        expect(spyGetEventsOfAggregate.mock.calls[0][1]).toBe(10)
      })
    })

    describe('When a snapshotService has not been passed in repository definition', () => {
      it('calls eventstore.getEventsOfAggregate(aggregate, 0)', async () => {
        const definition = getDefinition()
        const spyGetEventsOfAggregate = jest.spyOn(
          definition.eventStore,
          'getEventsOfAggregate'
        )

        const repository = Repository({
          ...definition,
          snapshotService: undefined,
        })
        const todoList = TodoList('x')

        await repository.load([todoList])

        expect(spyGetEventsOfAggregate.mock.calls.length).toBe(1)
        expect(spyGetEventsOfAggregate.mock.calls[0][0]).toBe(todoList)
        expect(spyGetEventsOfAggregate.mock.calls[0][1]).toBe(0)
      })
    })

    describe('When a snapshot has not been retrieved', () => {
      it('calls eventstore.getEventsOfAggregate(aggregate, 0)', async () => {
        const definition = getDefinition()
        const spyGetEventsOfAggregate = jest.spyOn(
          definition.eventStore,
          'getEventsOfAggregate'
        )

        const repository = Repository(definition)
        const todoList = TodoList('x')

        await repository.load([todoList])

        expect(spyGetEventsOfAggregate.mock.calls.length).toBe(1)
        expect(spyGetEventsOfAggregate.mock.calls[0][0]).toBe(todoList)
        expect(spyGetEventsOfAggregate.mock.calls[0][1]).toBe(0)
      })
    })

    describe('If eventstore.getEventsOfAggregate() rejects with `e`', () => {
      it('rejects with `e`', done => {
        const definition = getDefinition()
        const error = new Error()
        const spyLoadAggregateSnapshot = jest
          .spyOn(definition.eventStore, 'getEventsOfAggregate')
          .mockImplementation(() => new Promise((_, reject) => reject(error)))

        const repository = Repository(definition)
        const todoList = TodoList('x')

        repository
          .load([todoList])
          .then(() => {
            done(new Error('repository.load() should reject'))
          })
          .catch(e => {
            expect(e).toBe(error)
            done()
          })
      })
    })
  })

  describe('Resolution outcome', () => {
    const toIdentity = ({ context, type, id }) => `${context}:${type}:${id}`

    it('is a list of rebuilt aggregate instances', async () => {
      const definition = getDefinition()
      const repository = Repository(definition)
      const todoListX = TodoList('x')
      const todoListY = TodoList('y')

      todoListX.execute.CreateList({ identity: 'x', name: 'X' })
      todoListX.execute.ChangeListName({ name: 'XX' })
      todoListY.execute.CreateList({ identity: 'x', name: 'Y' })

      await repository.persist([todoListX, todoListY])

      const [loadedTodoListX, loadedTodoListY] = await repository.load([
        todoListX,
        todoListY,
      ])

      expect(toIdentity(loadedTodoListX)).toEqual(toIdentity(todoListX))
      expect(loadedTodoListX.version).toBe(2)
      expect(loadedTodoListX.getSerializedState()).toBe(
        todoListX.getSerializedState()
      )

      expect(toIdentity(loadedTodoListY)).toEqual(toIdentity(todoListY))
      expect(loadedTodoListY.version).toBe(1)
      expect(loadedTodoListY.getSerializedState()).toBe(
        todoListY.getSerializedState()
      )
    })
    it('the order of entities is guaranteed', async () => {
      const definition = getDefinition()
      const repository = Repository(definition)
      const todoListX = TodoList('x')
      const todoListY = TodoList('y')

      const [loadedTodoListX, loadedTodoListY] = await repository.load([
        todoListX,
        todoListY,
      ])

      expect(toIdentity(loadedTodoListX)).toEqual(toIdentity(todoListX))
      expect(toIdentity(loadedTodoListY)).toEqual(toIdentity(todoListY))
    })
  })
})

describe('A repository instance `persist(aggregates [, correlationId])` method.', () => {
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
    it('if only clean aggregates get passed to `persist` then `eventStore.appendEventsToAggregates` does not get invoked', async () => {
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
})
