import {
  AggregateErrorConstructor,
  AggregateErrorData,
  AggregateErrorName,
} from '../AggregateError/types'
import {
  DomaiEventPayload,
  DomainEventConstructor,
  DomainEventName,
} from '../DomainEvent/types'

import {
  AggregateCommandDefinition,
  AggregateCommandDictionary,
  AggregateCommandInput,
  AggregateCommandInterface,
  AggregateCommandName,
} from './commands.types'
import {
  AggregateErrorDictionary,
  AggregateErrorInterface,
} from './errors.types'
import {
  AggregateEmissionInterface,
  AggregateEventDictionary,
} from './events.types'
import {
  AggregateQueryDefinition,
  AggregateQueryDictionary,
  AggregateQueryInput,
  AggregateQueryInterface,
  AggregateQueryName,
  AggregateQueryOutput,
} from './queries.types'
import { AggregateState } from './types'

export interface CommandInterfaceConfiguration<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  QueryDictionary extends AggregateQueryDictionary<State, Query>,
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<E>,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, Event>,
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
> {
  readonly queryInterface: AggregateQueryInterface<
    State,
    Query,
    QueryDictionary
  >

  readonly errorInterface: AggregateErrorInterface<E, ErrorDictionary>

  readonly emissionInterface: AggregateEmissionInterface<
    State,
    Event,
    EventDictionary
  >

  readonly availableCommands: ReadonlyArray<Command>
}

export default function CommandInterface<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  QueryDictionary extends AggregateQueryDictionary<State, Query>,
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<E>,
  Event extends DomainEventConstructor<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, Event>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    E,
    Event,
    E['name'],
    Event['name']
  >,
  CommandDictionary extends AggregateCommandDictionary<
    State,
    Query,
    E,
    Event,
    Command
  >
>(
  config: CommandInterfaceConfiguration<
    State,
    Query,
    QueryDictionary,
    E,
    ErrorDictionary,
    Event,
    EventDictionary,
    Command
  >
): AggregateCommandInterface<
  State,
  Query,
  E,
  Event,
  Command,
  CommandDictionary
> {
  const {
    queryInterface,
    errorInterface,
    emissionInterface,
    availableCommands,
  } = config

  return availableCommands.reduce((commandInterface, command) => {
    const filteredEmissionInterface = command.emittableEvents.reduce(
      (fEmissionInterface, eventName) =>
        emissionInterface[eventName]
          ? Object.defineProperty(fEmissionInterface, eventName, {
              enumerable: true,
              value: emissionInterface[eventName],
            })
          : fEmissionInterface,
      {}
    )

    const filteredErrorInterface = command.raisableErrors.reduce(
      (fErrorInterface, errorName) =>
        errorInterface[errorName]
          ? Object.defineProperty(fErrorInterface, errorName, {
              enumerable: true,
              value: errorInterface[errorName],
            })
          : fErrorInterface,
      {}
    )

    const commandImplementationInterface = Object.defineProperties(
      {},
      {
        emit: { enumerable: true, value: filteredEmissionInterface },
        error: { enumerable: true, value: filteredErrorInterface },
        query: { enumerable: true, value: queryInterface },
      }
    )

    return Object.defineProperty(commandInterface, command.name, {
      enumerable: true,
      value: Object.defineProperty(
        (input?: any) => command.handler(input, commandImplementationInterface),
        'name',
        { value: command.name }
      ),
    })
  }, {}) as AggregateCommandInterface<
    State,
    Query,
    E,
    Event,
    Command,
    CommandDictionary
  >
}
