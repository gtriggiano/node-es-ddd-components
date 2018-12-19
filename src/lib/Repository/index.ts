import { noop, pick } from 'lodash'

import { GenericAggregateInstance } from '../Aggregate/types'
import { CustomError } from '../CustomError'

import {
  EventStoreInsertion,
  RepositoryDefinition,
  RepositoryInstance,
} from './types'
import validateDefinition from './validateDefinition'

interface WithOriginalError {
  readonly originalError: Error
}

export const BadRepositoryDefinition = CustomError<
  'BadRepositoryDefinition',
  WithOriginalError
>({ name: 'BadRepositoryDefinition' })

export const WriteConcurrencyError = CustomError<'WriteConcurrencyError'>({
  name: 'WriteConcurrencyError',
})

export function Repository<
  Aggregate extends GenericAggregateInstance = GenericAggregateInstance
>(
  definition: RepositoryDefinition
): RepositoryInstance<ReadonlyArray<Aggregate>> {
  try {
    // tslint:disable no-expression-statement
    validateDefinition(definition)
    // tslint:enable
  } catch (e) {
    throw BadRepositoryDefinition(e.message, { originalError: e })
  }

  const { eventStore, snapshotService } = definition

  const loadAggregate = async (aggregate: Aggregate): Promise<Aggregate> => {
    const snapshot = snapshotService
      ? await snapshotService.loadAggregateSnapshot(aggregate.snapshotKey)
      : undefined
    const events = await eventStore.getEventsOfAggregate(
      aggregate,
      snapshot ? snapshot.version : 0
    )
    const loadedAggregate = aggregate.New(aggregate.identity, snapshot, events)

    // tslint:disable no-if-statement no-expression-statement
    if (loadedAggregate.needsSnapshot && snapshotService) {
      snapshotService
        .saveAggregateSnapshot(loadedAggregate.snapshotKey, {
          serializedState: loadedAggregate.getSerializedState(),
          version: loadedAggregate.version,
        })
        .catch(noop)
    }
    // tslint:enable

    return loadedAggregate as Aggregate
  }

  const load: RepositoryInstance<
    ReadonlyArray<Aggregate>
  >['load'] = aggregates => Promise.all(aggregates.map(loadAggregate))

  const persist: RepositoryInstance<
    ReadonlyArray<Aggregate>
  >['persist'] = async (aggregates, correlationId) => {
    const insertions = aggregates.reduce<ReadonlyArray<EventStoreInsertion>>(
      (list, aggregate) => {
        const newEvents = aggregate.getNewEvents()
        return !newEvents.length
          ? list
          : list.concat({
              aggregate: pick(aggregate, ['context', 'type', 'identity']),
              eventsToAppend: newEvents.map(
                ({ name, getSerializedPayload }) => ({
                  name,
                  payload: getSerializedPayload(),
                })
              ),
              expectedAggregateVersion: aggregate.version,
            })
      },
      []
    )
    const persistedEvents = insertions.length
      ? await eventStore.appendEventsToAggregates(
          insertions,
          correlationId || ''
        )
      : []

    const reloadedAggregates = await load(aggregates)

    return {
      aggregates: reloadedAggregates,
      persistedEvents,
    }
  }

  return { load, persist }
}

export * from './InMemoryEventStore'
export * from './InMemorySnapshotService'
