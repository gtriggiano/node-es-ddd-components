import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorType,
} from '../CustomError/types'
import {
  AggregateErrorDictionary,
  AggregateErrorInterface,
} from './errors.types'

export interface ErrorInterfaceConfiguration<
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>
> {
  readonly raisableErrors: ReadonlyArray<ErrorType>
}

export default function ErrorInterface<
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<ErrorType>
>(
  config: ErrorInterfaceConfiguration<ErrorType>
): AggregateErrorInterface<ErrorType, ErrorDictionary> {
  const { raisableErrors } = config

  return raisableErrors.reduce(
    (errorInterface, EType) =>
      Object.defineProperty(errorInterface, EType.name, {
        value: EType,
      }),
    {}
  ) as AggregateErrorInterface<ErrorType, ErrorDictionary>
}
