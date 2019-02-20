import { AggregateState } from '../Aggregate/types'
import { Deserializer } from '../utils/getDeserializer'
import { Serializer } from '../utils/getSerializer'

/**
 * The name of a domain event
 */
export type DomainEventName = string

/**
 * A domain event payload
 */
export type DomaiEventPayload = any

/**
 * An object representing a domain event with a serialized payload
 */
export interface SerializedDomainEvent {
  /**
   * The name of the event
   */
  readonly name: DomainEventName

  /**
   * The serialized payload of the event
   */
  readonly payload: string
}

/**
 * An instance of a domain event
 */
export interface DomainEventInstance<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  /**
   * The name of the event
   */
  readonly name: Name

  /**
   * The payload of the event
   */
  readonly payload: Payload

  /**
   * A method to get the serialized version of the event payload
   */
  readonly getSerializedPayload: () => string

  /**
   * A method to apply the event reducer function to
   * an aggregate internal state in order to obtain
   * a new state
   *
   * @param state An object representing the aggregate's internal state
   * @returns An object representing the aggregate's new internal state
   */
  readonly applyToState: (state: Readonly<State>) => Readonly<State>
}

/**
 * An object describing a domain event type
 */
export interface DomainEventTypeDefinition<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  /**
   * The name of the event
   */
  readonly name: Name

  /**
   * An optional description of the event
   */
  readonly description?: string

  /**
   * A pure function to get the serialized version
   * of the event payload. Defaults to JSON.stringify
   */
  readonly serializePayload?: Serializer<Payload>

  /**
   * A pure function to deserialize the event payload.
   * Defaults to JSON.parse
   */
  readonly deserializePayload?: Deserializer<Payload>

  /**
   * A pure function to obtain a new aggregate state given
   * the actual aggregate state and the event payload
   */
  readonly reducer: (
    state: Readonly<State>,
    payload: Readonly<Payload>
  ) => Readonly<State>
}

/**
 * A factory to get an instance of a domain event from
 * the serialized version of its payload
 * @param serializePayload The serialized version of the domain event's payload
 * @return An instance of the domain event
 */
export type DomainEventTypeFactoryFromSerializedPayload<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> = (serializedPayload: string) => DomainEventInstance<Name, Payload, State>

/**
 * The payload type inferred
 * from a DomainEventTypeFactory signature
 */
export type DomainEventTypeFactoryPayload<
  EventTypeFactory
> = EventTypeFactory extends (
  payload: infer Payload
) => DomainEventInstance<DomainEventName, DomaiEventPayload, AggregateState>
  ? Readonly<Payload>
  : never

/**
 * A factory to get an instance of a domain event from its payload
 * @param payload The domain event's payload
 * @return An instance of the domain event
 */
export interface DomainEventTypeFactory<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  (payload: Readonly<Payload>): DomainEventInstance<Name, Payload, State>
  /**
   * The name of the domain event
   */
  readonly name: Name

  /**
   * The description of the domain event
   */
  readonly description: string

  /**
   * A method to get a domain event instance from its serialized
   * payload
   */
  readonly fromSerializedPayload: DomainEventTypeFactoryFromSerializedPayload<
    Name,
    Payload,
    State
  >
}
