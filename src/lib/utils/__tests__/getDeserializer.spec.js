import 'jest'

import {
  getDeserializer,
  DeserializationError,
} from '../../../../dist/main/lib'

describe('getDeserializer(deserializer?: function, errorMessage?: string)', () => {
  it('is a function', () => {
    expect(typeof getDeserializer).toBe('function')
  })

  describe('const deserialize = getDeserializer(JSON.parse)', () => {
    it('deserialize is a function', () => {
      const deserialize = getDeserializer()
      expect(typeof deserialize).toEqual('function')
    })
    it('deserialize returns the result of deserializer', () => {
      const deserialize = getDeserializer(JSON.parse)
      const actual = deserialize(`{"a": "value", "b": 1}`)
      const expected = { a: 'value', b: 1 }
      expect(actual).toEqual(expected)
    })
    it('deserialize defaults to JSON.parse', () => {
      const deserialize = getDeserializer()
      const actual = deserialize(`{"a":"value","b":1}`)
      const expected = { a: 'value', b: 1 }
      expect(actual).toEqual(expected)
    })
    it('if deserialize() throws, the error is encapsulated in DeserializationError.data.originalError', () => {
      const deserialize = getDeserializer()
      expect(() => deserialize(`"4: "invalid`)).toThrowError(
        DeserializationError
      )

      try {
        deserialize(`"4: "invalid`)
      } catch (deserializationError) {
        expect(deserializationError.data.originalError instanceof Error).toBe(
          true
        )
      }
    })
    it('DeserializationError.message === errorMessage ? errorMessage :  DeserializationError.data.originalError.message', () => {
      const deserialize = getDeserializer(JSON.parse, 'a default message')

      try {
        deserialize(`"4: "invalid`)
      } catch (deserializationError) {
        expect(deserializationError.message === 'a default message').toBe(true)
      }

      const deserialize2 = getDeserializer()
      try {
        deserialize2(`"4: "invalid`)
      } catch (deserializationError) {
        expect(
          deserializationError.message ===
            deserializationError.data.originalError.message
        ).toBe(true)
      }
    })
  })

  describe('const deserialize = getDeserializer(null, `a message`)', () => {
    it('if deserializer() throws the error message is `a message`', () => {
      const deserialize = getDeserializer(null, 'a message')
      try {
        deserialize(`"4: "invalid`)
      } catch (deserializationError) {
        expect(deserializationError.message).toBe('a message')
      }
    })
  })
})
