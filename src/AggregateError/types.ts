/**
 * The name of an aggregate error
 */
export type AggregateErrorName = string

/**
 * The `data` payload that could be exposed
 * by an aggregate error
 */
export type AggregateErrorData = any

export type NamedError<Name extends AggregateErrorName> = Error & {
  readonly name: Name
}

export type ErrorWithData<Data extends AggregateErrorData> = Error & {
  // tslint:disable readonly-keyword
  data: Data
  // tslint:enable
}

/**
 * An instance of an error raised by an aggregate
 */
export type AggregateErrorInstance<
  Name extends AggregateErrorName,
  Data extends AggregateErrorData
> = NamedError<Name> & ErrorWithData<Data>

/**
 * An aggregate error definition
 */
export interface AggregateErrorDefinition<Name extends AggregateErrorName> {
  readonly name: Name
}

/**
 * A constructor function which return
 * an instance of an aggregate error
 */
export type AggregateErrorConstructor<
  Name extends AggregateErrorName,
  Data extends AggregateErrorData
> = Data extends void
  ? {
      (message?: string, data?: void): AggregateErrorInstance<Name, void>
      readonly name: Name
    }
  : {
      (message: string | undefined, data: Data): AggregateErrorInstance<
        Name,
        Data
      >
      readonly name: Name
    }
