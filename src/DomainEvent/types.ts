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
 * An instance of a domain event
 */
export interface DomainEventInstance<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  readonly name: Name
  readonly data: Payload
  readonly getSerializedPayload: () => string
  readonly applyToState: (state: State) => State
}

/**
 * The domain event definition type
 */
export interface DomainEventDefinition<
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

export type FromSerializedPayloadConstructor<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> = (serializedData: string) => DomainEventInstance<Name, Payload, State>

/**
 * A domain event constructor
 */
export interface DomainEventConstructor<
  Name extends DomainEventName,
  Payload extends DomaiEventPayload,
  State extends AggregateState
> {
  (payload: Payload, skipValidation?: boolean): DomainEventInstance<
    Name,
    Payload,
    State
  >
  // tslint:disable readonly-keyword
  name: Name
  description: string
  fromSerializedPayload: FromSerializedPayloadConstructor<Name, Payload, State>
  // tslint:enable
}
