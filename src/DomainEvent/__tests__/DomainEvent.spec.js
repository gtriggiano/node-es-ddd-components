require('jest')

const { DomainEvent } = require('../../../dist/main')

const getDefinition = () => ({
  name: 'SomethingHappened',
  description: 'a description',
  reducer: (state, event) => ({
    ...state,
    propValue: event.data.prop,
  }),
})

describe('DomainEvent(definition)', () => {
  it('is a function', () => {
    expect(typeof DomainEvent).toBe('function')
  })

  describe('EventConstructor = DomainEvent(definition', () => {
    it('is a function', () => {
      const definition = getDefinition()
      const EventConstructor = DomainEvent(definition)
      expect(typeof EventConstructor).toBe('function')
    })
    it('EventConstructor.name === definition.name', () => {
      const definition = getDefinition()
      const EventConstructor = DomainEvent(definition)
      expect(EventConstructor.name).toEqual(definition.name)
    })
    it('EventConstructor.description === definition.description', () => {
      const definition = getDefinition()
      const EventConstructor = DomainEvent(definition)
      expect(EventConstructor.description).toEqual(definition.description)
    })
    it('EventConstructor.fromSerializedPayload is a function', () => {
      const definition = getDefinition()
      const EventConstructor = DomainEvent(definition)
      expect(typeof EventConstructor.fromSerializedPayload).toBe('function')
    })

    describe('event = EventConstructor(payload)', () => {
      it('event.name === EventConstructor.name', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType({ prop: 'value' })
        expect(event.name).toEqual(definition.name)
      })
      it('event.data equals payload', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const payload = { prop: 'value' }
        const event = EventType(payload)
        expect(event.data).toEqual(payload)
      })
      it('event.getSerializedPayload() returns the serialization of event.data', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType({ prop: 'test' })
        expect(event.getSerializedPayload()).toEqual(`{"prop":"test"}`)
      })
      it('event.applyToState(state) returns definition.reducer(state, event)', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType({ prop: 'my value' })

        const state = event.applyToState({})
        expect(state).toEqual({ propValue: 'my value' })
      })
    })

    describe('event = EventConstructor.fromSerializedPayload(serializedPayload)', () => {
      it('event.name === EventConstructor.name', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType.fromSerializedPayload('{ "prop": "value" }')
        expect(event.name).toEqual(definition.name)
      })
      it('event.data equals deserialized payload', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType.fromSerializedPayload('{ "prop": "value" }')
        expect(event.data).toEqual({ prop: 'value' })
      })
      it('event.getSerializedPayload() returns the serialization of event.data', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType.fromSerializedPayload('{ "prop": "value" }')
        expect(event.getSerializedPayload()).toEqual(`{"prop":"value"}`)
      })
      it('event.applyToState(state) returns definition.reducer(state, event)', () => {
        const definition = getDefinition()
        const EventType = DomainEvent(definition)
        const event = EventType.fromSerializedPayload('{ "prop": "value" }')

        const state = event.applyToState({})
        expect(state).toEqual({ propValue: 'value' })
      })
    })
  })
})
