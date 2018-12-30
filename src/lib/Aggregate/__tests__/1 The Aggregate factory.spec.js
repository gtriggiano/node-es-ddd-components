import 'jest'
import { omit, sample, isObject } from 'lodash'

import {
  Aggregate,
  BadAggregateDefinition,
  validNameDescription,
} from 'lib-export'
import { definition } from 'lib-tests/TodoList'

describe('The Aggregate factory', () => {
  it('is a function', () => {
    expect(typeof Aggregate).toBe('function')
  })
})

describe('Aggregate(definition: AggregateDefinition) throws `BadAggregateDefinition` when:', () => {
  it('definition is not an object', () => {
    expect(() => Aggregate()).toThrow(BadAggregateDefinition)
    expect(() => Aggregate(3)).toThrow(BadAggregateDefinition)

    expect(isObject(definition)).toBe(true)
    expect(() => Aggregate(definition)).not.toThrow()
  })
  it(`definition.context is not a ${validNameDescription}`, () => {
    expect(() => Aggregate(omit(definition, ['context']))).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: 2 })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: '2a' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate({ ...definition, context: 'a2' })).not.toThrow()
  })
  it(`definition.type is not a ${validNameDescription}`, () => {
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
    expect(() => Aggregate({ ...definition, singleton: 'a' })).toThrow(
      BadAggregateDefinition
    )
    expect(() => Aggregate(omit(definition, ['singleton']))).not.toThrow()
    expect(() => Aggregate({ ...definition, singleton: true })).not.toThrow()
    expect(() => Aggregate({ ...definition, singleton: false })).not.toThrow()
  })
  it('definition.description is neither nil nor a string', () => {
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
    expect(() =>
      Aggregate({
        ...definition,
        commands: [...definition.commands, definition.commands[0]],
      })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.commands are not all valid commands', () => {
    expect(() =>
      Aggregate({ ...definition, commands: definition.commands.concat(null) })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.queries are not unique by .name', () => {
    expect(() =>
      Aggregate({
        ...definition,
        queries: [...definition.queries, definition.queries[0]],
      })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.queries are not all valid queries', () => {
    expect(() =>
      Aggregate({ ...definition, queries: definition.queries.concat(null) })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.events are not unique by .type', () => {
    expect(() =>
      Aggregate({
        ...definition,
        events: [...definition.events, definition.events[0]],
      })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.errors are not unique by .name', () => {
    expect(() =>
      Aggregate({
        ...definition,
        errors: [...definition.errors, definition.errors[0]],
      })
    ).toThrow(BadAggregateDefinition)
  })
  it('definition.serializeState is neither nil nor a function', () => {
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

describe('Aggregate(definition: AggregateDefinition) returns an AggregateType factory', () => {
  it('AggregateType is a function', () => {
    const AggregateType = Aggregate(definition)
    expect(typeof AggregateType).toBe('function')
  })
  it('AggregateType.name === definition.type', () => {
    const AggregateType = Aggregate({ ...definition, type: 'xs' })
    expect(AggregateType.name).toBe('xs')
  })
  it('AggregateType.context === definition.context', () => {
    const AggregateType = Aggregate({ ...definition, context: 'x' })
    expect(AggregateType.context).toBe('x')
  })
  it('AggregateType.type === definition.type', () => {
    const AggregateType = Aggregate(definition)
    expect(AggregateType.type).toBe(definition.type)
  })
  it('AggregateType.singleton === definition.singleton', () => {
    const nonSingletonDefinition = { ...definition, singleton: false }
    const singletonDefinition = { ...definition, singleton: true }

    expect(Aggregate(nonSingletonDefinition).singleton).toBe(false)
    expect(Aggregate(singletonDefinition).singleton).toBe(true)
  })
  it('AggregateType.description === definition.description || ``', () => {
    const AggregateType = Aggregate({ ...definition, description: 'x' })
    expect(AggregateType.description).toBe('x')

    const AggregateType2 = Aggregate({ ...definition, description: undefined })
    expect(AggregateType2.description).toBe('')
  })
  it('AggregateType is recognized as `instance of` Aggregate', () => {
    const AggregateType = Aggregate(definition)
    expect(AggregateType instanceof Aggregate).toBe(true)
  })
  it('AggregateType.toString() === `[Function ${definition.context}:${definition.type}]`', () => {
    const AggregateType = Aggregate(definition)
    expect(AggregateType.toString()).toBe(
      `[Function ${definition.context}:${definition.type}]`
    )
  })
})
