import 'jest'
import { noop } from 'lodash'

import { DomainEvent } from '../../../../dist/main/lib'

const definition = {
  name: 'SomethingHappened',
  description: 'A description',
  reducer: noop,
  serializeData: noop,
  deserializeData: noop,
}

describe('An EventType factory. EventType = DomainEvent(definition)', () => {
  it('EventType is a function', () => {
    const EventType = DomainEvent(definition)
    expect(typeof EventType).toBe('function')
  })
  it('EventType.name === definition.name', () => {
    const EventType = DomainEvent(definition)
    expect(EventType.name).toEqual(definition.name)
  })
  it('EventType.description === definition.description || ``', () => {
    const EventType = DomainEvent(definition)
    expect(EventType.description).toBe(definition.description)

    const EventType1 = DomainEvent({
      ...definition,
      description: undefined,
    })
    expect(EventType1.description).toEqual('')
  })
  it('EventType.fromSerializedPayload is a function', () => {
    const EventType = DomainEvent(definition)
    expect(typeof EventType.fromSerializedPayload).toBe('function')
  })
  it('EventType is recognized as `instance of` DomainEvent', () => {
    const EventType = DomainEvent(definition)
    expect(EventType instanceof DomainEvent).toBe(true)
  })
})
