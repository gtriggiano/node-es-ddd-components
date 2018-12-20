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
  AggregateInstance extends GenericAggregateInstance = GenericAggregateInstance
>(
  definition: RepositoryDefinition
): RepositoryInstance<ReadonlyArray<AggregateInstance>> {
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

  const loadAggregate = async (
    aggregate: AggregateInstance
  ): Promise<AggregateInstance> => {
    const snapshot = snapshotService
      ? await snapshotService
          .loadAggregateSnapshot(aggregate.snapshotKey)
          .catch(e => {
            // tslint:disable no-if-statement
            if (!loadCanFailBecauseOfSnaphotService) return undefined
            // tslint:enable
            throw e
          })
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

    return loadedAggregate as AggregateInstance
  }

  const load: RepositoryInstance<
    ReadonlyArray<AggregateInstance>
  >['load'] = aggregates => Promise.all(aggregates.map(loadAggregate))

  const persist: RepositoryInstance<
    ReadonlyArray<AggregateInstance>
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
