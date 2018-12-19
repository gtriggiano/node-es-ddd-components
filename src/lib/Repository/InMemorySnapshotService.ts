import { AggregateSnapshot } from '../Aggregate/types'

import { SnapshotService } from './types'

interface Storage {
  // tslint:disable readonly-keyword
  [key: string]: AggregateSnapshot | undefined
  // tslint:enable
}
export const InMemorySnapshotService = (): SnapshotService => {
  const snapshots: Storage = {}

  const loadAggregateSnapshot = (key: string) => Promise.resolve(snapshots[key])

  const saveAggregateSnapshot = (key: string, snapshot: AggregateSnapshot) => {
    // tslint:disable no-expression-statement no-object-mutation
    snapshots[key] = snapshot
    // tslint:enable

    return Promise.resolve()
  }

  return {
    loadAggregateSnapshot,
    saveAggregateSnapshot,
  }
}
