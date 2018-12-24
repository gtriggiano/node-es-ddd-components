import 'jest'

import { padLeftWithZeroes } from 'lib-export'

describe('padLeftWithZeroes(s: string, minLength: number): string', () => {
  it('is a function', () => {
    expect(typeof padLeftWithZeroes).toBe('function')
  })
  it('returns a string of at least `minLength` chars', () => {
    const padded33 = padLeftWithZeroes('', 33)
    expect(padded33.length).toBe(33)
    expect(padLeftWithZeroes(padded33, 10).length).toBe(33)
  })
  it("pads left `s` with 0s to reach `minLength`. padLeftWithZeroes('hello', 10) === `00000hello`", () => {
    const s = 'hello'
    expect(padLeftWithZeroes(s, 10)).toBe('00000hello')
  })
})
