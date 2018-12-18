import assert from 'assert'
import {
  every,
  isBoolean,
  isFunction,
  isInteger,
  isNil,
  isObject,
  isString,
  uniq,
} from 'lodash'
import { isValidName, validNameDescription } from '../utils/isValidName'

export default function validateDefinition(definition: any): void {
  assert(isObject(definition), `definition MUST be an object`)

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

  assert(
    isNil(description) || isString(description),
    `definition.description MUST be nil or a string`
  )

  assert(
    isValidName(context),
    `definition.context MUST be a ${validNameDescription}`
  )

  assert(isValidName(type), `definition.type MUST be a ${validNameDescription}`)

  assert(
    isNil(singleton) || isBoolean(singleton),
    `definition.singleton MUST be nil or a boolean`
  )

  assert(
    !isNil(initialState) && isObject(initialState),
    `definition.initialState MUST NOT be nil`
  )

  assert(
    Array.isArray(availableQueries) &&
      Array.isArray(availableCommands) &&
      Array.isArray(raisableErrors) &&
      Array.isArray(emittableEvents),
    `definition.[commands|queries|events|errors] MUST be array`
  )

  assert(
    every(availableQueries, isValidAggregateQuery),
    `every definition.queries[] MUST be a valid aggregate query definition`
  )
  const queryNames = availableQueries.map(({ name }: any) => name)
  assert(
    uniq(queryNames).length === queryNames.length,
    `definition.queries MUST be unique by 'name'`
  )

  assert(
    every(availableCommands, isValidAggregateCommand),
    `every definition.commands[] MUST be a valid aggregate command definition`
  )

  const commandNames = availableCommands.map(({ name }: any) => name)
  assert(
    uniq(commandNames).length === commandNames.length,
    `definition.commands MUST be unique by 'name'`
  )

  const errorNames = raisableErrors.map(({ name }: any) => name)
  assert(
    uniq(errorNames).length === errorNames.length,
    `definition.errors MUST be unique by 'name'`
  )

  assert(
    every(emittableEvents, isValidDomainEventConstructor),
    `every definition.events[] MUST be a valid DomainEvent condtructor`
  )

  const eventNames = emittableEvents.map(({ name }: any) => name)
  assert(
    uniq(eventNames).length === eventNames.length,
    `definition.events MUST be unique by 'type'`
  )

  assert(
    isNil(snapshotPrefix) || isString(snapshotPrefix),
    `definition.snapshotPrefix MUST be either nil or a string`
  )

  assert(
    isNil(snapshotThreshold) ||
      (isInteger(snapshotThreshold) && snapshotThreshold > 0),
    `definition.snapshotThreshold MUST be either nil or an integer > 0`
  )

  assert(
    isNil(providedSerializer) || isFunction(providedSerializer),
    `definition.serializeState MUST be either nil or a function`
  )
  assert(
    isNil(providedDeserializer) || isFunction(providedDeserializer),
    `definition.deserializeState MUST be either nil or a function`
  )
}

const isValidDomainEventConstructor = (ctor: any): boolean => {
  return (
    isValidName(ctor.name) &&
    isString(ctor.description) &&
    typeof ctor === 'function' &&
    typeof ctor.fromSerializedPayload === 'function'
  )
}

const isValidAggregateCommand = (command: any): boolean => {
  return (
    isObject(command) &&
    isValidName(command.name) &&
    (isNil(command.description) || isString(command.description)) &&
    Array.isArray(command.emittableEvents) &&
    Array.isArray(command.raisableErrors) &&
    every(command.emittableEvents, isValidName) &&
    every(command.raisableErrors, isValidName) &&
    uniq(command.emittableEvents).length === command.emittableEvents.length &&
    uniq(command.raisableErrors).length === command.raisableErrors.length &&
    typeof command.handler === 'function'
  )
}

const isValidAggregateQuery = (query: any): boolean => {
  return (
    isObject(query) &&
    isValidName(query.name) &&
    (isNil(query.description) || isString(query.description)) &&
    typeof query.handler === 'function'
  )
}
