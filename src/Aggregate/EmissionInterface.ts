import {
  DomaiEventPayload,
  DomainEventConstructor,
  DomainEventInstance,
  DomainEventName,
} from '../DomainEvent/types'
import {
  AggregateEmissionInterface,
  AggregateEventDictionary,
} from './events.types'
import { AggregateState, ConsistencyPolicy } from './types'

export interface EmissionInterfaceConfiguration<
  State extends AggregateState,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >
> {
  readonly emittableEvents: ReadonlyArray<Event>
  readonly onNewEvent: (
    event: DomainEventInstance<DomainEventName, DomaiEventPayload, State>,
    consistencyPolicy: ConsistencyPolicy
  ) => void
}

/**
 * The constructor of an aggregate full `emit` interface
 * @param config @see EmissionInterfaceConfiguration
 */
export default function EmissionInterface<
  State extends AggregateState,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, Event>
>(
  config: EmissionInterfaceConfiguration<State, Event>
): AggregateEmissionInterface<State, Event, EventDictionary> {
  const { emittableEvents, onNewEvent } = config

  return emittableEvents.reduce((emissionInterface, Evt) => {
    return Object.defineProperty(emissionInterface, Evt.name, {
      enumerable: true,
      value: Object.defineProperty(
        (input?: any, consistencyPolicy?: ConsistencyPolicy) =>
          onNewEvent(Evt(input), consistencyPolicy || 0),
        'name',
        { value: Evt.name }
      ),
    })
  }, {})
}
