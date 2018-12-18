import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorType,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventType,
  DomainEventTypePayload,
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
 * An aggregate snapshot representation
 */
export interface AggregateSnapshot {
  /**
   * The serialized internal state of an aggregate
   */
  readonly serializedState: string

  /**
   * The version number of the aggregate that was
   * snapshotted
   */
  readonly version: number
}

/**
 * When an aggregate emits new events it can
 * also specify the consistency policy to observe
 * when the the repository attempts to persist them.
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
 *      We have no expectations regarding consistency *
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
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorType,
    EventType,
    ErrorType['name'],
    EventType['name']
  >
> {
  /**
   * The name of the Bounded Context
   * the aggregate belongs to
   * @see BoundedContext
   */
  readonly context: BC

  /**
   * The aggregate type
   * @see AggregateType
   */
  readonly type: TypeName

  /**
   * The identity of the aggregate
   * @see AggregateIdentity
   */
  readonly identity: Identity

  /**
   * The current version of the aggregate.
   * It is calculated when the aggregate state is
   * rebuilt and **does not change during the instance lifecycle**.
   */
  readonly version: number

  /**
   * Flag to signal if the instance should be
   * snapshotted
   */
  readonly needsSnapshot: boolean

  /**
   * The snapshot key
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
   * The behaviours interface of the aggregate
   */
  readonly execute: AggregateCommandInterface<
    State,
    Query,
    ErrorType,
    EventType,
    Command,
    AggregateCommandDictionary<State, Query, ErrorType, EventType, Command>
  >

  /**
   * Generates a new instance obtained
   * adding new events to the aggregate's history
   */
  readonly appendEvents: (
    events: ReadonlyArray<
      DomainEventInstance<
        EventType['name'],
        DomainEventTypePayload<EventType>,
        State
      >
    >
  ) => AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorType,
    EventType,
    Command
  >

  /**
   * Returns another instance of the same aggregate
   * with state and version as they where before any command
   * was executed
   */
  readonly clone: () => AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorType,
    EventType,
    Command
  >

  /**
   * A reference to the function which generated the instance
   */
  readonly New: AggregateTypeFactory<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorType,
    EventType,
    Command
  >

  /**
   * Reveals if the instance emitted new event
   * since when it was created
   */
  readonly isDirty: () => boolean

  /**
   * Returns the list of events emitted by the instance
   * since when it was created
   */
  readonly getNewEvents: () => ReadonlyArray<
    DomainEventInstance<DomainEventName, DomaiEventPayload, State>
  >

  /**
   * @see ConsistencyPolicy
   */
  readonly getConsistencyPolicy: () => ConsistencyPolicy

  /**
   * Returns the serialized internal aggregate'state
   */
  readonly getSerializedState: () => string

  /**
   * Returns a snapshot of the internal state of the aggregate
   * paired with its current version.
   * Should be used just by the repository (after having rebuilt an instance)
   * or for testing purposes
   */
  readonly getSnapshot: () => AggregateSnapshot
}

/**
 * An aggregate definition to pass to the @see Aggregate
 * factory function
 */
export interface AggregateDefinition<
  BC extends BoundedContext,
  Type extends AggregateTypeName,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  Event extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorType,
    Event,
    ErrorType['name'],
    Event['name']
  >
> {
  /**
   * A string representing a @see BoundedContext
   */
  readonly context: BC

  /**
   * The @see AggregateType
   */
  readonly type: Type

  /**
   * A description of the aggregate.
   */
  readonly description?: string

  /**
   * A flag to specify if this aggregate is supposed
   * to be a "singleton" in your domain model
   */
  readonly singleton?: boolean

  /**
   * The initial state of the aggregate
   * @see AggregateState
   */
  readonly initialState: State

  /**
   * The collection of commands that implement
   * the business logic of the aggregate
   */
  readonly commands: ReadonlyArray<Command>

  /**
   * A collection of queries.
   * The collection is converted into a dictionary of
   * queries that will be passed to the aggregate commands at runtime.
   */
  readonly queries: ReadonlyArray<Query>

  /**
   * The collection of errors that can be raised
   * inside the commands implementations.
   * The collection is converted into a dictionary of
   * error constructors that will be passed to the aggregate commands at runtime.
   */
  readonly errors: ReadonlyArray<ErrorType>

  /**
   * The collection of events.
   * The collection is converted into a dictionary of
   * _"event emitters"_ that will be passed to the aggregate commands at runtime.
   */
  readonly events: ReadonlyArray<Event>

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
 * Returns an aggregate instance
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
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorType,
    EventType,
    ErrorType['name'],
    EventType['name']
  >
> {
  (
    identity?: Identity,
    snapshot?: AggregateSnapshot,
    events?: ReadonlyArray<SerializedDomainEvent<EventType['name']>>
  ): AggregateInstance<
    BC,
    TypeName,
    Identity,
    State,
    Query,
    ErrorType,
    EventType,
    Command
  >

  /**
   * @see BoundedContext
   */
  readonly context: BC

  /**
   * @see AggregateType
   */
  readonly type: TypeName

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
