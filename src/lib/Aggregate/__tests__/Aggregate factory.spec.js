import 'jest'

import { Aggregate } from '../../../../dist/main/lib'

describe('Aggregate factory', () => {
  it('Aggregate is a function', () => {
    expect(typeof Aggregate).toBe('function')
  })
})
