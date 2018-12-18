import 'jest'

import { CustomError, validNameDescription } from '../../../../dist/main/lib'

const definition = { name: 'CustomErrorType' }

describe('customErrorType instance. customErrorType = CustomErrorType(message [, data])', () => {
  it('customErrorType.name === CustomErrorType.name', () => {
    const CustomErrorType = CustomError(definition)
    const customErrorType = CustomErrorType()
    expect(customErrorType.name).toBe(CustomErrorType.name)
  })
  it('customErrorType.message === message || CustomErrorType.name', () => {
    const CustomErrorType = CustomError(definition)

    const customErrorType1 = CustomErrorType()
    expect(customErrorType1.message).toBe(CustomErrorType.name)

    const customErrorType2 = CustomErrorType('a message')
    expect(customErrorType2.message).toBe('a message')
  })
  it('customErrorType.data === data', () => {
    const CustomErrorType = CustomError(definition)

    const customErrorType1 = CustomErrorType('a message')
    expect(customErrorType1.data).toBe(undefined)

    const data = {}
    const customErrorType2 = CustomErrorType('a message', data)
    expect(customErrorType2.data).toBe(data)
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
