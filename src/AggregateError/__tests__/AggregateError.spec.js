require('jest')

const { AggregateError, validNameDescription } = require('../../../dist/main')

describe('AggregateError(definition): Function util', () => {
  it(`throws TypeError if 'description.name' is not a ${validNameDescription}`, () => {
    expect(() => AggregateError()).toThrowError(TypeError)
    expect(() => AggregateError('')).toThrowError(TypeError)
    expect(() => AggregateError(2)).toThrowError(TypeError)
    expect(() => AggregateError({ name: '0_dsdsa' })).toThrowError(TypeError)
    expect(() => AggregateError({ name: 'a _dsa' })).toThrowError(TypeError)
    expect(() => AggregateError({ name: 'vaLidName' })).not.toThrow()
  })

  describe('BadThingError = AggregateError({name: `BadThingError`})', () => {
    const BadThingError = AggregateError({ name: 'BadThingError' })

    it('BadThingError.name === `BadThingError`', () => {
      expect(BadThingError.name).toEqual('BadThingError')
    })
    it('BadThingError is an error constructor', () => {
      expect(new BadThingError() instanceof Error).toBe(true)
    })
    it('BadThingError can be invoked without `new`', () => {
      expect(BadThingError() instanceof Error).toBe(true)
    })

    describe('error = BadThingError(message [, data])', () => {
      it('error.name === BadThingError', () => {
        const error = BadThingError()
        expect(error.name).toEqual('BadThingError')
      })
      it('error.message === message || BadThingError', () => {
        const error1 = BadThingError()
        const error2 = BadThingError('a message')
        expect(error1.message).toBe('BadThingError')
        expect(error2.message).toBe('a message')
      })
      it('error.data === data', () => {
        const error1 = BadThingError('a message')
        const data = {}
        const error2 = BadThingError('a message', data)
        expect(error1.data).toBe(undefined)
        expect(error2.data).toBe(data)
      })
      it('error.stack is populated', () => {
        const error = BadThingError()
        expect(typeof error.stack).toEqual('string')
      })
      it('BadThingError shows as error name in the error.stack first line', () => {
        const error = BadThingError()
        const firstLine = error.stack.split('\n')[0]
        expect(firstLine.indexOf('BadThingError: ')).toBe(0)
      })
      it('the second line of the stack refers to the file where you invoke BadThingError()', () => {
        const error = BadThingError()
        const secondLine = error.stack.split('\n')[1]
        const filePathSegment = secondLine.split('(')[1]

        expect(filePathSegment.indexOf(__filename)).toBe(0)
      })
    })
  })
})
