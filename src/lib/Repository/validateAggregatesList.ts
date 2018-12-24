import assert from 'assert'
import { every, uniq } from 'lodash'

import { Aggregate } from '../Aggregate'
import {
  AggregateIdentity,
  AggregateTypeName,
  BoundedContext,
} from '../Aggregate/types'

const toSerial = ({
  context,
  type,
  identity,
}: {
  readonly context: BoundedContext
  readonly type: AggregateTypeName
  readonly identity: AggregateIdentity
}) => `${context}:${type}${identity ? `(${identity})` : ''}`

export default function validateAggregatesList(aggregates: any): void {
  assert(Array.isArray(aggregates), `aggregates MUST be an array`)
  assert(
    every(
      aggregates,
      aggregate =>
        aggregate && aggregate.New && aggregate.New instanceof Aggregate
    ),
    `every item should be an aggregate instance`
  )
  assert(
    uniq(aggregates.map(toSerial)).length === aggregates.length,
    'aggregates should be unique by context, type, identity'
  )
}
