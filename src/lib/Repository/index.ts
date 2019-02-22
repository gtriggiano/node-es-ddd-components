// tslint:disable no-submodule-imports no-if-statement no-expression-statement no-unnecessary-type-assertion
import { Either, left, Left, right } from 'fp-ts/lib/Either'
import { noop, pick } from 'lodash'

import { NO_CONSISTENCY_POLICY, SOFT_CONSISTENCY_POLICY } from '../Aggregate'
import { CustomError } from '../CustomError'

import {
  DomainEventInstance,
  SerializedDomainEvent,
} from '../DomainEvent/types'
import {
  EventStoreInsertion,
  EventStoreReadResult,
  EventStoreWriteResult,
  GenericAggregateInstance,
  RepositoryDefinition,
  RepositoryDefinitionEventsReadError,
  RepositoryDefinitionEventsWriteError,
  RepositoryDefinitionReadError,
  RepositoryDefinitionSnaphotReadError,
  RepositoryDefinitionWriteError,
  RepositoryInstance,
  RepositoryInstancePersistResult,
  SnapshotServiceReadResult,
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

export function Repository<
  Aggregate extends GenericAggregateInstance = GenericAggregateInstance,
  Definition extends RepositoryDefinition = RepositoryDefinition
>(
  definition: Definition
): RepositoryInstance<
  Aggregate,
  RepositoryDefinitionReadError<Definition>,
  RepositoryDefinitionWriteError<Definition>
> {
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

  type LoadAggregateResult = Either<
    RepositoryDefinitionReadError<Definition>,
    Aggregate
  >

  const loadAggregate = async (
    aggregate: Aggregate
  ): Promise<LoadAggregateResult> => {
    const snapshotServiceResult: SnapshotServiceReadResult<
      RepositoryDefinitionSnaphotReadError<Definition>
    > = snapshotService
      ? await snapshotService
          .loadAggregateSnapshot(aggregate.snapshotKey)
          .catch(error => left(error))
      : right(undefined)

    if (snapshotServiceResult.isLeft() && loadCanFailBecauseOfSnaphotService) {
      return left(snapshotServiceResult.value)
    }

    const snapshot = snapshotServiceResult.isRight()
      ? snapshotServiceResult.value
      : undefined

    const eventStoreResult = (await eventStore
      .getEventsOfAggregate(aggregate, snapshot ? snapshot.version : 0)
      .catch(error => left(error))) as EventStoreReadResult<
      RepositoryDefinitionEventsReadError<Definition>
    >

    if (eventStoreResult.isLeft()) {
      return left(eventStoreResult.value) as LoadAggregateResult
    }

    const loadedAggregate = aggregate.New(
      aggregate.identity as string & undefined,
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

    return right(loadedAggregate) as LoadAggregateResult
  }

  const repository: RepositoryInstance<
    Aggregate,
    RepositoryDefinitionReadError<Definition>,
    RepositoryDefinitionWriteError<Definition>
  > = {
    load: aggregates => {
      try {
        validateAggregatesList(aggregates)
      } catch (error) {
        throw RepositoryBadAggregatesListProvided(error.message, {
          originalError: error,
        })
      }

      return Promise.all(
        aggregates.map((aggregate: Aggregate) => loadAggregate(aggregate))
      ).then(results => {
        const errors = results.filter(
          (
            result
          ): result is Left<
            RepositoryDefinitionEventsReadError<Definition>,
            Aggregate
          > => result.isLeft()
        )

        if (errors.length) {
          return left(errors[0].value) as Either<
            RepositoryDefinitionEventsReadError<Definition>,
            typeof aggregates
          >
        }

        const loadedAggregates = (results
          .filter(result => result.isRight())
          .map<Aggregate>(
            result => result.value as Aggregate
          ) as unknown) as typeof aggregates

        return right(loadedAggregates) as Either<
          RepositoryDefinitionEventsReadError<Definition>,
          typeof aggregates
        >
      })
    },
    persist: (aggregates, correlationId) => {
      try {
        validateAggregatesList(aggregates)
      } catch (error) {
        throw RepositoryBadAggregatesListProvided(error.message, {
          originalError: error,
        })
      }

      const insertions = aggregates.reduce<ReadonlyArray<EventStoreInsertion>>(
        (list, aggregate) => {
          const eventsToAppend = aggregate.getNewEvents()

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

          const consistencyPolicy = aggregate.getConsistencyPolicy()

          return list.concat({
            aggregate: pick(aggregate, ['context', 'type', 'identity']),
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
        .catch(error => left(error)) as Promise<
        EventStoreWriteResult<RepositoryDefinitionEventsWriteError<Definition>>
      >

      return appendOperationResult.then(result => {
        if (result.isLeft()) {
          return left(result.value) as RepositoryInstancePersistResult<
            typeof aggregates,
            RepositoryDefinitionEventsWriteError<Definition>
          >
        }

        return repository.load(aggregates).then(
          loadResult =>
            right({
              aggregates: loadResult.isRight() ? loadResult.value : undefined,
              persistedEvents: result.value,
            }) as RepositoryInstancePersistResult<
              typeof aggregates,
              RepositoryDefinitionEventsWriteError<Definition>
            >
        )
      })
    },
  }

  return repository
}
