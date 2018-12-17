import 'jest'

import { CustomError } from '../../../../dist/main/lib'

describe('CustomErrorType factory. CustomErrorType = CustomError(definition)', () => {
  const definition = { name: 'BadThingError' }

  it('CustomErrorType.name === definition.name', () => {
    const CustomErrorType = CustomError(definition)
    expect(CustomErrorType.name).toBe(definition.name)
  })
  it('CustomErrorType is an error constructor', () => {
    const CustomErrorType = CustomError(definition)
    expect(new CustomErrorType() instanceof Error).toBe(true)
  })
  it('CustomErrorType can be invoked without `new`', () => {
    const CustomErrorType = CustomError(definition)
    expect(CustomErrorType() instanceof Error).toBe(true)
  })
})
