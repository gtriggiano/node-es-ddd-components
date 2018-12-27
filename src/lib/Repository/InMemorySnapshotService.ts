import { AggregateSnapshot } from '../Aggregate/types'

import { SnapshotService } from './types'

interface Storage {
  // tslint:disable readonly-keyword
  [key: string]: AggregateSnapshot | undefined
  // tslint:enable
}
export const InMemorySnapshotService = (): SnapshotService => {
  const snapshots: Storage = {}

  const loadAggregateSnapshot = async (key: string) => snapshots[key]

  const saveAggregateSnapshot = async (
    key: string,
    snapshot: AggregateSnapshot
  ) => {
    // tslint:disable no-expression-statement no-object-mutation
    snapshots[key] = snapshot
    // tslint:enable
  }

  return {
    loadAggregateSnapshot,
    saveAggregateSnapshot,
  }
}
