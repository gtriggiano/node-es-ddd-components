import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventTypeFactory,
  SerializedDomainEvent,
} from '../DomainEvent/types'
import { Deserializer } from '../utils/getDeserializer'
import { Serializer } from '../utils/getSerializer'
import {
  AggregateCommandDefinition,
  AggregateCommandDictionary,
  AggregateCommandInput,
  AggregateCommandInterface,
  AggregateCommandName,
} from './commands.types'
import {
  AggregateQueryDefinition,
  AggregateQueryDictionary,
  AggregateQueryInput,
  AggregateQueryInterface,
  AggregateQueryName,
  AggregateQueryOutput,
} from './queries.types'

/**
 * The name of the Bounded Context where the domain model lives
 */
export type BoundedContext = string

/**
 * The name of an aggregate type
 */
export type AggregateTypeName = string

/**
 * The identity of an aggregate
 */
export type AggregateIdentity = string | undefined

/**
 * The internal state of an aggregate
 */
export type AggregateState = object

/**
 * An object representing the snapshot
 * of an aggregate's internal state
 */
export interface AggregateSnapshot {
  /**
   * The serialized version of the aggregate's internal state
   */
  readonly serializedState: string

  /**
   * The aggregate's version at the time thesnapshot was created
   */
  readonly version: number
}

/**
 * When an aggregate's command implementation
 * emits an event, it can specify the consistency policy to observe
 * if the aggregate gets passed to the repository in order to persist
 * the new events.
 *
 * The meaning of the possible values are:
 *
 *  `0`: Strict consistency policy.
 *      We expect that the version of the persisted aggeggregate
 *      matches the version of the aggregate passed to the repository
 *
 *  `1`: Soft consisteny policy.
 *      We expect that the aggregate just exists into the
 *      persistence layer.
 *
 *  `2`: No consistency policy.
 *      We have no expectations regarding consistency
 */
export type ConsistencyPolicy = 0 | 1 | 2

/**
 * An instance of an aggregate
 */
export interface AggregateInstance<
  BC extends BoundedContext,
  TypeName extends AggregateTypeName,
  Identity extends AggregateIdentity,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    ErrorTypeFactory['name'],
    EventTypeFactory['name']
  >
> {
  /**
   * The name of the Bounded Context the aggregate belongs to
   */
  readonly context: BC

  /**
   * The name of the aggregate type
   */
  readonly type: TypeName

  /**
   * The identity of the aggregate
   */
  readonly identity: Identity

  /**
   * The current version of the aggregate.
   * It is calculated when the aggregate state is
   * rebuilt and **does not change during the instance lifecycle**.
   */
  readonly version: number

  /**
   * Flag to signal if the instance should be snapshotted
   */
  readonly needsSnapshot: boolean

  /**
   * The snapshot key to use for snapshot
   * persistence and retrieval
   */
  readonly snapshotKey: string

  /**
   * The query interface of the aggregate
   */
  readonly query: AggregateQueryInterface<
    State,
    Query,
    AggregateQueryDictionary<State, Query>
  >

  /**
   * The commands interface of the aggregate
   */
  readonly execute: AggregateCommandInterface<
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command,
    AggregateCommandDictionary<
      State,
      Query,
      ErrorTypeFactory,
      EventTypeFactory,
      Command
    >
  >

  /**
   * A method to generate a new instance by
   * adding new events to the aggregate's history
   */
  readonly appendEvents: (
    events: ReadonlyArray<SerializedDomainEvent>
  ) => AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >

  /**
   * A method to get another instance of the same aggregate
   * with state and version as they where before any command
   * was executed
   */
  readonly clone: () => AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >

  /**
   * A reference to the factory which generated the instance
   */
  readonly New: AggregateTypeFactory<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >

  /**
   * A method to reveal if the instance produced new events
   * during its lifecycle
   */
  readonly isDirty: () => boolean

  /**
   * A method to get the list of events emitted by the instance
   * during its lifecycle
   */
  readonly getNewEvents: () => ReadonlyArray<
    DomainEventInstance<DomainEventName, DomaiEventPayload, State>
  >

  /**
   * A method to get the consistency policy that the repository
   * should observe when attempting to persist the aggregate
   */
  readonly getConsistencyPolicy: () => ConsistencyPolicy

  /**
   * A method to get the serialized version of the aggregate's internal state
   */
  readonly getSerializedState: () => string

  /**
   * A method to get a snapshot of the aggregate's internal state
   * paired with its current version.
   */
  readonly getSnapshot: () => AggregateSnapshot
}

/**
 * A generic instance of an aggregate
 */
export type GenericAggregateInstance = AggregateInstance<
  BoundedContext,
  AggregateTypeName,
  AggregateIdentity,
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
    DomainEventTypeFactory<DomainEventName, DomaiEventPayload, AggregateState>,
    CustomErrorName,
    DomainEventName
  >
>

/**
 * An object describing an aggregate type
 */
export interface AggregateDefinition<
  BC extends BoundedContext,
  TypeName extends AggregateTypeName,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    ErrorTypeFactory['name'],
    EventTypeFactory['name']
  >
> {
  /**
   * The name of the Bounded Context the aggregate belongs to
   */
  readonly context: BC

  /**
   * The name of the aggregate's type
   */
  readonly type: TypeName

  /**
   * An optional description of the aggregate.
   */
  readonly description?: string

  /**
   * A flag to specify if this aggregate is supposed
   * to be a "singleton" in your domain model
   */
  readonly singleton?: boolean

  /**
   * The initial state of the aggregate
   */
  readonly initialState: State

  /**
   * A list of commands that implement the business logic of the aggregate.
   * The list will be tranformed into the aggregate's
   * `.execute` interface
   */
  readonly commands: ReadonlyArray<Command>

  /**
   * A list of queries, whose hanlers will have access to the
   * aggregate's internal state.
   * The list will be transormed into the aggregate's
   * `.query` interface
   */
  readonly queries: ReadonlyArray<Query>

  /**
   * A list of factories that can be used to
   * generate the errors that could be raised
   * by the commands implementations.
   * The list will be used to craft the `.error` interface that
   * will be passed to each command implementation.
   */
  readonly errors: ReadonlyArray<ErrorTypeFactory>

  /**
   * A list of domain event factories.
   * The list will be used to craft the `.emit` interface that
   * will be passed to each command implementation
   */
  readonly events: ReadonlyArray<EventTypeFactory>

  /**
   * A prefix to use to generate the
   * key representing an aggregate snapshot.
   */
  readonly snapshotPrefix?: string

  /**
   * Threshold to tweak the snapshot frequency
   */
  readonly snapshotThreshold?: number

  /**
   * A function to serialize the internal state
   * of the aggregate.
   * Defaults to `JSON.stringify`.
   */
  readonly serializeState?: Serializer<State>

  /**
   * A function to deserialize the internal state
   * of the aggregate.
   * Defaults to `JSON.parse`.
   */
  readonly deserializeState?: Deserializer<State>
}

/**
 * An aggregate type factory
 * @param identity The identity of the aggregate
 * @param snapshot A snapshot of the aggregate
 * @param events A list of serialized domain events representing the history of the aggregate
 * @returns An instance of the aggregate type
 */
export interface AggregateTypeFactory<
  BC extends BoundedContext,
  TypeName extends AggregateTypeName,
  Identity extends AggregateIdentity,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  EventType extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventType,
    ErrorTypeFactory['name'],
    EventType['name']
  >
> {
  (
    identity?: Identity,
    snapshot?: Readonly<AggregateSnapshot>,
    events?: ReadonlyArray<SerializedDomainEvent>
  ): AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorTypeFactory,
    EventType,
    Command
  >

  /**
   * The name of the Bounded Context the aggregate belongs to
   */
  readonly context: BC

  /**
   * The name of the aggregate's type
   */
  readonly type: TypeName

  /**
   * Tells if aggregate type is a singleton
   */
  readonly singleton: boolean

  /**
   * A description of the aggregate.
   */
  readonly description: string
}

export type DiscriminatedUnion<
  T,
  K extends keyof T,
  V extends T[K]
> = T extends Record<K, V> ? T : never

export type MapDiscriminatedUnion<
  T extends Record<K, string>,
  K extends keyof T
> = { [V in T[K]]: DiscriminatedUnion<T, K, V> }
