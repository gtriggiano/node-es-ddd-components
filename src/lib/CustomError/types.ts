/**
 * The name of a custom error type
 */
export type CustomErrorName = string

/**
 * The `data` payload that could be exposed
 * by a custom error instance
 */
export type CustomErrorData = any

export type NamedError<Name extends CustomErrorName> = Error & {
  readonly name: Name
}

export type ErrorWithData<Data extends CustomErrorData> = Error & {
  // tslint:disable readonly-keyword
  data: Data
  // tslint:enable
}

/**
 * An instance of a custom error type
 */
export type CustomErrorInstance<
  Name extends CustomErrorName,
  Data extends CustomErrorData
> = NamedError<Name> & ErrorWithData<Data>

/**
 * An object describing a custom error type
 */
export interface CustomErrorTypeDefinition<Name extends CustomErrorName> {
  /**
   * The name of the custom error type
   */
  readonly name: Name
}

/**
 * A factory to generate an instance of a custom error type
 * @param message The error message
 * @param data A paylod to expose through `error.data`
 */
export type CustomErrorTypeFactory<
  Name extends CustomErrorName,
  Data extends CustomErrorData
> = Data extends void
  ? {
      (message?: string, data?: void): CustomErrorInstance<Name, void>
      readonly name: Name
    }
  : {
      (message: string | undefined, data: Data): CustomErrorInstance<Name, Data>
      readonly name: Name
    }
