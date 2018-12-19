import 'jest'

import { Repository } from '../../../../dist/main/lib'

describe('The Repository factory', () => {
  it('Repository is a function', () => {
    expect(typeof Repository).toBe('function')
  })
})
