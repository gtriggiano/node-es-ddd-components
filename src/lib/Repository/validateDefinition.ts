import assert from 'assert'
import { isFunction, isObject } from 'lodash'

export default function validateDefinition(definition: any): void {
  assert(isObject(definition), `definition MUST be an object`)

  const { eventStore, snapshotService } = definition

  assert(isObject(eventStore), `definition.eventStore MUST be an object`)
  assert(
    isFunction(eventStore.getEventsOfAggregate),
    `definition.eventStore.getEventsOfAggregate MUST be a function`
  )
  assert(
    isFunction(eventStore.appendEventsToAggregates),
    `definition.eventStore.appendEventsToAggregates MUST be a function`
  )

  assert(
    !snapshotService || isObject(snapshotService),
    `definition.snapshotService MUST be either falst or an object`
  )

  // tslint:disable no-if-statement
  if (snapshotService) {
    assert(
      isFunction(snapshotService.loadAggregateSnapshot),
      `definition.snapshotService.loadAggregateSnapshot MUST be a function`
    )
    assert(
      isFunction(snapshotService.saveAggregateSnapshot),
      `definition.snapshotService.saveAggregateSnapshot MUST be a function`
    )
  }
}
