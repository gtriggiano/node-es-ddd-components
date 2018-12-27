import 'jest'

import { CustomError, validNameDescription } from 'lib-export'

describe('The CustomError() factory', () => {
  it('is a function', () => {
    expect(typeof CustomError).toBe('function')
  })
})

describe('CustomError(definition) throws `TypeError` when:', () => {
  it('definition is not an object', () => {
    expect(() => CustomError()).toThrowError(TypeError)
    expect(() => CustomError('')).toThrowError(TypeError)
    expect(() => CustomError(2)).toThrowError(TypeError)
  })
  it(`definition.name is not a ${validNameDescription}`, () => {
    expect(() => CustomError({ name: '0_dsdsa' })).toThrowError(TypeError)
    expect(() => CustomError({ name: 'a _dsa' })).toThrowError(TypeError)
    expect(() => CustomError({ name: 'a_dsa' })).not.toThrow()
    expect(() => CustomError({ name: 'vaLidName' })).not.toThrow()
  })
})

describe('CustomError(definition) returns an ErrorType() factory', () => {
  const definition = { name: 'BadThingError' }

  it('ErrorType is a function', () => {
    const ErrorType = CustomError(definition)
    expect(typeof ErrorType).toBe('function')
  })
  it('ErrorType.name === definition.name', () => {
    const ErrorType = CustomError(definition)
    expect(ErrorType.name).toBe(definition.name)
  })
  it('ErrorType is an error constructor', () => {
    const ErrorType = CustomError(definition)
    expect(new ErrorType() instanceof Error).toBe(true)
  })
  it('ErrorType can be invoked without `new`', () => {
    const ErrorType = CustomError(definition)
    expect(ErrorType() instanceof Error).toBe(true)
  })
})
