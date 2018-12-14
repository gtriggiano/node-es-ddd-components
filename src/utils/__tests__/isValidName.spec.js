require('jest')

const { isValidName, validNameDescription } = require('../../../dist/main')

describe('isValidName(x)', () => {
  it(`return TRUE if x is a ${validNameDescription}`, () => {
    expect(isValidName('as')).toBe(true)
  })
})