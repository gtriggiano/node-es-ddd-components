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
  AggregateCommandErrorInterface,
  AggregateErrorDictionary,
} from './errors.types'
import {
  AggregateCommandEmissionInterface,
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
import { AggregateState, MapDiscriminatedUnion } from './types'

/**
 * The name of an aggregate command
 */
export type AggregateCommandName = string

/**
 * The input type of an aggregate command
 */
export type AggregateCommandInput = any

/**
 * An interface provided to the command handler
 * implementation which contains:
 *  - the aggregate `query` interface
 *  - an `error` interface to create business logic errors to throw
 *  - an `emit` interface to generate events which update the aggregate state
 */
export interface CommandHandlerInterface<
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
  RaisableError extends ErrorTypeFactory['name'],
  EmittableEvent extends EventTypeFactory['name']
> {
  readonly query: AggregateQueryInterface<
    State,
    Query,
    AggregateQueryDictionary<State, Query>
  >

  readonly error: AggregateCommandErrorInterface<
    ErrorTypeFactory,
    AggregateErrorDictionary<ErrorTypeFactory>,
    RaisableError
  >

  readonly emit: AggregateCommandEmissionInterface<
    State,
    EventTypeFactory,
    AggregateEventDictionary<State, EventTypeFactory>,
    EmittableEvent
  >
}

/**
 * The implementation of an aggregate command
 */
export type AggregateCommandImplementation<
  Input extends AggregateCommandInput,
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
  RaisableError extends ErrorTypeFactory['name'],
  EmittableEvent extends EventTypeFactory['name']
> = (
  input: Input,
  commandInterface: CommandHandlerInterface<
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    RaisableError,
    EmittableEvent
  >
) => void

/**
 * An object describing a command handled
 * by an aggregate
 */
export interface AggregateCommandDefinition<
  Name extends string,
  Input extends AggregateCommandInput,
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
  RaisableError extends ErrorTypeFactory['name'],
  EmittableEvent extends EventTypeFactory['name']
> {
  readonly name: Name
  readonly description?: string
  readonly raisableErrors: ReadonlyArray<RaisableError>
  readonly emittableEvents: ReadonlyArray<EmittableEvent>
  readonly handler: AggregateCommandImplementation<
    Input,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    RaisableError,
    EmittableEvent
  >
}

/**
 * The input type of an aggregate command implementation
 */
export type CommandImplementationInput<
  CommandImplementation
> = CommandImplementation extends (input: infer I, commandInterface: any) => any
  ? I
  : never

/**
 * An aggregate behaviour exposed by the
 * aggregate `execute` interface
 */
export type AggregateCommandInterfaceMethod<
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
  CommandImplementation extends AggregateCommandImplementation<
    DomainEventName,
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    ErrorTypeFactory['name'],
    EventTypeFactory['name']
  >
> = CommandImplementationInput<CommandImplementation> extends void
  ? () => void
  : (input: CommandImplementationInput<CommandImplementation>) => void

export type AggregateCommandDictionary<
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
> = MapDiscriminatedUnion<Command, 'name'>

/**
 * A dictionary of all the behaviours exposed by an aggregate
 */
export type AggregateCommandInterface<
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
  >,
  CommandDictionary extends AggregateCommandDictionary<
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    Command
  >
> = {
  [K in keyof CommandDictionary]: AggregateCommandInterfaceMethod<
    State,
    Query,
    ErrorTypeFactory,
    EventTypeFactory,
    CommandDictionary[K]['handler']
  >
}
