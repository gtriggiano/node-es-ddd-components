import 'jest'

import { CustomError, validNameDescription } from '../../../../dist/main/lib'

describe('CustomError definition validation. CustomError(definition) throws when:', () => {
  it(`description.name is not a ${validNameDescription}`, () => {
    expect(() => CustomError()).toThrowError(TypeError)
    expect(() => CustomError('')).toThrowError(TypeError)
    expect(() => CustomError(2)).toThrowError(TypeError)
    expect(() => CustomError({ name: '0_dsdsa' })).toThrowError(TypeError)
    expect(() => CustomError({ name: 'a _dsa' })).toThrowError(TypeError)
    expect(() => CustomError({ name: 'vaLidName' })).not.toThrow()
  })
})
