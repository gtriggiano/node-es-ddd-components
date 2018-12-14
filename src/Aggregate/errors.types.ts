import {
  AggregateErrorConstructor,
  AggregateErrorData,
  AggregateErrorName,
} from '../AggregateError/types'
import { MapDiscriminatedUnion } from './types'

export type ErrorConstructorData<Ctor> = Ctor extends (
  message: string,
  data: infer Data
) => Error
  ? Data
  : never

export type AggregateErrorDictionary<
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>
> = MapDiscriminatedUnion<E, 'name'>

export type AggregateErrorInterface<
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<E>
> = {
  [K in keyof ErrorDictionary]: AggregateErrorConstructor<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}

export type AggregateCommandErrorInterface<
  E extends AggregateErrorConstructor<AggregateErrorName, AggregateErrorData>,
  ErrorDictionary extends AggregateErrorDictionary<E>,
  RaisableErrorName extends keyof ErrorDictionary
> = {
  [K in RaisableErrorName]: AggregateErrorConstructor<
    ErrorDictionary[K]['name'],
    ErrorConstructorData<ErrorDictionary[K]>
  >
}
