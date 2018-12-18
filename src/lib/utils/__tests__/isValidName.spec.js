import 'jest'

import { isValidName, validNameDescription } from '../../../../dist/main/lib'

describe('isValidName(x)', () => {
  it(`return TRUE if x is a ${validNameDescription}, false otherwise`, () => {
    expect(isValidName('a')).toBe(true)
    expect(isValidName('aaaaaaa')).toBe(true)
    expect(isValidName('aaa_aaaa')).toBe(true)
    expect(isValidName('a1_____a')).toBe(true)

    expect(isValidName([])).toBe(false)
    expect(isValidName({})).toBe(false)
    expect(isValidName(3)).toBe(false)
    expect(isValidName(NaN)).toBe(false)
    expect(isValidName('1')).toBe(false)
    expect(isValidName('1a')).toBe(false)
    expect(isValidName('one two')).toBe(false)
    expect(isValidName('_A')).toBe(false)
  })
})
