import 'jest'

import { isValidName, validNameDescription } from '../../../../dist/main/lib'

describe('isValidName(x)', () => {
  it(`return TRUE if x is a ${validNameDescription}`, () => {
    expect(isValidName('as')).toBe(true)
  })
})
