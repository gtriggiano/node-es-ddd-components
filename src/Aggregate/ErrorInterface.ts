import {
  AggregateErrorConstructor,
  AggregateErrorData,
  AggregateErrorName,
} from '../AggregateError/types'
import {
  AggregateErrorDictionary,
  AggregateErrorInterface,
} from './errors.types'

export interface ErrorInterfaceConfiguration<
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>
> {
  readonly raisableErrors: ReadonlyArray<E>
}

export default function ErrorInterface<
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<E>
>(
  config: ErrorInterfaceConfiguration<E>
): AggregateErrorInterface<E, ErrorDictionary> {
  const { raisableErrors } = config

  return raisableErrors.reduce(
    (errorInterface, Err) => ({
      ...errorInterface,
      [Err.name]: Err,
    }),
    {}
  ) as AggregateErrorInterface<E, ErrorDictionary>
}
