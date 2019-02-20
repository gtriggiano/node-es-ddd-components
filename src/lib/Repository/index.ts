// tslint:disable no-submodule-imports no-if-statement no-expression-statement no-unnecessary-type-assertion
import { Either, left, Left, right, Right } from 'fp-ts/lib/Either'
import { noop, pick } from 'lodash'

import { NO_CONSISTENCY_POLICY, SOFT_CONSISTENCY_POLICY } from '../Aggregate'
import { CustomError } from '../CustomError'

import { AggregateSnapshot, ConsistencyPolicy } from '../Aggregate/types'
import {
  DomainEventInstance,
  SerializedDomainEvent,
} from '../DomainEvent/types'
import {
  AggregateIdentifier,
  AvailabilityError,
  EventStoreAppendResult,
  EventStoreInsertion,
  RepositoryDefinition,
  RepositoryInstance,
  RepositoryInstanceLoadResult,
  RepositoryInstancePersistResult,
  UnknownError,
} from './types'
import validateAggregatesList from './validateAggregatesList'
import validateDefinition from './validateDefinition'

export * from './InMemoryEventStore'
export * from './InMemorySnapshotService'
export { EventStore, SerializedEventsList } from './types'

interface WithOriginalError {
  readonly originalError: Error
}

export const BadRepositoryDefinition = CustomError<
  'BadRepositoryDefinition',
  WithOriginalError
>({ name: 'BadRepositoryDefinition' })

export const RepositoryBadAggregatesListProvided = CustomError<
  'RepositoryBadAggregatesListProvided',
  WithOriginalError
>({
  name: 'RepositoryBadAggregatesListProvided',
})

export function Repository<T>(
  definition: RepositoryDefinition
): RepositoryInstance<T> {
  try {
    validateDefinition(definition)
  } catch (e) {
    throw BadRepositoryDefinition(e.message, { originalError: e })
  }

  const {
    eventStore,
    snapshotService,
    loadCanFailBecauseOfSnaphotService,
  } = definition

  const loadAggregate = async (
    aggregate: any
  ): Promise<Either<AvailabilityError | UnknownError, any>> => {
    const snapshotServiceResult = snapshotService
      ? await snapshotService
          .loadAggregateSnapshot(aggregate.snapshotKey)
          .catch(
            error =>
              left({
                type: 'UNKNOWN',
                ...error,
              }) as Left<UnknownError, any>
          )
      : (right(undefined) as Right<any, AggregateSnapshot | undefined>)

    if (snapshotServiceResult.isLeft() && loadCanFailBecauseOfSnaphotService) {
      return left(snapshotServiceResult.value) as Left<
        typeof snapshotServiceResult.value,
        any
      >
    }

    const snapshot = snapshotServiceResult.isRight()
      ? snapshotServiceResult.value
      : undefined

    const eventStoreResult = await eventStore
      .getEventsOfAggregate(aggregate, snapshot ? snapshot.version : 0)
      .catch(
        error =>
          left({
            type: 'UNKNOWN',
            ...error,
          }) as Left<UnknownError, any>
      )

    if (eventStoreResult.isLeft()) {
      return left(eventStoreResult.value) as Left<
        typeof eventStoreResult.value,
        any
      >
    }

    const loadedAggregate = aggregate.New(
      aggregate.identity,
      snapshot,
      eventStoreResult.value
    )

    if (loadedAggregate.needsSnapshot && snapshotService) {
      snapshotService
        .saveAggregateSnapshot(
          loadedAggregate.snapshotKey,
          loadedAggregate.getSnapshot()
        )
        .catch(noop)
    }

    return right(loadedAggregate) as Right<any, any>
  }

  const load = <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates
  ) => {
    try {
      validateAggregatesList(aggregates)
    } catch (error) {
      throw RepositoryBadAggregatesListProvided(error.message, {
        originalError: error,
      })
    }

    return Promise.all(aggregates.map(loadAggregate))
      .then(results => {
        const errors = results.reduce<
          ReadonlyArray<AvailabilityError | UnknownError>
        >(
          (errorsList, result) =>
            result.isLeft() ? errorsList.concat(result.value) : errorsList,
          []
        )

        if (errors.length) {
          return left(errors[0]) as RepositoryInstanceLoadResult<Aggregates>
        }

        return (right(
          results.map(result => result.value)
        ) as unknown) as RepositoryInstanceLoadResult<Aggregates>
      })
      .catch(
        error =>
          left({ type: 'UNKNOWN', ...error }) as RepositoryInstanceLoadResult<
            Aggregates
          >
      )
  }

  const persist = <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates,
    correlationId?: string
  ) => {
    try {
      validateAggregatesList(aggregates)
    } catch (error) {
      throw RepositoryBadAggregatesListProvided(error.message, {
        originalError: error,
      })
    }

    const insertions = aggregates.reduce<ReadonlyArray<EventStoreInsertion>>(
      (list, aggregate: any) => {
        const eventsToAppend = aggregate.getNewEvents() as ReadonlyArray<
          DomainEventInstance<string, any, object>
        >

        const serializedEventsToAppend = eventsToAppend.map<
          SerializedDomainEvent
        >(
          ({
            name,
            getSerializedPayload,
          }: DomainEventInstance<string, any, object>) => ({
            name,
            payload: getSerializedPayload(),
          })
        )

        const consistencyPolicy = aggregate.getConsistencyPolicy() as ConsistencyPolicy

        return list.concat({
          aggregate: pick(aggregate, [
            'context',
            'type',
            'identity',
          ]) as AggregateIdentifier,
          eventsToAppend: serializedEventsToAppend,
          expectedAggregateVersion:
            consistencyPolicy === NO_CONSISTENCY_POLICY
              ? -2
              : consistencyPolicy === SOFT_CONSISTENCY_POLICY
              ? -1
              : aggregate.version,
        })
      },
      []
    )

    const appendOperationResult = eventStore
      .appendEventsToAggregates(insertions, correlationId || '')
      .catch(
        error =>
          left({
            type: 'UNKNOWN',
            ...error,
          }) as EventStoreAppendResult
      )

    return appendOperationResult.then(result => {
      if (result.isLeft()) {
        return left(result.value) as RepositoryInstancePersistResult<Aggregates>
      }

      return load(aggregates).then(
        loadResult =>
          right({
            aggregates: loadResult.isRight() ? loadResult.value : undefined,
            persistedEvents: result.value,
          }) as RepositoryInstancePersistResult<Aggregates>
      )
    })
  }

  return { load, persist }
}
