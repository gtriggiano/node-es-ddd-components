import { range, uniqueId } from 'lodash'

import {
  AggregateIdentity,
  AggregateTypeName,
  BoundedContext,
} from '../Aggregate/types'
import { PersistedDomainEvent } from '../DomainEvent/types'

import { WriteConcurrencyError } from './index'
import { EventStore } from './types'

export type StoredEvent = PersistedDomainEvent & {
  readonly aggregate: {
    readonly context: BoundedContext
    readonly type: AggregateTypeName
    readonly identity: AggregateIdentity
  }
  readonly version: number
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
    events.filter(
      event =>
        event.aggregate.context === aggregate.context &&
        event.aggregate.type === aggregate.type &&
        event.aggregate.identity === aggregate.identity
    )

  return {
    appendEventsToAggregates: (insertions, correlationId = '') => {
      // tslint:disable readonly-array
      const persistedEvents: PersistedDomainEvent[] = []
      // tslint:enable

      /**
       * Concurrency check
       */
      // tslint:disable no-expression-statement no-if-statement
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
        throw WriteConcurrencyError(errorMessage)
      })

      /**
       * Events storage operation
       */
      insertions.forEach(({ aggregate, eventsToAppend }) => {
        const aggregateVersion = getAggregateEvents(aggregate).length
        eventsToAppend.forEach(({ name, payload }, idx) => {
          const version = aggregateVersion + 1 + idx
          const eventToPersist = {
            aggregate: { ...aggregate },
            correlationId,
            id: getNewId(),
            name,
            serializedPayload: payload,
            version,
          }
          events.push(eventToPersist)
          persistedEvents.push(eventToPersist)
        })
      })
      // tslint:enable

      return Promise.resolve(persistedEvents)
    },
    getEventsOfAggregate: (aggregate, fromVersion) => {
      return Promise.resolve(
        getAggregateEvents(aggregate).filter(
          event => event.version > fromVersion
        )
      )
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

const getNewId = (): string => pad0(uniqueId(), 20)

const pad0 = (i: string, n: number): string =>
  i.length >= n
    ? i
    : range(n - i.length)
        .map(() => '0')
        .join('') + i
