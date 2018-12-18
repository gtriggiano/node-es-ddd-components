import { CustomError } from '../CustomError'
import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorType,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventInstance,
  DomainEventName,
  DomainEventType,
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

export interface AggregateCommand<Name extends string, Input extends any> {
  readonly name: Name
  readonly description?: string
  readonly errors: ReadonlyArray<string>
  readonly events: ReadonlyArray<string>
  readonly handler: (input: Input) => void
}

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
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  EventType extends DomainEventType<DomainEventName, DomaiEventPayload, State>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorType,
    EventType,
    ErrorType['name'],
    EventType['name']
  >
>(
  definition: AggregateDefinition<
    BC,
    TypeName,
    State,
    Query,
    ErrorType,
    EventType,
    Command
  >
): AggregateTypeFactory<
  BC,
  TypeName,
  AggregateIdentity,
  State,
  Query,
  ErrorType,
  EventType,
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

  // const isProduction: boolean =
  //   process && process.env && process.env.NODE_ENV === 'production'
  const snapshotNamespace = getSnaphotNamespace(snapshotPrefix, context)
  const serializeState = getSerializer<State>(providedSerializer)
  const deserializeState = getDeserializer<State>(providedDeserializer)
  const emittableEventsDictionary = emittableEvents.reduce(
    (dict, EvtType) => ({
      ...dict,
      [EvtType.name]: EvtType,
    }),
    {}
  ) as { readonly [k: string]: EventType }

  const Factory = (
    identity?: AggregateIdentity,
    snapshot?: AggregateSnapshot,
    events?: ReadonlyArray<SerializedDomainEvent<DomainEventName>>
  ): AggregateInstance<
    BC,
    TypeName,
    typeof identity,
    State,
    Query,
    ErrorType,
    EventType,
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
        const EvtType: EventType | undefined =
          emittableEventsDictionary[event.name]
        return EvtType
          ? EvtType.fromSerializedPayload(event.serializedPayload).applyToState(
              state
            )
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
      ErrorType,
      AggregateErrorDictionary<ErrorType>
    >({
      raisableErrors,
    })

    const emissionInterface = EmissionInterface<
      State,
      EventType,
      AggregateEventDictionary<State, EventType>
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
      ErrorType,
      AggregateErrorDictionary<ErrorType>,
      EventType,
      AggregateEventDictionary<State, EventType>,
      Command,
      AggregateCommandDictionary<State, Query, ErrorType, EventType, Command>
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
          value: (
            eventsToAppend: ReadonlyArray<
              SerializedDomainEvent<DomainEventName>
            >
          ) => Factory(identity, snapshot, history.concat(eventsToAppend)),
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
          get: () =>
            `${aggregateToStringPrefix}${
              emittedEvents.length ? `+${emittedEvents.length}` : ''
            }`,
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
