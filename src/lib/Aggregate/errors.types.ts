import {
  CustomErrorData,
  CustomErrorName,
  CustomErrorTypeFactory,
} from '../CustomError/types'
import { MapDiscriminatedUnion } from './types'

export type ErrorConstructorData<Ctor> = Ctor extends (
  message: string,
  data: infer Data
) => Error
  ? Data
  : never

export type AggregateErrorDictionary<
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >
> = MapDiscriminatedUnion<ErrorTypeFactory, 'name'>

export type AggregateErrorInterface<
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  ErrorDictionary extends AggregateErrorDictionary<ErrorTypeFactory>
> = {
  [K in keyof ErrorDictionary]: CustomErrorTypeFactory<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}

export type AggregateCommandErrorInterface<
  ErrorTypeFactory extends CustomErrorTypeFactory<
    CustomErrorName,
    CustomErrorData
  >,
  ErrorDictionary extends AggregateErrorDictionary<ErrorTypeFactory>,
  RaisableErrorName extends keyof ErrorDictionary
> = {
  [K in RaisableErrorName]: CustomErrorTypeFactory<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}
