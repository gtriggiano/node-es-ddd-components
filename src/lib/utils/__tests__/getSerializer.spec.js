import 'jest'

import { getSerializer, SerializationError } from '../../../../dist/main/lib'

describe('getSerializer(serializer?: function, errorMessage?: string)', () => {
  it('is a function', () => {
    expect(typeof getSerializer).toBe('function')
  })

  describe('const serialize = getSerializer(JSON.stringify)', () => {
    it('serialize is a function', () => {
      const serialize = getSerializer(JSON.stringify)
      const actual = typeof serialize
      const expected = 'function'
      expect(actual).toEqual(expected)
    })
    it('serialize returns the result of serializer', () => {
      const serialize = getSerializer(JSON.stringify)
      const actual = serialize({ a: 'value', b: 1 })
      const expected = `{"a":"value","b":1}`
      expect(actual).toEqual(expected)
    })
    it('serializer defaults to JSON.stringify', () => {
      const serialize = getSerializer()
      const actual = serialize({ a: 'value', b: 1 })
      const expected = `{"a":"value","b":1}`
      expect(actual).toEqual(expected)
    })
    it('if serializer() throws the original error is encapsulated in SerializationError.data.originalError', () => {
      const serialize = getSerializer(JSON.stringify)

      const a = {}
      const b = { a }
      a.b = b

      expect(() => serialize(a)).toThrow(SerializationError)

      try {
        serialize(a)
      } catch (serializationError) {
        expect(serializationError instanceof SerializationError).toBe(true)
        expect(serializationError.data.originalError instanceof Error).toBe(
          true
        )
      }
    })
    it('SerializationError.message === errorMessage ? errorMessage : SerializationError.data.originalError.message', () => {
      const serialize = getSerializer(JSON.stringify, 'a default message')

      const a = {}
      const b = { a }
      a.b = b
      try {
        serialize(a)
      } catch (serializationError) {
        expect(serializationError.message === 'a default message').toBe(true)
      }

      const serialize2 = getSerializer(JSON.stringify)
      try {
        serialize2(a)
      } catch (serializationError) {
        expect(
          serializationError.message ===
            serializationError.data.originalError.message
        ).toBe(true)
      }
    })
  })

  describe('const serialize = getSerializer(null, `a message`)', () => {
    it('if serialize() throws the error message is `a message`', () => {
      const serialize = getSerializer(null, 'a message')
      const a = {}
      const b = { a }
      a.b = b
      try {
        serialize(a)
      } catch (serializationError) {
        expect(serializationError.message).toBe('a message')
      }
    })
  })
})
