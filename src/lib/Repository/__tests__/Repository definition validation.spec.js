import 'jest'
import { noop } from 'lodash'

import { Repository, BadRepositoryDefinition } from '../../../../dist/main/lib'

const definition = {
  eventStore: {
    getEventsOfAggregate: noop,
    appendEventsToAggregates: noop,
  },
  snapshotService: {
    loadAggregateSnapshot: noop,
    saveAggregateSnapshot: noop,
  },
}

describe('Repository definition validation. Repository(definition) throws `BadRepositoryDefinition` when:', () => {
  it('definition is not an object', () => {
    expect(() => Repository()).toThrow(BadRepositoryDefinition)
    expect(() => Repository(3)).toThrow(BadRepositoryDefinition)
  })
  it('definition.eventstore is not an EventStore', () => {
    expect(() =>
      Repository({ ...definition, eventStore: undefined })
    ).toThrowError('')
    expect(() => Repository({ ...definition, eventStore: true })).toThrowError(
      BadRepositoryDefinition
    )
    expect(() => Repository({ ...definition, eventStore: '' })).toThrowError(
      BadRepositoryDefinition
    )
    expect(() => Repository({ ...definition, eventStore: {} })).toThrowError(
      BadRepositoryDefinition
    )
    expect(() =>
      Repository({
        ...definition,
        eventStore: { ...definition.eventStore, getEventsOfAggregate: null },
      })
    ).toThrowError(BadRepositoryDefinition)
    expect(() =>
      Repository({
        ...definition,
        eventStore: {
          ...definition.eventStore,
          appendEventsToAggregates: null,
        },
      })
    ).toThrowError(BadRepositoryDefinition)
  })
  it('definition.snapshotService is neither falsy nor a SnapshotService', () => {
    expect(() =>
      Repository({ ...definition, snapshotService: undefined })
    ).not.toThrow()

    expect(() =>
      Repository({ ...definition, snapshotService: true })
    ).toThrowError(BadRepositoryDefinition)
    expect(() =>
      Repository({ ...definition, snapshotService: 'abc' })
    ).toThrowError(BadRepositoryDefinition)
    expect(() =>
      Repository({ ...definition, snapshotService: {} })
    ).toThrowError(BadRepositoryDefinition)
    expect(() =>
      Repository({
        ...definition,
        snapshotService: {
          ...definition.snapshotService,
          loadAggregateSnapshot: null,
        },
      })
    ).toThrowError(BadRepositoryDefinition)
    expect(() =>
      Repository({
        ...definition,
        snapshotService: {
          ...definition.snapshotService,
          saveAggregateSnapshot: null,
        },
      })
    ).toThrowError(BadRepositoryDefinition)
  })
})
