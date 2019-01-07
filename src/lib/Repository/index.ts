import { noop, pick } from 'lodash'

import { NO_CONSISTENCY_POLICY, SOFT_CONSISTENCY_POLICY } from '../Aggregate'
import { CustomError } from '../CustomError'

import {
  EventStoreInsertion,
  RepositoryDefinition,
  RepositoryInstance,
} from './types'
import validateAggregatesList from './validateAggregatesList'
import validateDefinition from './validateDefinition'

interface WithOriginalError {
  readonly originalError: Error
}

export const BadRepositoryDefinition = CustomError<
  'BadRepositoryDefinition',
  WithOriginalError
>({ name: 'BadRepositoryDefinition' })

export const RepositorySnapshotLoadError = CustomError<
  'RepositorySnapshotLoadError',
  WithOriginalError
>({
  name: 'RepositorySnapshotLoadError',
})

export const RepositoryBadAggregatesListProvided = CustomError<
  'RepositoryBadAggregatesListProvided',
  WithOriginalError
>({
  name: 'RepositoryBadAggregatesListProvided',
})

export const RepositoryEventsLoadError = CustomError<
  'RepositoryEventsLoadError',
  WithOriginalError
>({
  name: 'RepositoryEventsLoadError',
})

export const RepositoryWriteError = CustomError<
  'RepositoryWriteError',
  WithOriginalError
>({
  name: 'RepositoryWriteError',
})
export const RepositoryWriteConcurrencyError = CustomError<
  'RepositoryWriteConcurrencyError',
  WithOriginalError
>({
  name: 'RepositoryWriteConcurrencyError',
})

export function Repository<T>(
  definition: RepositoryDefinition
): RepositoryInstance<T> {
  try {
    // tslint:disable no-expression-statement
    validateDefinition(definition)
    // tslint:enable
  } catch (e) {
    throw BadRepositoryDefinition(e.message, { originalError: e })
  }

  const {
    eventStore,
    snapshotService,
    loadCanFailBecauseOfSnaphotService,
  } = definition

  const loadAggregate = async (aggregate: any): Promise<any> => {
    const snapshot = snapshotService
      ? await snapshotService
          .loadAggregateSnapshot(aggregate.snapshotKey)
          .catch(error => {
            // tslint:disable no-if-statement
            if (!loadCanFailBecauseOfSnaphotService) return undefined
            // tslint:enable
            throw RepositorySnapshotLoadError(error.message, {
              originalError: error,
            })
          })
      : undefined
    const events = await eventStore
      .getEventsOfAggregate(aggregate, snapshot ? snapshot.version : 0)
      .catch(error => {
        throw RepositoryEventsLoadError(error.message, { originalError: error })
      })
    const loadedAggregate = aggregate.New(aggregate.identity, snapshot, events)

    // tslint:disable no-if-statement no-expression-statement
    if (loadedAggregate.needsSnapshot && snapshotService) {
      snapshotService
        .saveAggregateSnapshot(
          loadedAggregate.snapshotKey,
          loadedAggregate.getSnapshot()
        )
        .catch(noop)
    }
    // tslint:enable

    return loadedAggregate
  }

  const load = <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates
  ) => {
    // tslint:disable no-expression-statement
    try {
      validateAggregatesList(aggregates)
    } catch (error) {
      throw RepositoryBadAggregatesListProvided(error.message, {
        originalError: error,
      })
    }
    // tslint:enable

    return (Promise.all(aggregates.map(loadAggregate)) as unknown) as Promise<
      Aggregates
    >
  }

  const persist = <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates,
    correlationId?: string
  ) => {
    // tslint:disable no-expression-statement
    try {
      validateAggregatesList(aggregates)
    } catch (error) {
      throw RepositoryBadAggregatesListProvided(error.message, {
        originalError: error,
      })
    }
    // tslint:enable

    const insertions = aggregates
      .filter((aggregate: any) => aggregate.isDirty())
      .reduce<ReadonlyArray<EventStoreInsertion>>((list, aggregate: any) => {
        const eventsToAppend = aggregate
          .getNewEvents()
          .map(({ name, getSerializedPayload }: any) => ({
            name,
            payload: getSerializedPayload(),
          }))
        const consistencyPolicy = aggregate.getConsistencyPolicy()
        return list.concat({
          aggregate: pick(aggregate, ['context', 'type', 'identity']) as any,
          eventsToAppend,
          expectedAggregateVersion:
            consistencyPolicy === NO_CONSISTENCY_POLICY
              ? -2
              : consistencyPolicy === SOFT_CONSISTENCY_POLICY
              ? -1
              : aggregate.version,
        })
      }, [])

    const persistenceIO = insertions.length
      ? eventStore
          .appendEventsToAggregates(insertions, correlationId || '')
          .catch(error => {
            const ErrorType = error.concurrency
              ? RepositoryWriteConcurrencyError
              : RepositoryWriteError
            return Promise.reject(
              ErrorType(error.message, { originalError: error })
            )
          })
      : Promise.resolve([])

    return persistenceIO.then(persistedEvents =>
      load(aggregates)
        .then(reloadedAggregates => ({
          aggregates: reloadedAggregates,
          persistedEvents,
        }))
        .catch(() => ({ persistedEvents }))
    )
  }

  return { load, persist }
}

export * from './InMemoryEventStore'
export * from './InMemorySnapshotService'
