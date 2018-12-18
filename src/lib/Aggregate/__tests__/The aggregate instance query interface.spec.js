import 'jest'

import { Aggregate } from '../../../../dist/main/lib'

import { definition } from '../../../../dist/main/tests/TodoList'

describe('The aggregate instance query interface', () => {
  it('every prop maps to one of the definition.queries handler', () => {
    const AggregateType = Aggregate({
      ...definition,
      queries: [
        ...definition.queries,
        {
          name: 'getRandom',
          handler: state => state.random,
        },
      ],
    })
    const state = {
      random: Math.random() * 5000,
    }
    const aggregate = AggregateType('x', {
      serializedState: JSON.stringify(state),
      version: 5,
    })
    expect(aggregate.query.getRandom()).toBe(state.random)
  })
})
