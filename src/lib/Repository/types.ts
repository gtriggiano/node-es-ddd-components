import {
  AggregateIdentity,
  AggregateSnapshot,
  AggregateTypeName,
  BoundedContext,
  GenericAggregateInstance,
} from '../Aggregate/types'

import {
  PersistedDomainEvent,
  SerializedDomainEvent,
} from '../DomainEvent/types'

export interface EventStoreInsertion {
  readonly aggregate: {
    readonly context: BoundedContext
    readonly type: AggregateTypeName
    readonly identity: AggregateIdentity
  }
  readonly expectedAggregateVersion: number
  readonly eventsToAppend: ReadonlyArray<{
    readonly name: string
    readonly payload: string
  }>
}

export interface EventStore {
  readonly getEventsOfAggregate: (
    aggregate: {
      readonly context: BoundedContext
      readonly type: AggregateTypeName
      readonly identity: AggregateIdentity
    },
    fromVersion: number
  ) => Promise<ReadonlyArray<SerializedDomainEvent>>

  readonly appendEventsToAggregates: (
    insertions: ReadonlyArray<EventStoreInsertion>,
    correlationId: string
  ) => Promise<ReadonlyArray<PersistedDomainEvent>>
}

export interface SnapshotService {
  readonly loadAggregateSnapshot: (
    key: string
  ) => Promise<AggregateSnapshot | undefined>

  readonly saveAggregateSnapshot: (
    key: string,
    snapshot: AggregateSnapshot
  ) => Promise<void>
}

export interface RepositoryDefinition {
  readonly eventStore: EventStore
  readonly snapshotService?: SnapshotService
}

export interface RepositoryInstance<
  AggregatesCollection extends ReadonlyArray<GenericAggregateInstance>
> {
  readonly load: (
    aggregates: AggregatesCollection
  ) => Promise<AggregatesCollection>

  readonly persist: (
    aggregates: AggregatesCollection,
    correlationId?: string
  ) => Promise<{
    readonly aggregates: AggregatesCollection
    readonly persistedEvents: ReadonlyArray<PersistedDomainEvent>
  }>
}
