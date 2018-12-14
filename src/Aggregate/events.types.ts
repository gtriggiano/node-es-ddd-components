import {
  DomaiEventPayload,
  DomainEventConstructor,
  DomainEventName,
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
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> = (input: DomainEventPayloadType<Event>) => void

export type AggregateEventDictionary<
  State extends AggregateState,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> = MapDiscriminatedUnion<Event, 'name'>

export type AggregateEmissionInterface<
  State extends AggregateState,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, Event>
> = {
  readonly [K in keyof EventDictionary]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}

export type AggregateCommandEmissionInterface<
  State extends AggregateState,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, Event>,
  EmittableEvent extends keyof EventDictionary
> = {
  readonly [K in EmittableEvent]: AggregateEmissionInterfaceMethod<
    State,
    EventDictionary[K]
  >
}
