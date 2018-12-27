import { range } from 'lodash'

import {
  AggregateIdentity,
  AggregateTypeName,
  BoundedContext,
} from '../Aggregate/types'

import { EventStore, PersistedDomainEvent } from './types'

export type StoredEvent = PersistedDomainEvent & {
  readonly id: string
  readonly aggregate: {
    readonly context: BoundedContext
    readonly type: AggregateTypeName
    readonly identity: AggregateIdentity
  }
}

export const InMemoryEventStore = (): EventStore => {
  // tslint:disable readonly-array
  const events: StoredEvent[] = []
  // tslint:enable

  const getAggregateEvents = (aggregate: {
    readonly context: BoundedContext
    readonly type: AggregateTypeName
    readonly identity: AggregateIdentity
  }) =>
    events
      .filter(
        event =>
          event.aggregate.context === aggregate.context &&
          event.aggregate.type === aggregate.type &&
          event.aggregate.identity === aggregate.identity
      )
      .map(({ name, payload }) => ({ name, payload }))

  const getNewId = (): string => padLeftWithZeroes(`${events.length + 1}`)

  return {
    appendEventsToAggregates: async (insertions, correlationId = '') => {
      // tslint:disable readonly-array
      const persistedEvents: PersistedDomainEvent[] = []
      // tslint:enable

      /**
       * Concurrency check
       */
      // tslint:disable no-expression-statement no-if-statement no-object-mutation
      insertions.forEach(({ aggregate, expectedAggregateVersion }) => {
        if (expectedAggregateVersion === -2) return

        const aggregateEvents = getAggregateEvents(aggregate)
        const aggregateVersion = aggregateEvents.length
        if (expectedAggregateVersion === -1 && aggregateVersion) return
        if (expectedAggregateVersion === aggregateVersion) return

        const aggregateName = getAggregateName(aggregate)
        const errorMessage =
          expectedAggregateVersion === -1
            ? `Aggregate ${aggregateName} was expected to exist but it does not`
            : `Aggregate ${aggregateName} was expected to be at version ${expectedAggregateVersion} but it is at version ${aggregateVersion}`
        const error = new Error(errorMessage)
        ;(error as any).concurrency = true

        throw error
      })

      /**
       * Events storage operation
       */
      insertions.forEach(({ aggregate, eventsToAppend }) => {
        eventsToAppend.forEach(({ name, payload }) => {
          const eventToPersist = {
            aggregate: { ...aggregate },
            correlationId,
            id: getNewId(),
            name,
            payload,
          }
          events.push(eventToPersist)
          persistedEvents.push(eventToPersist)
        })
      })
      // tslint:enable

      return persistedEvents as ReadonlyArray<PersistedDomainEvent>
    },
    getEventsOfAggregate: async (aggregate, fromVersion = 0) => {
      return getAggregateEvents(aggregate).slice(fromVersion)
    },
  }
}

const getAggregateName = ({
  context,
  type,
  identity,
}: {
  readonly context: BoundedContext
  readonly type: AggregateTypeName
  readonly identity: AggregateIdentity
}) => `${context}:${type}${identity ? `:${identity}` : ''}`

export const padLeftWithZeroes = (i: string, minLength: number = 10): string =>
  i.length >= minLength
    ? i
    : range(minLength - i.length)
        .map(() => '0')
        .join('') + i
