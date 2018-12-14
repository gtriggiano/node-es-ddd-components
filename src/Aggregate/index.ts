import { AggregateError } from '../AggregateError'
import {
  AggregateErrorConstructor,
  AggregateErrorData,
  AggregateErrorName,
} from '../AggregateError/types'
import {
  DomaiEventPayload,
  DomainEventConstructor,
  DomainEventInstance,
  DomainEventName,
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
  AggregateConstructor,
  AggregateConstructorEvent,
  AggregateDefinition,
  AggregateIdentity,
  AggregateInstance,
  AggregateSnapshot,
  AggregateState,
  AggregateType,
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

export const BadAggregateConstruction = AggregateError<
  'BadAggregateConstruction',
  WithOriginalError
>({
  name: 'BadAggregateConstruction',
})

export const BadAggregateDefinition = AggregateError<
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
  Type extends AggregateType,
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    E,
    Event,
    E['name'],
    Event['name']
  >
>(
  definition: AggregateDefinition<BC, Type, State, Query, E, Event, Command>
): AggregateConstructor<
  BC,
  Type,
  AggregateIdentity,
  State,
  Query,
  E,
  Event,
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

  const AggregateCtor = (
    identity?: AggregateIdentity,
    snapshot?: AggregateSnapshot,
    events?: ReadonlyArray<AggregateConstructorEvent<Event['name']>>
  ): AggregateInstance<
    BC,
    Type,
    typeof identity,
    State,
    Query,
    E,
    Event,
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

    let currentState = snapshot
      ? deserializeState(snapshot.serializedState)
      : initialState

    let currentConsistencyPolicy: ConsistencyPolicy = 2

    const emittedEvents: Array<
      DomainEventInstance<DomainEventName, DomaiEventPayload, State>
    > = []
    // tslint:enable

    const name = getAggregateName(type, identity)

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

    const errorInterface = ErrorInterface<E, AggregateErrorDictionary<E>>({
      raisableErrors,
    })

    const emissionInterface = EmissionInterface<
      State,
      Event,
      AggregateEventDictionary<State, Event>
    >({
      emittableEvents,
      onNewEvent: (event, consistencyPolicy) => {
        // tslint:disable no-expression-statement
        currentState = event.applyToState(currentState)
        emittedEvents.push(event)
        currentConsistencyPolicy =
          currentConsistencyPolicy < consistencyPolicy
            ? currentConsistencyPolicy
            : consistencyPolicy
        // tslint:enable
      },
    })

    const commandInterface = CommandInterface<
      State,
      Query,
      AggregateQueryDictionary<State, Query>,
      E,
      AggregateErrorDictionary<E>,
      Event,
      AggregateEventDictionary<State, Event>,
      Command,
      AggregateCommandDictionary<State, Query, E, Event, Command>
    >({
      availableCommands,
      emissionInterface,
      errorInterface,
      queryInterface,
    })

    return Object.defineProperties(
      {},
      {
        New: { value: AggregateCtor },
        appendEvents: {
          value: (
            eventsToAppend: ReadonlyArray<
              AggregateConstructorEvent<Event['name']>
            >
          ) =>
            AggregateCtor(identity, snapshot, history.concat(eventsToAppend)),
        },
        clone: { value: () => AggregateCtor(identity, snapshot, events) },
        context: { value: context },
        execute: { value: commandInterface },
        getConsistencyPolicy: {
          value: () => currentConsistencyPolicy || (0 as ConsistencyPolicy),
        },
        getNewEvents: { value: () => [...emittedEvents] },
        getSerializedState: { value: () => serializeState(currentState) },
        getSnapshot: {
          value: () => ({
            serializedState: serializeState(currentState),
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

  return Object.defineProperties(AggregateCtor, {
    context: { value: context, enumerable: true },
    description: { value: description || '' },
    name: { value: type },
    toString: { value: () => aggregateCtorToStringOutput },
    type: { value: type },
    [Symbol.hasInstance]: {
      value: (instance: any) =>
        instance && instance.New && instance.New === AggregateCtor,
    },
  })
}
