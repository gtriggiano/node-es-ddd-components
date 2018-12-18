import 'jest'

import { Aggregate } from '../../../../dist/main/lib'

describe('The Aggregate factory', () => {
  it('Aggregate is a function', () => {
    expect(typeof Aggregate).toBe('function')
  })
})
