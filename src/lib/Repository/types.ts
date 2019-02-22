// tslint:disable no-submodule-imports
import { Either } from 'fp-ts/lib/Either'

import {
  AggregateCommandDefinition,
  AggregateCommandInput,
  AggregateCommandName,
} from '../Aggregate/commands.types'
import {
  AggregateQueryDefinition,
  AggregateQueryInput,
  AggregateQueryName,
  AggregateQueryOutput,
} from '../Aggregate/queries.types'
import {
  AggregateIdentity,
  AggregateSnapshot,
  AggregateState,
  AggregateTypeFactory,
  AggregateTypeName,
  BoundedContext,
} from '../Aggregate/types'
import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventName,
  DomainEventTypeFactory,
  SerializedDomainEvent,
} from '../DomainEvent/types'

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

export interface EventStore<
  ReadError extends Error = Error,
  WriteError extends Error = Error
> {
  readonly getEventsOfAggregate: (
    aggregate: AggregateIdentifier,
    fromVersion: number
  ) => Promise<EventStoreReadResult<ReadError>>

  readonly appendEventsToAggregates: (
    insertions: ReadonlyArray<EventStoreInsertion>,
    correlationId: string
  ) => Promise<EventStoreWriteResult<WriteError>>
}

export type EventStoreReadResult<ReadError extends Error = Error> = Either<
  ReadError,
  SerializedEventsList
>

export type EventStoreWriteResult<WriteError extends Error = Error> = Either<
  WriteError,
  SerializedEventsList
>

export type SerializedEventsList = ReadonlyArray<SerializedDomainEvent>

export interface SnapshotService<
  ReadError extends Error = Error,
  WriteError extends Error = Error
> {
  readonly loadAggregateSnapshot: (
    key: string
  ) => Promise<SnapshotServiceReadResult<ReadError>>

  readonly saveAggregateSnapshot: (
    key: string,
    snapshot: AggregateSnapshot
  ) => Promise<SnapshotServiceWriteResult<WriteError>>
}

export type SnapshotServiceReadResult<ReadError extends Error = Error> = Either<
  ReadError,
  AggregateSnapshot | undefined
>

export type SnapshotServiceWriteResult<
  WriteError extends Error = Error
> = Either<WriteError, void>

export interface RepositoryDefinition<
  EventsReadError extends Error = Error,
  EventsWriteError extends Error = Error,
  SnapshotReadError extends Error = Error,
  SnapshotWriteError extends Error = Error,
  LoadCanFailBecauseOfSnapshotService extends boolean = boolean
> {
  readonly eventStore: EventStore<EventsReadError, EventsWriteError>
  readonly snapshotService?: SnapshotService<
    SnapshotReadError,
    SnapshotWriteError
  >
  readonly loadCanFailBecauseOfSnaphotService?: LoadCanFailBecauseOfSnapshotService
}

export type RepositoryDefinitionReadError<D extends RepositoryDefinition> =
  | RepositoryDefinitionEventsReadError<D>
  | RepositoryDefinitionSnaphotReadError<D>

export type RepositoryDefinitionWriteError<
  D extends RepositoryDefinition
> = RepositoryDefinitionEventsWriteError<D>

export type RepositoryDefinitionEventsReadError<
  D
> = D extends RepositoryDefinition<infer EventsReadError>
  ? EventsReadError
  : never
export type RepositoryDefinitionEventsWriteError<
  D
> = D extends RepositoryDefinition<any, infer EventsWriteError>
  ? EventsWriteError
  : never
export type RepositoryDefinitionSnaphotReadError<
  D
> = D extends RepositoryDefinition<any, any, infer SnaphotReadError>
  ? SnaphotReadError
  : never

export type GenericAggregateInstance = ReturnType<
  AggregateTypeFactory<
    BoundedContext,
    AggregateTypeName,
    boolean,
    AggregateState,
    AggregateQueryDefinition<
      AggregateQueryName,
      AggregateState,
      AggregateQueryInput,
      AggregateQueryOutput
    >,
    CustomErrorTypeFactory<CustomErrorName, CustomErrorData>,
    DomainEventTypeFactory<DomainEventName, DomaiEventPayload, AggregateState>,
    AggregateCommandDefinition<
      AggregateCommandName,
      AggregateCommandInput,
      AggregateState,
      AggregateQueryDefinition<
        AggregateQueryName,
        AggregateState,
        AggregateQueryInput,
        AggregateQueryOutput
      >,
      CustomErrorTypeFactory<CustomErrorName, CustomErrorData>,
      DomainEventTypeFactory<
        DomainEventName,
        DomaiEventPayload,
        AggregateState
      >,
      CustomErrorTypeFactory<CustomErrorName, CustomErrorData>['name'],
      DomainEventTypeFactory<
        DomainEventName,
        DomaiEventPayload,
        AggregateState
      >['name']
    >
  >
>

export interface RepositoryInstance<
  Aggregate extends GenericAggregateInstance = GenericAggregateInstance,
  ReadError extends Error = Error,
  WriteError extends Error = Error
> {
  readonly load: <Aggregates extends ReadonlyArray<Aggregate>>(
    aggregates: Aggregates
  ) => Promise<RepositoryInstanceLoadResult<Aggregates, ReadError>>

  readonly persist: <Aggregates extends ReadonlyArray<Aggregate>>(
    aggregates: Aggregates,
    correlationId?: string
  ) => Promise<RepositoryInstancePersistResult<Aggregates, WriteError>>
}

export type RepositoryInstanceLoadResult<
  Aggregates,
  ReadError extends Error = Error
> = Either<ReadError, Aggregates>

export type RepositoryInstancePersistResult<
  Aggregates,
  WriteError extends Error = Error
> = Either<
  WriteError,
  {
    readonly aggregates?: Aggregates
    readonly persistedEvents: ReadonlyArray<PersistedDomainEvent>
  }
>
