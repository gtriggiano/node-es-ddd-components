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

describe('The DomainEvent factory. DomainEvent(definition)', () => {
  it('is a function', () => {
    expect(typeof DomainEvent).toBe('function')
  })
  it('return a function', () => {
    const ret = DomainEvent(definition)
    expect(typeof ret).toBe('function')
  })
})
