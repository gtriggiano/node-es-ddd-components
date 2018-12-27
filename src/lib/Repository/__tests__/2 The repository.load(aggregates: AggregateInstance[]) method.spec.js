import 'jest'
import { sample } from 'lodash'

import {
  Aggregate,
  Repository,
  InMemoryEventStore,
  InMemorySnapshotService,
  RepositoryBadAggregatesListProvided,
  RepositoryEventsLoadError,
  RepositorySnapshotLoadError,
} from 'lib-export'

import TodoList, { definition as todoListDefinition } from 'lib-tests/TodoList'

const getDefinition = () => ({
  eventStore: InMemoryEventStore(),
  snapshotService: InMemorySnapshotService(),
  loadCanFailBecauseOfSnaphotService: false,
})

describe('Throwing cases', () => {
  it('throws `RepositoryBadAggregatesListProvided` if `aggregates` is not a list of valid aggregate instances unique by context, type and identity', () => {
    const definition = getDefinition()
    const repository = Repository(definition)
    const todoListX = TodoList('x')
    const todoListY = TodoList('y')

    expect(() => repository.load(1)).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.load([1])).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.load([todoListX, null])).toThrowError(
      RepositoryBadAggregatesListProvided
    )
    expect(() => repository.load([todoListX, todoListX])).toThrowError(
      RepositoryBadAggregatesListProvided
    )

    expect(() => repository.load([todoListX, todoListY])).not.toThrow()
  })
})

describe('Returned value', () => {
  const toIdentity = ({ context, type, id }) => `${context}:${type}:${id}`

  it('is a promise', () => {
    const definition = getDefinition()
    const repository = Repository(definition)
    const todoList = TodoList('x')

    const ret = repository.load([todoList])
    expect(typeof ret.then).toBe('function')
    expect(typeof ret.catch).toBe('function')
  })
  it('promised value is a list of rebuilt aggregate instances', async () => {
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
  it('the order of entities received as argument in mantained in the returned list', async () => {
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

describe('Interaction with `snapshotService`', () => {
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
    expect(spyLoadAggregateSnapshot.mock.calls[0][0]).toBe(todoList.snapshotKey)
  })

  it('calls snapshotService.saveAggregateSnapshot(aggregate.snapshotKey, {version: aggregate.version, serializedState: aggregate.getSerializedState()}) after rebuilding an aggregate, if aggregate.needsSnapshot === true', async () => {
    const definition = getDefinition()
    const spySaveAggregateSnapshot = jest.spyOn(
      definition.snapshotService,
      'saveAggregateSnapshot'
    )

    const repository = Repository(definition)
    let TodoList = Aggregate(todoListDefinition)
    let todoList = TodoList('x')

    todoList.execute.CreateList({ identity: 'x', name: 'A list' })
    todoList.execute.ChangeListName({ name: 'New name' })
    todoList.execute.ChangeListName({ name: 'Another name' })

    await repository.persist([todoList])

    TodoList = Aggregate({
      ...todoListDefinition,
      snapshotThreshold: 2,
    })
    todoList = TodoList('x')
    ;[todoList] = await repository.load([todoList])

    expect(spySaveAggregateSnapshot.mock.calls.length).toBe(1)

    const persistedSnapshotKey = spySaveAggregateSnapshot.mock.calls[0][0]
    const persistedSnapshot = spySaveAggregateSnapshot.mock.calls[0][1]
    expect(persistedSnapshotKey).toBe(todoList.snapshotKey)
    expect(persistedSnapshot).toEqual({
      version: todoList.version,
      serializedState: todoList.getSerializedState(),
    })
  })
})

describe('Behaviour in case of snpshotService.loadAggregateSnapshot() failure with `error`', () => {
  it('DOES NOT FAIL if definition.loadCanFailBecauseOfSnaphotService is falsy', async () => {
    const falsyValues = [undefined, null, false, 0, NaN, '']
    const definition = {
      ...getDefinition(),
      loadCanFailBecauseOfSnaphotService: sample(falsyValues),
    }
    const spyLoadAggregateSnapshot = jest
      .spyOn(definition.snapshotService, 'loadAggregateSnapshot')
      .mockImplementation(() => new Promise((_, reject) => reject(new Error())))

    const repository = Repository(definition)
    const todoList = TodoList('x')

    await repository.load([todoList])

    expect(spyLoadAggregateSnapshot.mock.calls.length).toBe(1)
  })
  it('FAILS with `RepositorySnapshotLoadError` if definition.loadCanFailBecauseOfSnaphotService is truthy. error.data.originalError === error', async () => {
    const definition = getDefinition()
    const errorMessage = `repository.load() should reject`
    const truthyValues = [true, {}, [], 1, 'x', () => {}]
    const error = new Error()

    const repository = Repository({
      ...definition,
      snapshotService: {
        ...definition.snapshotService,
        loadAggregateSnapshot: () => Promise.reject(error),
      },
      loadCanFailBecauseOfSnaphotService: sample(truthyValues),
    })
    const todoList = TodoList('x')

    try {
      await repository.load([todoList])
      throw new Error(errorMessage)
    } catch (e) {
      expect(e instanceof RepositorySnapshotLoadError).toBe(true)
      expect(e.data.originalError).toBe(error)
    }
  })
})

describe('Behaviour in case of snapshotService.saveAggregateSnapshot() failure', () => {
  it('DOES NOT FAIL', async () => {
    const definition = getDefinition()
    const spySaveAggregateSnapshot = jest
      .spyOn(definition.snapshotService, 'saveAggregateSnapshot')
      .mockImplementation(() => new Promise((_, reject) => reject(new Error())))

    const repository = Repository(definition)

    let TodoList = Aggregate(todoListDefinition)
    let todoList = TodoList('x')
    todoList.execute.CreateList({ identity: 'x', name: 'A list' })
    todoList.execute.ChangeListName({ name: 'New name' })
    todoList.execute.ChangeListName({ name: 'Another name' })

    await repository.persist([todoList])

    TodoList = Aggregate({
      ...todoListDefinition,
      snapshotThreshold: 2,
    })
    todoList = TodoList('x')

    await repository.load([todoList])

    expect(spySaveAggregateSnapshot.mock.calls.length).toBe(1)
  })
})

describe('Interaction with `eventStore`', () => {
  describe('When a `snapshotService` is not specified in the repository definition', () => {
    it('calls eventStore.getEventsOfAggregate(aggregate, 0)', async () => {
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

  describe('When a snapshot HAS NOT been retrieved through snapshotService', () => {
    it('calls eventStore.getEventsOfAggregate(aggregate, 0)', async () => {
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

  describe('When a `snapshot` has been retrieved through snapshotService', () => {
    it('calls eventStore.getEventsOfAggregate(aggregate, snapshot.version)', async () => {
      const definition = getDefinition()
      const spyGetEventsOfAggregate = jest.spyOn(
        definition.eventStore,
        'getEventsOfAggregate'
      )

      const repository = Repository(definition)
      const todoList = TodoList('x')
      const randomVersion = Math.floor(1 + Math.random() * 10)

      await definition.snapshotService.saveAggregateSnapshot(
        todoList.snapshotKey,
        {
          version: randomVersion,
          serializedState: todoList.getSerializedState(),
        }
      )

      await repository.load([todoList])

      expect(spyGetEventsOfAggregate.mock.calls.length).toBe(1)
      expect(spyGetEventsOfAggregate.mock.calls[0][0]).toBe(todoList)
      expect(spyGetEventsOfAggregate.mock.calls[0][1]).toBe(randomVersion)
    })
  })
})

describe('Behaviour in case of eventStore.getEventsOfAggregate() failure with `error`', () => {
  it('FAILS with `RepositoryEventsLoadError`. error.data.originalError === error', async () => {
    const definition = getDefinition()
    const error = new Error()
    const repository = Repository({
      ...definition,
      eventStore: {
        ...definition.eventStore,
        getEventsOfAggregate: () => Promise.reject(error),
      },
    })
    const todoList = TodoList('x')

    try {
      await repository.load([todoList])
      throw new Error('repository.load() should reject')
    } catch (e) {
      expect(e instanceof RepositoryEventsLoadError).toBe(true)
      expect(e.data.originalError).toBe(error)
    }
  })
})
