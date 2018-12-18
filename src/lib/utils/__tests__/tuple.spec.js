import 'jest'

import { tuple } from '../../../../dist/main/lib'

describe('tuple(...args: any[])', () => {
  it('returns the provided arguments as an array', () => {
    const out = tuple(1, 'xxx', false, {})
    expect(out).toEqual([1, 'xxx', false, {}])
  })
})
