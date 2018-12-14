require('jest')
const { omit, sample } = require('lodash')

const {
  Aggregate,
  BadAggregateDefinition,
  validNameDescription,
} = require('../../../dist/main')

const {
  getDefinition,
  CreateCommand,
  RenameCommand,
  SetAddressCommand,
  wasCreatedQuery,
  getNameQuery,
  getAddressQuery,
  CreatedEvent,
  RenamedEvent,
  DeclaredAddressEvent,
  MovedEvent,
  UserAlreadyExist,
  UserDoesNotExist,
} = require('./getDefinition.mocks')

describe('Aggregate(definition) throws `BadAggregateDefinition` when:', () => {
  it('definition is not an object', () => {
    expect(() => Aggregate()).toThrow(BadAggregateDefinition)
    expect(() => Aggregate(3)).toThrow(BadAggregateDefinition)
  })
  it(`definition.context is not a ${validNameDescription}`, () => {
    const definition = getDefinition()
    expect(() => Aggregate(omit(definition, ['context']))).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: 2 })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: '2' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: 'a2' })).not.toThrow()
  })
  it(`definition.type is not a ${validNameDescription}`, () => {
    const definition = getDefinition()
    expect(() => Aggregate(omit(definition, ['type']))).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, type: 2 })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, type: '2' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, type: 'a2' })).not.toThrow()
  })
  it('definition.singleton is neither nil nor a boolean', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, singleton: 'a' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate(omit(definition, ['singleton']))).not.toThrow()
    expect(() => Aggregate({ ...definition, singleton: true })).not.toThrow()
    expect(() => Aggregate({ ...definition, singleton: false })).not.toThrow()
  })
  it('definition.description is neither nil nor a string', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, description: true })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate(omit(definition, ['description']))).not.toThrow()
    expect(() => Aggregate({ ...definition, description: '' })).not.toThrow()
    expect(() =>
      Aggregate({ ...definition, description: 'a description' })
    ).not.toThrow()
  })
  it('definition.initialState is not an object', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, initialState: undefined })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, initialState: null })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, initialState: 2 })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, initialState: 'test' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, initialState: {} })).not.toThrow()
  })
  it('definition.snapshotThreshold is neither nil nor an integer > 0', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, snapshotThreshold: 'a' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, snapshotThreshold: true })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, snapshotThreshold: 0 })).toThrow(
      BadAggregateDefinition
    )
    expect(() =>
      Aggregate(omit(definition, ['snapshotThreshold']))
    ).not.toThrow()
    expect(() =>
      Aggregate({ ...definition, snapshotThreshold: 1 })
    ).not.toThrow()
  })
  it('definition.snapshotPrefix is neither nil nor a string', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, snapshotPrefix: true })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate(omit(definition, ['snapshotPrefix']))).not.toThrow()
    expect(() => Aggregate({ ...definition, snapshotPrefix: '' })).not.toThrow()
    expect(() =>
      Aggregate({ ...definition, snapshotPrefix: 'a prefix' })
    ).not.toThrow()
  })
  it('definition.[commands|queries|events|errors] are not array', () => {
    const definition = getDefinition()
    const key = sample(['commands', 'queries', 'events', 'errors'])

    expect(() => Aggregate({ ...definition, [key]: {} })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, [key]: 2 })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, [key]: undefined })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, [key]: [] })).not.toThrow()
  })
  it('definition.commands are not unique by .name', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({
        ...definition,
        commands: [
          CreateCommand,
          CreateCommand,
          RenameCommand,
          SetAddressCommand,
        ],
      })
    ).toThrow(BadAggregateDefinition)
    expect(() =>
      Aggregate({
        ...definition,
        commands: [CreateCommand, RenameCommand, SetAddressCommand],
      })
    ).not.toThrow()
  })
  it('definition.commands are not all valid commands', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({ ...definition, commands: definition.commands.concat(null) })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.queries are not unique by .name', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({
        ...definition,
        queries: [
          wasCreatedQuery,
          wasCreatedQuery,
          getNameQuery,
          getAddressQuery,
        ],
      })
    ).toThrow(BadAggregateDefinition)
    expect(() =>
      Aggregate({
        ...definition,
        queries: [wasCreatedQuery, getNameQuery, getAddressQuery],
      })
    ).not.toThrow()
  })
  it('definition.queries are not all valid queries', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({ ...definition, queries: definition.queries.concat(null) })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.events are not unique by .type', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({
        ...definition,
        events: [
          CreatedEvent,
          CreatedEvent,
          RenamedEvent,
          DeclaredAddressEvent,
          MovedEvent,
        ],
      })
    ).toThrow(BadAggregateDefinition)
    expect(() =>
      Aggregate({
        ...definition,
        events: [CreatedEvent, RenamedEvent, DeclaredAddressEvent, MovedEvent],
      })
    ).not.toThrow()
  })
  it('definition.errors are not unique by .name', () => {
    const definition = getDefinition()
    expect(() =>
      Aggregate({
        ...definition,
        errors: [UserAlreadyExist, UserAlreadyExist, UserDoesNotExist],
      })
    ).toThrow(BadAggregateDefinition)
    expect(() =>
      Aggregate({
        ...definition,
        errors: [UserAlreadyExist, UserDoesNotExist],
      })
    ).not.toThrow()
  })
  it('definition.serializeState is neither nil nor a function', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, serializeState: true })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, serializeState: 'true' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate(omit(definition, ['serializeState']))).not.toThrow()
    expect(() =>
      Aggregate({ ...definition, serializeState: () => {} })
    ).not.toThrow()
  })
  it('definition.deserializeState is neither nil nor a function', () => {
    const definition = getDefinition()
    expect(() => Aggregate({ ...definition, deserializeState: true })).toThrow(
      BadAggregateDefinition
    )
    expect(() =>
      Aggregate({ ...definition, deserializeState: 'true' })
    ).toThrow(BadAggregateDefinition)
    expect(() =>
      Aggregate(omit(definition, ['deserializeState']))
    ).not.toThrow()
    expect(() =>
      Aggregate({ ...definition, deserializeState: () => {} })
    ).not.toThrow()
  })
})
