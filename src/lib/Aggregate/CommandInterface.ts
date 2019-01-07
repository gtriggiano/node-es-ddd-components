import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import {
  DomaiEventPayload,
  DomainEventName,
  DomainEventTypeFactory,
} from '../DomainEvent/types'

import {
  AggregateCommandDefinition,
  AggregateCommandDictionary,
  AggregateCommandInput,
  AggregateCommandInterface,
  AggregateCommandName,
} from './commands.types'
import {
  AggregateCommandErrorInterface,
  AggregateErrorDictionary,
  AggregateErrorInterface,
} from './errors.types'
import {
  AggregateCommandEmissionInterface,
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
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  ErrorDictionary extends AggregateErrorDictionary<ErrorTypeFactory>,
  EventType extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, EventType>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventType,
    ErrorTypeFactory['name'],
    EventType['name']
  >
> {
  readonly queryInterface: AggregateQueryInterface<
    State,
    Query,
    QueryDictionary
  >

  readonly errorInterface: AggregateErrorInterface<
    ErrorTypeFactory,
    ErrorDictionary
  >

  readonly emissionInterface: AggregateEmissionInterface<
    State,
    EventType,
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
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  ErrorDictionary extends AggregateErrorDictionary<ErrorTypeFactory>,
  EventTypeFactory extends DomainEventTypeFactory<
    DomainEventName,
    DomaiEventPayload,
    State
  >,
  EventDictionary extends AggregateEventDictionary<State, EventTypeFactory>,
  Command extends AggregateCommandDefinition<
    AggregateCommandName,
    AggregateCommandInput,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    ErrorTypeFactory['name'],
    EventTypeFactory['name']
  >,
  CommandDictionary extends AggregateCommandDictionary<
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >
>(
  config: CommandInterfaceConfiguration<
    State,
    Query,
    QueryDictionary,
    ErrorTypeFactory,
    ErrorDictionary,
    EventTypeFactory,
    EventDictionary,
    Command
  >
): AggregateCommandInterface<
  State,
  Query,
  ErrorTypeFactory,
  EventTypeFactory,
  Command,
  CommandDictionary
> {
  const {
    queryInterface,
    errorInterface,
    emissionInterface,
    availableCommands,
  } = config

  return availableCommands.reduce<
    AggregateCommandInterface<
      State,
      Query,
      ErrorTypeFactory,
      EventTypeFactory,
      Command,
      CommandDictionary
    >
  >((commandInterface, command) => {
    const filteredEmissionInterface = command.emittableEvents.reduce<
      AggregateCommandEmissionInterface<
        State,
        EventTypeFactory,
        EventDictionary,
        EventTypeFactory['name']
      >
    >(
      (fEmissionInterface, eventName) =>
        emissionInterface[eventName]
          ? Object.defineProperty(fEmissionInterface, eventName, {
              enumerable: true,
              value: emissionInterface[eventName],
            })
          : fEmissionInterface,
      Object.create(null)
    )

    const filteredErrorInterface = command.raisableErrors.reduce<
      AggregateCommandErrorInterface<
        ErrorTypeFactory,
        ErrorDictionary,
        ErrorTypeFactory['name']
      >
    >(
      (fErrorInterface, errorName) =>
        errorInterface[errorName]
          ? Object.defineProperty(fErrorInterface, errorName, {
              enumerable: true,
              value: errorInterface[errorName],
            })
          : fErrorInterface,
      Object.create(null)
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
  }, Object.create(null))
}
