import {
  DomaiEventPayload,
  DomainEventName,
  DomainEventTypeFactory,
} from '../DomainEvent/types'
import { AggregateState, MapDiscriminatedUnion } from './types'

export type DomainEventPayloadType<
  EventTypeFactory
> = EventTypeFactory extends (payload: infer Payload) => any ? Payload : never

export type AggregateEmissionInterfaceMethod<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> = (input: DomainEventPayloadType<EventTypeFactory>) => void

export type AggregateEventDictionary<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> = MapDiscriminatedUnion<EventTypeFactory, 'name'>

export type AggregateEmissionInterface<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, EventTypeFactory>
> = {
  readonly [K in keyof EventDictionary]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}

export type AggregateCommandEmissionInterface<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, EventTypeFactory>,
  EmittableEvent extends keyof EventDictionary
> = {
  readonly [K in EmittableEvent]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}
