import 'jest'

import { DomainEvent } from '../../../../dist/main/lib'

import { getEventTypeDefinition as getDefinition } from './mocks'

describe('An `EventType` factory. EventType = DomainEvent(definition)', () => {
  it('EventType is a function', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    expect(typeof EventType).toBe('function')
  })
  it('EventType.name === definition.name', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    expect(EventType.name).toEqual(definition.name)
  })
  it('EventType.description === definition.description || ``', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    expect(EventType.description).toBe(definition.description)

    const EventType1 = DomainEvent({
      ...definition,
      description: undefined,
    })
    expect(EventType1.description).toEqual('')
  })
  it('EventType.fromSerializedPayload is a function', () => {
    const definition = getDefinition()
    const EventType = DomainEvent(definition)
    expect(typeof EventType.fromSerializedPayload).toBe('function')
  })
})
