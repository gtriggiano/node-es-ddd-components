import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import {
  AggregateErrorDictionary,
  AggregateErrorInterface,
} from './errors.types'

export interface ErrorInterfaceConfiguration<
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >
> {
  readonly raisableErrors: ReadonlyArray<ErrorTypeFactory>
}

export default function ErrorInterface<
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  ErrorDictionary extends AggregateErrorDictionary<ErrorTypeFactory>
>(
  config: ErrorInterfaceConfiguration<ErrorTypeFactory>
): AggregateErrorInterface<ErrorTypeFactory, ErrorDictionary> {
  const { raisableErrors } = config

  return raisableErrors.reduce(
    (errorInterface, EType) =>
      Object.defineProperty(errorInterface, EType.name, {
        value: EType,
      }),
    {}
  ) as AggregateErrorInterface<ErrorTypeFactory, ErrorDictionary>
}
