import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventType,
} from '../DomainEvent/types'
import {
  AggregateEmissionInterface,
  AggregateEventDictionary,
} from './events.types'
import { AggregateState, ConsistencyPolicy } from './types'

export interface EmissionInterfaceConfiguration<
  State extends AggregateState,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>
> {
  readonly emittableEvents: ReadonlyArray<EventType>
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
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  EventDictionary extends AggregateEventDictionary<State, EventType>
>(
  config: EmissionInterfaceConfiguration<State, EventType>
): AggregateEmissionInterface<State, EventType, EventDictionary> {
  const { emittableEvents, onNewEvent } = config

  return emittableEvents.reduce((emissionInterface, EvType) => {
    return Object.defineProperty(emissionInterface, EvType.name, {
      enumerable: true,
      value: Object.defineProperty(
        (input?: any, consistencyPolicy?: ConsistencyPolicy) =>
          onNewEvent(EvType(input), consistencyPolicy || 0),
        'name',
        { value: EvType.name }
      ),
    })
  }, {}) as AggregateEmissionInterface<State, EventType, EventDictionary>
}
