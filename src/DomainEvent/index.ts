import { AggregateState } from '../Aggregate/types'
import { AggregateError } from '../AggregateError'
import { getDeserializer, getSerializer } from '../utils'
import {
  DomaiEventPayload,
  DomainEventConstructor,
  DomainEventDefinition,
  DomainEventInstance,
  DomainEventName,
} from './types'
import validateDefinition from './validateDefinition'

export const BadDomainEventDefinition = AggregateError<
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
  definition: DomainEventDefinition<Name, Payload, State>
): DomainEventConstructor<Name, Payload, State> {
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
