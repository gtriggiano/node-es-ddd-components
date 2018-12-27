import { isFunction, isObject } from 'lodash'

import { AggregateState } from '../Aggregate/types'
import { CustomError } from '../CustomError'
import { getDeserializer, getSerializer } from '../utils'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventTypeDefinition,
  DomainEventTypeFactory,
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
): DomainEventTypeFactory<Name, Payload, State> {
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

  function EventTypeFactory(
    payload: Readonly<Payload>
  ): DomainEventInstance<Name, Payload, State> {
    const event = {}
    // tslint:disable no-let
    let serializedPayload = ''
    // tslint:enable
    return Object.defineProperties(event, {
      __factory: { value: EventTypeFactory },
      applyToState: {
        value: (state: Readonly<State>): Readonly<State> =>
          reducer(state, payload),
      },
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
      payload: { enumerable: true, value: payload },
    })
  }

  return Object.defineProperties(EventTypeFactory, {
    __factory: { value: DomainEvent },
    description: { value: description || '' },
    fromSerializedPayload: {
      value: (serializedPayload: string) =>
        EventTypeFactory(deserializePayload(serializedPayload)),
    },
    name: { value: name },
    [Symbol.hasInstance]: {
      value: (event: any) =>
        isObject(event) && event.__factory === EventTypeFactory,
    },
  }) as DomainEventTypeFactory<Name, Payload, State>
}

// tslint:disable no-expression-statement
Object.defineProperties(DomainEvent, {
  [Symbol.hasInstance]: {
    value: (EventType: any) =>
      isFunction(EventType) && (EventType as any).__factory === DomainEvent,
  },
})
