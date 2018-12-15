import 'jest'

import { DomainEvent } from '../../../../dist/main/lib'

import { getEventTypeDefinition as getDefinition } from './mocks'

describe('DomainEvent(definition)', () => {
  it('is a function', () => {
    expect(typeof DomainEvent).toBe('function')
  })
  it('return a function', () => {
    const ret = DomainEvent(getDefinition())
    expect(typeof ret).toBe('function')
  })
})
