import {
  AggregateIdentity,
  AggregateSnapshot,
  AggregateTypeName,
  BoundedContext,
  GenericAggregateInstance,
} from '../Aggregate/types'

import { SerializedDomainEvent } from '../DomainEvent/types'

export interface AggregateIdentifier {
  readonly context: BoundedContext
  readonly type: AggregateTypeName
  readonly identity: AggregateIdentity
}

export type PersistedDomainEvent = SerializedDomainEvent & {
  readonly aggregate: AggregateIdentifier
  readonly id: string
  readonly correlationId: string
}

export interface EventStoreInsertion {
  readonly aggregate: AggregateIdentifier
  readonly expectedAggregateVersion: number
  readonly eventsToAppend: ReadonlyArray<SerializedDomainEvent>
}

export interface EventStore {
  readonly getEventsOfAggregate: (
    aggregate: AggregateIdentifier,
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
  readonly loadCanFailBecauseOfSnaphotService?: boolean
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
    readonly aggregates?: AggregatesCollection
    readonly persistedEvents: ReadonlyArray<PersistedDomainEvent>
  }>
}
