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
 * An object representing a domain event,
 * where the `serializedPayload` property is a serialized version
 * of the payload
 */
export interface SerializedDomainEvent {
  readonly name: DomainEventName
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
  readonly name: Name
  readonly payload: Payload
  readonly getSerializedPayload: () => string
  readonly applyToState: (state: State) => State
}

/**
 * The domain event definition type
 */
export interface DomainEventTypeDefinition<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  readonly name: Name
  readonly description?: string
  readonly serializePayload?: Serializer<Payload>
  readonly deserializePayload?: Deserializer<Payload>
  readonly reducer: (
    state: State,
    event: DomainEventInstance<Name, Payload, State>
  ) => State
}

export type DomainEventInstanceFromSerializedPayloadFactory<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> = (serializedData: string) => DomainEventInstance<Name, Payload, State>

/**
 * The payload type inferred
 * from a DomainEventType signature
 */
export type DomainEventTypePayload<EventType> = EventType extends (
  payload: infer Payload
) => DomainEventInstance<DomainEventName, DomaiEventPayload, AggregateState>
  ? Payload
  : never

/**
 * A domain event constructor
 */
export interface DomainEventType<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  (payload: Payload): DomainEventInstance<Name, Payload, State>
  readonly name: Name
  readonly description: string
  readonly fromSerializedPayload: DomainEventInstanceFromSerializedPayloadFactory<
    Name,
    Payload,
    State
  >
}
