// tslint:disable no-submodule-imports
import { Either } from 'fp-ts/lib/Either'

import {
  AggregateIdentity,
  AggregateSnapshot,
  AggregateTypeName,
  BoundedContext,
} from '../Aggregate/types'

import { SerializedDomainEvent } from '../DomainEvent/types'

export interface AggregateIdentifier {
  readonly context: BoundedContext
  readonly type: AggregateTypeName
  readonly identity: AggregateIdentity
}

export interface PersistedDomainEvent extends SerializedDomainEvent {
  readonly aggregate: AggregateIdentifier
  readonly id: string
  readonly correlationId: string
}

export interface EventStoreInsertion {
  readonly aggregate: AggregateIdentifier
  readonly expectedAggregateVersion: number
  readonly eventsToAppend: ReadonlyArray<SerializedDomainEvent>
}

export interface UnknownError extends Error {
  readonly type: 'UNKNOWN'
}
export interface AvailabilityError extends Error {
  readonly type: 'AVAILABILITY'
}
export interface ConcurrencyError extends Error {
  readonly type: 'CONCURRENCY'
}

export interface EventStore {
  readonly getEventsOfAggregate: (
    aggregate: AggregateIdentifier,
    fromVersion: number
  ) => Promise<EventStoreGetResult>

  readonly appendEventsToAggregates: (
    insertions: ReadonlyArray<EventStoreInsertion>,
    correlationId: string
  ) => Promise<EventStoreAppendResult>
}

export type EventStoreGetResult = Either<
  AvailabilityError | UnknownError,
  SerializedEventsList
>

export type EventStoreAppendResult = Either<
  AvailabilityError | ConcurrencyError | UnknownError,
  SerializedEventsList
>

export type SerializedEventsList = ReadonlyArray<SerializedDomainEvent>

export interface SnapshotService {
  readonly loadAggregateSnapshot: (
    key: string
  ) => Promise<SnapshotServiceLoadResult>

  readonly saveAggregateSnapshot: (
    key: string,
    snapshot: AggregateSnapshot
  ) => Promise<SnapshotServiceSaveResult>
}

export type SnapshotServiceLoadResult = Either<
  AvailabilityError | UnknownError,
  AggregateSnapshot | undefined
>

export type SnapshotServiceSaveResult = Either<
  AvailabilityError | UnknownError,
  void
>

export interface RepositoryDefinition {
  readonly eventStore: EventStore
  readonly snapshotService?: SnapshotService
  readonly loadCanFailBecauseOfSnaphotService?: boolean
}

export interface RepositoryInstance<T> {
  readonly load: <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates
  ) => Promise<RepositoryInstanceLoadResult<Aggregates>>

  readonly persist: <Aggregates extends ReadonlyArray<T>>(
    aggregates: Aggregates,
    correlationId?: string
  ) => Promise<RepositoryInstancePersistResult<Aggregates>>
}

export type RepositoryInstanceLoadResult<Aggregates> = Either<
  AvailabilityError | UnknownError,
  Aggregates
>

export type RepositoryInstancePersistResult<Aggregates> = Either<
  AvailabilityError | ConcurrencyError | UnknownError,
  {
    readonly aggregates?: Aggregates
    readonly persistedEvents: ReadonlyArray<PersistedDomainEvent>
  }
>
