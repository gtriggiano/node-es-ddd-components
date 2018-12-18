import {
  AggregateQueryDefinition,
  AggregateQueryDictionary,
  AggregateQueryInput,
  AggregateQueryInterface,
  AggregateQueryName,
  AggregateQueryOutput,
} from './queries.types'
import { AggregateState } from './types'

export interface QueryInterfaceConfiguration<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >
> {
  readonly getState: () => State
  readonly availableQueries: ReadonlyArray<Query>
}

export default function QueryInterface<
  State extends AggregateState,
  Query extends AggregateQueryDefinition<
    AggregateQueryName,
    State,
    AggregateQueryInput,
    AggregateQueryOutput
  >,
  QueryDictionary extends AggregateQueryDictionary<State, Query>
>(
  config: QueryInterfaceConfiguration<State, Query>
): AggregateQueryInterface<State, Query, QueryDictionary> {
  const { getState, availableQueries } = config

  return availableQueries.reduce(
    (queryInterface, query) =>
      Object.defineProperty(queryInterface, query.name, {
        enumerable: true,
        value: Object.defineProperty(
          (input?: any) => query.handler(getState(), input),
          'name',
          { value: query.name }
        ),
      }),
    {}
  ) as AggregateQueryInterface<State, Query, QueryDictionary>
}
