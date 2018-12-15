/**
 * The name of a custom error type
 */
export type CustomErrorName = string

/**
 * The `data` payload that is exposed
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
 * An instance of an error raised by an aggregate
 */
export type CustomErrorInstance<
  Name extends CustomErrorName,
  Data extends CustomErrorData
> = NamedError<Name> & ErrorWithData<Data>

/**
 * An aggregate error definition
 */
export interface CustomErrorTypeDefinition<Name extends CustomErrorName> {
  readonly name: Name
}

/**
 * A constructor function which return
 * an instance of an aggregate error
 */
export type CustomErrorType<
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
