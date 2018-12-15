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
    const serializedPayload = serializePayload(payload)
    const event: DomainEventInstance<Name, Payload, State> = {
      name,

      data: payload,

      applyToState: (state: State): State => reducer(state, event),
      getSerializedPayload: () => serializedPayload,
    }
    return event
  }

  const getInstanceFromPayloadValidated = getInstanceFromPayload

  const Ctor = Object.defineProperties(
    (payload: Payload, skipValidation?: boolean) =>
      skipValidation
        ? getInstanceFromPayload(payload)
        : getInstanceFromPayloadValidated(payload),
    {
      description: { value: description || '' },
      fromSerializedPayload: {
        value: (serializedPayload: string) =>
          Ctor(deserializePayload(serializedPayload), true),
      },
      name: { value: name },
    }
  )

  return Ctor
}
