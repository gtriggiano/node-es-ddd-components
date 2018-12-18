import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorType,
} from '../CustomError/types'
import { MapDiscriminatedUnion } from './types'

export type ErrorConstructorData<Ctor> = Ctor extends (
  message: string,
  data: infer Data
) => Error
  ? Data
  : never

export type AggregateErrorDictionary<
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>
> = MapDiscriminatedUnion<ErrorType, 'name'>

export type AggregateErrorInterface<
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<ErrorType>
> = {
  [K in keyof ErrorDictionary]: CustomErrorType<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}

export type AggregateCommandErrorInterface<
  ErrorType extends CustomErrorType<CustomErrorName, CustomErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<ErrorType>,
  RaisableErrorName extends keyof ErrorDictionary
> = {
  [K in RaisableErrorName]: CustomErrorType<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}
