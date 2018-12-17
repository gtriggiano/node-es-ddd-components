import { AggregateState, MapDiscriminatedUnion } from './types'

/**
 * The name of an aggregate query
 */
export type AggregateQueryName = string

/**
 * The input type of an aggregate query
 */
export type AggregateQueryInput = any

/**
 * The output type of an aggregate query
 */
export type AggregateQueryOutput = any

/**
 * The implementation of an aggregate query
 */
export type AggregateQueryImplementation<
  State extends AggregateState,
  Input extends AggregateQueryInput,
  Output extends AggregateQueryOutput
> = (state: State, input: Input) => Output

export type QueryImplementationInput<
  QueryImplementation
> = QueryImplementation extends (state: any, input: infer O) => any ? O : never

export type QueryImplementationOutput<
  QueryImplementation
> = QueryImplementation extends (state: any, input: any) => infer O ? O : never

/**
 * The definition of an aggregate query
 */
export interface AggregateQueryDefinition<
  Name extends AggregateQueryName,
  State extends AggregateState,
  Input extends AggregateQueryInput,
  Output extends AggregateQueryOutput
> {
  readonly name: Name
  readonly description?: string
  readonly handler: AggregateQueryImplementation<State, Input, Output>
}

/**
 * A generic method of the aggregate query interface
 */
export type AggregateQueryInterfaceMethod<
  State extends AggregateState,
  QueryImplementation extends AggregateQueryImplementation<
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >
> = QueryImplementationInput<QueryImplementation> extends void
  ? (
      input?: QueryImplementationInput<QueryImplementation>
    ) => QueryImplementationOutput<QueryImplementation>
  : (
      input: QueryImplementationInput<QueryImplementation>
    ) => QueryImplementationOutput<QueryImplementation>

export type AggregateQueryDictionary<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >
> = MapDiscriminatedUnion<Query, 'name'>

/**
 * A generic aggregate query interface
 */
export type AggregateQueryInterface<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  QueryDictionary extends AggregateQueryDictionary<State, Query>
> = {
  [K in keyof QueryDictionary]: AggregateQueryInterfaceMethod<
    State,
    QueryDictionary[K]['handler']
  >
}
