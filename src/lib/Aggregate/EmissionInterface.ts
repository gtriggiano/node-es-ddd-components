import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventTypeFactory,
} from '../DomainEvent/types'
import {
  AggregateEmissionInterface,
  AggregateEventDictionary,
} from './events.types'
import { AggregateState, ConsistencyPolicy } from './types'

export interface EmissionInterfaceConfiguration<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> {
  readonly emittableEvents: ReadonlyArray<EventTypeFactory>
  readonly onNewEvent: (
    event: DomainEventInstance<DomainEventName, DomaiEventPayload, State>,
    consistencyPolicy: ConsistencyPolicy
  ) => void
}

export default function EmissionInterface<
  State extends AggregateState,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, EventTypeFactory>
>(
  config: EmissionInterfaceConfiguration<State, EventTypeFactory>
): AggregateEmissionInterface<State, EventTypeFactory, EventDictionary> {
  const { emittableEvents, onNewEvent } = config

  return emittableEvents.reduce<
    AggregateEmissionInterface<State, EventTypeFactory, EventDictionary>
  >((emissionInterface, EventType) => {
    return Object.defineProperty(emissionInterface, EventType.name, {
      enumerable: true,
      value: Object.defineProperty(
        (input?: any, consistencyPolicy?: ConsistencyPolicy) =>
          onNewEvent(EventType(input), consistencyPolicy || 0),
        'name',
        { value: EventType.name }
      ),
    })
  }, Object.create(null))
}
