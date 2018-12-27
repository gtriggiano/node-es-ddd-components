import { CustomError } from '../CustomError'
import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventTypeFactory,
  SerializedDomainEvent,
} from '../DomainEvent/types'
import { getDeserializer, getSerializer } from '../utils'

import { getAggregateName } from './aggregateUtils'
import CommandInterface from './CommandInterface'
import {
  AggregateCommandDefinition,
  AggregateCommandDictionary,
  AggregateCommandInput,
  AggregateCommandName,
} from './commands.types'
import EmissionInterface from './EmissionInterface'
import ErrorInterface from './ErrorInterface'
import { AggregateErrorDictionary } from './errors.types'
import { AggregateEventDictionary } from './events.types'
import {
  AggregateQueryDefinition,
  AggregateQueryDictionary,
  AggregateQueryInput,
  AggregateQueryName,
  AggregateQueryOutput,
} from './queries.types'
import QueryInterface from './QueryInterface'
import { getSnaphotKey, getSnaphotNamespace } from './snapshotUtils'
import {
  AggregateDefinition,
  AggregateIdentity,
  AggregateInstance,
  AggregateSnapshot,
  AggregateState,
  AggregateTypeFactory,
  AggregateTypeName,
  BoundedContext,
  ConsistencyPolicy,
} from './types'
import validateConstructorProps from './validateConstructorProps'
import validateDefinition from './validateDefinition'

export const STRICT_CONSISTENCY_POLICY = 0
export const SOFT_CONSISTENCY_POLICY = 1
export const NO_CONSISTENCY_POLICY = 2

interface WithOriginalError {
  readonly originalError: Error
}

export const BadAggregateConstruction = CustomError<
  'BadAggregateConstruction',
  WithOriginalError
>({
  name: 'BadAggregateConstruction',
})

export const BadAggregateDefinition = CustomError<
  'BadAggregateDefinition',
  WithOriginalError
>({
  name: 'BadAggregateDefinition',
})

export function Aggregate<
  BC extends BoundedContext,
  TypeName extends AggregateTypeName,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    ErrorTypeFactory['name'],
    EventTypeFactory['name']
  >
>(
  definition: AggregateDefinition<
    BC,
    TypeName,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >
): AggregateTypeFactory<
  BC,
  TypeName,
  AggregateIdentity,
  State,
  Query,
  ErrorTypeFactory,
  EventTypeFactory,
  Command
> {
  try {
    // tslint:disable no-expression-statement
    validateDefinition(definition)
    // tslint:enable
  } catch (e) {
    throw BadAggregateDefinition(e.message, { originalError: e })
  }

  const {
    description,
    context,
    type,
    singleton,
    initialState,
    queries: availableQueries,
    commands: availableCommands,
    errors: raisableErrors,
    events: emittableEvents,
    snapshotPrefix,
    snapshotThreshold,
    serializeState: providedSerializer,
    deserializeState: providedDeserializer,
  } = definition

  const snapshotNamespace = getSnaphotNamespace(snapshotPrefix, context)
  const serializeState = getSerializer<State>(providedSerializer)
  const deserializeState = getDeserializer<State>(providedDeserializer)
  const emittableEventsDictionary = emittableEvents.reduce(
    (dict, EvtType) => ({
      ...dict,
      [EvtType.name]: EvtType,
    }),
    {}
  ) as { readonly [k: string]: EventTypeFactory }

  const Factory = (
    identity?: AggregateIdentity,
    snapshot?: AggregateSnapshot,
    events?: ReadonlyArray<SerializedDomainEvent>
  ): AggregateInstance<
    BC,
    TypeName,
    typeof identity,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  > => {
    const history = events || []

    // tslint:disable no-expression-statement no-let readonly-array
    try {
      validateConstructorProps({
        events: history,
        identity,
        isSingleton: !!singleton,
        snapshot,
      })
    } catch (error) {
      throw BadAggregateConstruction(error.message, { originalError: error })
    }

    const name = getAggregateName(type, identity)

    const rebuiltState = history.reduce(
      (state, event, idx) => {
        const EvtType: EventTypeFactory | undefined =
          emittableEventsDictionary[event.name]
        return EvtType
          ? EvtType.fromSerializedPayload(event.payload).applyToState(state)
          : (() => {
              const error = new Error(
                `Aggregate ${context}:${name} does not recognizes an event named "${
                  event.name
                }". Please check events[${idx}]`
              )
              throw BadAggregateConstruction(error.message, {
                originalError: error,
              })
            })()
      },
      snapshot ? deserializeState(snapshot.serializedState) : initialState
    )
    let currentState = rebuiltState

    let currentConsistencyPolicy: ConsistencyPolicy | undefined
    const emittedEvents: Array<
      DomainEventInstance<DomainEventName, DomaiEventPayload, State>
    > = []
    // tslint:enable

    const snapshotKey = getSnaphotKey(snapshotNamespace, name)
    const needsSnapshot =
      !!snapshotThreshold && snapshotThreshold <= history.length

    const currentVersion =
      ((snapshot && snapshot.version) || 0) + history.length

    const aggregateToStringPrefix = `${context}:${name} #${currentVersion}`

    const queryInterface = QueryInterface<
      State,
      Query,
      AggregateQueryDictionary<State, Query>
    >({
      availableQueries,
      getState: () => currentState,
    })

    const errorInterface = ErrorInterface<
      ErrorTypeFactory,
      AggregateErrorDictionary<ErrorTypeFactory>
    >({
      raisableErrors,
    })

    const emissionInterface = EmissionInterface<
      State,
      EventTypeFactory,
      AggregateEventDictionary<State, EventTypeFactory>
    >({
      emittableEvents,
      onNewEvent: (event, consistencyPolicy) => {
        // tslint:disable no-expression-statement
        currentState = event.applyToState(currentState)
        emittedEvents.push(event)
        currentConsistencyPolicy =
          currentConsistencyPolicy !== undefined &&
          currentConsistencyPolicy <= consistencyPolicy
            ? currentConsistencyPolicy
            : consistencyPolicy
        // tslint:enable
      },
    })

    const commandInterface = CommandInterface<
      State,
      Query,
      AggregateQueryDictionary<State, Query>,
      ErrorTypeFactory,
      AggregateErrorDictionary<ErrorTypeFactory>,
      EventTypeFactory,
      AggregateEventDictionary<State, EventTypeFactory>,
      Command,
      AggregateCommandDictionary<
        State,
        Query,
        ErrorTypeFactory,
        EventTypeFactory,
        Command
      >
    >({
      availableCommands,
      emissionInterface,
      errorInterface,
      queryInterface,
    })

    return Object.defineProperties(
      {},
      {
        New: { value: Factory },
        appendEvents: {
          value: (eventsToAppend: ReadonlyArray<SerializedDomainEvent>) =>
            Factory(identity, snapshot, history.concat(eventsToAppend)),
        },
        clone: {
          value: () => Factory(identity, snapshot, events),
        },
        context: { value: context },
        execute: { value: commandInterface },
        getConsistencyPolicy: {
          value: () => currentConsistencyPolicy || (0 as ConsistencyPolicy),
        },
        getNewEvents: { value: () => [...emittedEvents] },
        getSerializedState: { value: () => serializeState(currentState) },
        getSnapshot: {
          value: () => ({
            serializedState: serializeState(rebuiltState),
            version: currentVersion,
          }),
        },
        identity: { value: identity },
        isDirty: { value: () => !!emittedEvents.length },
        needsSnapshot: { value: needsSnapshot },
        query: { value: queryInterface },
        snapshotKey: { value: snapshotKey },
        type: { value: type },
        version: { value: currentVersion },
        [Symbol.toStringTag]: {
          get: () => `${aggregateToStringPrefix}+${emittedEvents.length}`,
        },
      }
    )
  }

  const aggregateCtorToStringOutput = `[Function ${context}:${type}]`

  return Object.defineProperties(Factory, {
    __factory: { value: Aggregate },
    context: { value: context, enumerable: true },
    description: { value: description || '' },
    name: { value: type },
    toString: { value: () => aggregateCtorToStringOutput },
    type: { value: type },
    [Symbol.hasInstance]: {
      value: (instance: any) =>
        instance && instance.New && instance.New === Factory,
    },
  })
}

// tslint:disable no-expression-statement
Object.defineProperty(Aggregate, Symbol.hasInstance, {
  value: (Factory: any) => Factory && Factory.__factory === Aggregate,
})
