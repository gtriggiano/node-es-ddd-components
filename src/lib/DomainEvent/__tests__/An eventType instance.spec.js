import 'jest'

import { DomainEvent } from '../../../../dist/main/lib'

const definition = {
  description: 'A description',
  name: 'SomethingHappened',
  reducer: (state, event) =>
    Array.isArray(state)
      ? [...state, event.payload]
      : {
          ...state,
          [event.payload.key]: event.payload.value,
        },
}

describe('An eventType instance. eventType = EventType(payload)', () => {
  it('eventType.name === EventType.name', () => {
    const EventType = DomainEvent(definition)
    const eventType = EventType({ key: 'a', value: 'b' })
    expect(eventType.name).toEqual(definition.name)
  })
  it('eventType.data === payload', () => {
    const EventType = DomainEvent(definition)
    const payload = { key: 'a', value: 'b' }
    const eventType = EventType(payload)
    expect(eventType.payload).toEqual(payload)
  })
  it('eventType.getSerializedPayload() returns the serialization of eventType.data', () => {
    const EventType = DomainEvent(definition)
    const payload = { key: 'a', value: 'b' }
    const eventType = EventType(payload)
    expect(eventType.getSerializedPayload()).toEqual(JSON.stringify(payload))
  })
  it('eventType.applyToState(state) returns definition.reducer(state, eventType)', () => {
    const EventType = DomainEvent(definition)
    const eventType = EventType({ key: 'a key', value: 'a value' })

    const stateMap = eventType.applyToState({})
    expect(stateMap).toEqual({ ['a key']: 'a value' })
    const stateArray = eventType.applyToState([])
    expect(stateArray).toEqual([{ key: 'a key', value: 'a value' }])
  })
  it('eventType is recognized as `instanceof EventType`', () => {
    const EventType = DomainEvent(definition)
    const eventType = EventType({ key: 'a key', value: 'a value' })
    expect(eventType instanceof EventType).toBe(true)
  })
})
