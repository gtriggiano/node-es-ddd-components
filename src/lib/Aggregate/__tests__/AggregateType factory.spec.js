import 'jest'

import { Aggregate } from '../../../../dist/main/lib'
import { definition as originalDefinition } from '../../../../dist/main/tests/TodoList'

const [firstCommand, ...otherCommands] = originalDefinition.commands

const definition = {
  ...originalDefinition,
  commands: [
    ...otherCommands,
    {
      ...firstCommand,
      emittableEvents: [...firstCommand.emittableEvents, 'UnknownEvent'],
      raisableErrors: [...firstCommand.raisableErrors, 'UnknownError'],
    },
  ],
}

describe('AggregateType factory. AggregateType = Aggregate(definition)', () => {
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
