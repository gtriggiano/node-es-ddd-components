import 'jest'

import { CustomError } from '../../../../dist/main/lib'

describe('error = ErrorType([message] [, data]) or error = new ErrorType([message] [, data])', () => {
  const definition = { name: 'BadThingError' }

  it('error is an instance of Error', () => {
    const ErrorType = CustomError(definition)
    expect(ErrorType() instanceof Error).toBe(true)
    expect(new ErrorType() instanceof Error).toBe(true)
  })
  it('error.name === ErrorType.name', () => {
    const ErrorType = CustomError(definition)
    const error = ErrorType()
    expect(error.name).toBe(ErrorType.name)
  })
  it('error.message === message || ErrorType.name', () => {
    const ErrorType = CustomError(definition)
    const error = ErrorType()
    expect(error.message).toBe(ErrorType.name)

    const aMessage = 'a message'
    const errorWithMessage = ErrorType(aMessage)
    expect(errorWithMessage.message).toBe(aMessage)
  })
  it('error.data === data', () => {
    const ErrorType = CustomError(definition)
    expect(ErrorType().data).toBe(undefined)
    expect(ErrorType('a', 'x').data).toBe('x')
    const payload = {}
    expect(ErrorType('a', payload).data).toBe(payload)
  })
  it('customErrorType.stack is populated', () => {
    const CustomErrorType = CustomError(definition)
    const customErrorType = CustomErrorType()
    expect(typeof customErrorType.stack).toEqual('string')
  })
  it('CustomErrorType.name shows as error name in the customErrorType.stack first line', () => {
    const CustomErrorType = CustomError(definition)
    const customErrorType = CustomErrorType()
    const firstLine = customErrorType.stack.split('\n')[0]
    expect(firstLine.indexOf(CustomErrorType.name)).toBe(0)
  })
  it('the second line of the stack refers to the file where you invoke CustomErrorType()', () => {
    const CustomErrorType = CustomError(definition)
    const customErrorType = CustomErrorType()
    const secondLine = customErrorType.stack.split('\n')[1]
    const filePathSegment = secondLine.split('(')[1]

    expect(filePathSegment.indexOf(__filename)).toBe(0)
  })
})
