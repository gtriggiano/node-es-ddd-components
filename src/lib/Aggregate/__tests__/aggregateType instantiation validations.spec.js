import 'jest'

import { Aggregate, BadAggregateConstruction } from '../../../../dist/main/lib'

import { definition } from '../../../../dist/main/tests/TodoList'
import ListCreated from '../../../../dist/main/tests/TodoList/events/ListCreated'
import ListNameChanged from '../../../../dist/main/tests/TodoList/events/ListNameChanged'

const toSerializedEvent = e => ({
  name: e.name,
  serializedPayload: e.getSerializedPayload(),
})

describe('AggregateType([identity] [, snapshot] [, events]) throws `BadAggregateConstruction` when:', () => {
  it('identity is neither nil nor a string', () => {
    const AggregateType = Aggregate(definition)
    const AggregateTypeSingleton = Aggregate({ ...definition, singleton: true })

    expect(() => AggregateType(2)).toThrow(BadAggregateConstruction)
    expect(() => AggregateType({})).toThrow(BadAggregateConstruction)
    expect(() => AggregateType(false)).toThrow(BadAggregateConstruction)
    expect(() => AggregateType([])).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x')).not.toThrow(BadAggregateConstruction)
    expect(() => AggregateTypeSingleton()).not.toThrow(BadAggregateConstruction)
  })
  it('identity is undefined and aggregate is NOT a singleton', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })

    expect(() => AggregateType()).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x')).not.toThrow()
  })
  it('identity is a string and aggregate is a singleton', () => {
    const AggregateTypeSingleton = Aggregate({ ...definition, singleton: true })

    expect(() => AggregateTypeSingleton('x')).toThrow(BadAggregateConstruction)
    expect(() => AggregateTypeSingleton()).not.toThrow()
  })
  it('snapshot is neither falsy nor a valid snapshot object', () => {
    const AggregateType = Aggregate({ ...definition, singleton: false })

    expect(() => AggregateType('x', 'bad')).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x', 3)).toThrow(BadAggregateConstruction)
    expect(() =>
      AggregateType('x', { serializedState: '{}', version: 'x' })
    ).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x', false)).not.toThrow()
    expect(() => AggregateType('x', '')).not.toThrow()
    expect(() =>
      AggregateType('x', { serializedState: '{}', version: 2 })
    ).not.toThrow()
  })
  it('events is neither falsy nor an array of serialized domain events recognized by the aggregate', () => {
    const AggregateType = Aggregate(definition)

    expect(() => AggregateType('x', null, {})).toThrow(BadAggregateConstruction)
    expect(() => AggregateType('x', null, true)).toThrow(
      BadAggregateConstruction
    )
    expect(() => AggregateType('x', null, [null])).toThrow(
      BadAggregateConstruction
    )
    expect(() =>
      AggregateType('x', null, [
        { name: 'UnknownEvent', serializedPayload: 'dsaa' },
      ])
    ).toThrow(BadAggregateConstruction)

    expect(() => AggregateType('x', null, false)).not.toThrow()
    expect(() => AggregateType('x', null, [])).not.toThrow()
    expect(() =>
      AggregateType('x', null, [
        toSerializedEvent(ListCreated({ identity: 'a', name: 'A list' })),
        toSerializedEvent(ListNameChanged({ name: 'A list' })),
      ])
    ).not.toThrow()
  })
})
