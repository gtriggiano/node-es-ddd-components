import 'jest'

import { InMemoryEventStore } from 'lib-export'

describe('The InMemoryEventStore factory', () => {
  it('is a function', () => {
    expect(typeof InMemoryEventStore).toBe('function')
  })
})

describe('InMemoryEventStore() return an eventStore instance', () => {
  it('eventStore.getEventsOfAggregate is a function', () => {
    const es = InMemoryEventStore()
    expect(typeof es.getEventsOfAggregate).toBe('function')
  })
  it('eventStore.appendEventsToAggregates is a function', () => {
    const es = InMemoryEventStore()
    expect(typeof es.appendEventsToAggregates).toBe('function')
  })
})
