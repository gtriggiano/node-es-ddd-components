import { AggregateState } from '../Aggregate/types'
import { CustomError } from '../CustomError'
import { getDeserializer, getSerializer } from '../utils'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventType,
  DomainEventTypeDefinition,
} from './types'
import validateDefinition from './validateDefinition'

export const BadDomainEventDefinition = CustomError<
  'DomainEventDefinitionError',
  { readonly originalError: Error }
>({
  name: 'DomainEventDefinitionError',
})

export function DomainEvent<
  Name extends DomainEventName,
  State extends AggregateState,
  Payload extends DomaiEventPayload
>(
  definition: DomainEventTypeDefinition<Name, Payload, State>
): DomainEventType<Name, Payload, State> {
  try {
    // tslint:disable no-expression-statement
    validateDefinition(definition)
    // tslint:enable
  } catch (e) {
    throw BadDomainEventDefinition(e.message, { originalError: e })
  }

  const {
    name,
    description,
    reducer,
    serializePayload: providedSerializer,
    deserializePayload: providedDeserializer,
  } = definition

  const serializePayload = getSerializer<Payload>(providedSerializer)
  const deserializePayload = getDeserializer<Payload>(providedDeserializer)

  const getInstanceFromPayload = (payload: Payload) => {
    const event = {}
    // tslint:disable no-let
    let serializedPayload = ''
    // tslint:enable
    return Object.defineProperties(event, {
      __factory: { value: EventType },
      applyToState: {
        value: (state: State) =>
          reducer(state, event as DomainEventInstance<Name, Payload, State>),
      },
      data: { enumerable: true, value: payload },
      getSerializedPayload: {
        value: () =>
          serializedPayload ||
          (() => {
            // tslint:disable no-expression-statement
            serializedPayload = serializePayload(payload)
            // tslint:enable
            return serializedPayload
          })(),
      },
      name: { enumerable: true, value: name },
    })
  }

  const getInstanceFromPayloadValidated = getInstanceFromPayload

  const EventType = Object.defineProperties(
    (payload: Payload, skipValidation?: boolean) =>
      skipValidation
        ? getInstanceFromPayload(payload)
        : getInstanceFromPayloadValidated(payload),
    {
      __factory: { value: DomainEvent },
      description: { value: description || '' },
      fromSerializedPayload: {
        value: (serializedPayload: string) =>
          EventType(deserializePayload(serializedPayload), true),
      },
      name: { value: name },
      [Symbol.hasInstance]: {
        value: (event: any) => event && event.__factory === EventType,
      },
    }
  )

  return EventType
}

// tslint:disable no-expression-statement
Object.defineProperty(DomainEvent, Symbol.hasInstance, {
  value: (EventType: any) => EventType && EventType.__factory === DomainEvent,
})
