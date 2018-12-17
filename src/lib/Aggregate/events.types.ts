import {
  DomaiEventPayload,
  DomainEventName,
  DomainEventType,
} from '../DomainEvent/types'
import { AggregateState, MapDiscriminatedUnion } from './types'

export type DomainEventPayloadType<
  EventConstructor
> = EventConstructor extends (
  payload: infer Payload,
  skipValidation?: boolean
) => any
  ? Payload
  : never

export type AggregateEmissionInterfaceMethod<
  State extends AggregateState,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>
> = (input: DomainEventPayloadType<EventType>) => void

export type AggregateEventDictionary<
  State extends AggregateState,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>
> = MapDiscriminatedUnion<EventType, 'name'>

export type AggregateEmissionInterface<
  State extends AggregateState,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  EventDictionary extends AggregateEventDictionary<State, EventType>
> = {
  readonly [K in keyof EventDictionary]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}

export type AggregateCommandEmissionInterface<
  State extends AggregateState,
  Event extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  EventDictionary extends AggregateEventDictionary<State, Event>,
  EmittableEvent extends keyof EventDictionary
> = {
  readonly [K in EmittableEvent]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}
