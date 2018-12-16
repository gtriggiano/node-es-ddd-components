import 'jest'

import { DomainEvent } from '../../../../dist/main/lib'

import { getEventTypeDefinition as getDefinition } from './mocks'

describe('eventType = EventType(payload)', () => {
  it('eventType.name === EventType.name', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    const eventType = EventType({ prop: 'value' })
    expect(eventType.name).toEqual(definition.name)
  })
  it('eventType.data === payload', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    const payload = { prop: 'value' }
    const eventType = EventType(payload)
    expect(eventType.data).toEqual(payload)
  })
  it('eventType.getSerializedPayload() returns the serialization of eventType.data', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    const eventType = EventType({ prop: 'test' })
    expect(eventType.getSerializedPayload()).toEqual(`{"prop":"test"}`)
  })
  it('eventType.applyToState(state) returns definition.reducer(state, eventType)', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    const eventType = EventType({ key: 'a key', value: 'a value' })

    const stateMap = eventType.applyToState({})
    expect(stateMap).toEqual({ ['a key']: 'a value' })
    const stateArray = eventType.applyToState([])
    expect(stateArray).toEqual([{ key: 'a key', value: 'a value' }])
  })
  it('eventType is recognized as `instanceof EventType`', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    const eventType = EventType({ key: 'a key', value: 'a value' })
    expect(eventType instanceof EventType).toBe(true)
  })
})
