import {
  AggregateErrorConstructor,
  AggregateErrorData,
  AggregateErrorDefinition,
  AggregateErrorName,
} from './types'
import validateDefinition from './validateDefinition'

export function AggregateError<
  Name extends AggregateErrorName,
  Data extends AggregateErrorData = void
>(
  definition: AggregateErrorDefinition<Name>
): AggregateErrorConstructor<Name, Data> {
  // tslint:disable no-expression-statement
  try {
    validateDefinition(definition)
  } catch (e) {
    throw new TypeError(e.message)
  }
  // tslint:enable

  const { name: errorName } = definition
  const ErrorCtor = (message?: string, data?: Data) => {
    const error = new Error(message || errorName)
    return Object.defineProperties(error, {
      __aeCtor: { value: ErrorCtor },
      name: { value: errorName },
      stack: {
        value:
          error.stack && parseErrorStack(errorName, error.stack.split('\n')),
      },
      ...(data !== undefined ? { data: { value: data } } : {}),
    })
  }

  return Object.defineProperties(ErrorCtor, {
    name: { value: errorName },
    [Symbol.hasInstance]: {
      value: (e: any) => e && e.__aeCtor && e.__aeCtor === ErrorCtor,
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
