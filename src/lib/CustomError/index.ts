import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorType,
  CustomErrorTypeDefinition,
} from './types'
import validateDefinition from './validateDefinition'

export function CustomError<
  Name extends CustomErrorName,
  Data extends CustomErrorData = void
>(definition: CustomErrorTypeDefinition<Name>): CustomErrorType<Name, Data> {
  try {
    // tslint:disable no-expression-statement
    validateDefinition(definition)
    // tslint:enable
  } catch (e) {
    throw new TypeError(e.message)
  }

  const { name: errorName } = definition
  const ErrorType = (message?: string, data?: Data) => {
    const error = new Error(message || errorName)
    return Object.defineProperties(error, {
      __factory: { value: ErrorType },
      name: { value: errorName },
      stack: {
        value:
          error.stack && parseErrorStack(errorName, error.stack.split('\n')),
      },
      ...(data !== undefined ? { data: { value: data } } : {}),
    })
  }

  return Object.defineProperties(ErrorType, {
    name: { value: errorName },
    [Symbol.hasInstance]: {
      value: (e: any) => !!e && e.__factory && e.__factory === ErrorType,
    },
  })
}

export const parseErrorStack = (
  errorName: string,
  stack: ReadonlyArray<string>
): string => {
  const [first, ...rest] = stack.filter((_, i) => i !== 1)
  return [`${errorName}${first.slice(5)}`, ...rest].join('\n')
}
