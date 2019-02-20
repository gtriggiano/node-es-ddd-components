// tslint:disable no-submodule-imports
import { right } from 'fp-ts/lib/Either'

import { AggregateSnapshot } from '../Aggregate/types'

import { SnapshotService } from './types'

interface Storage {
  // tslint:disable readonly-keyword
  [key: string]: AggregateSnapshot | undefined
  // tslint:enable
}
export const InMemorySnapshotService = (): SnapshotService => {
  const snapshots: Storage = {}

  return {
    loadAggregateSnapshot: async (key: string) => right(snapshots[key]),
    saveAggregateSnapshot: async (key: string, snapshot: AggregateSnapshot) => {
      // tslint:disable no-expression-statement no-object-mutation
      snapshots[key] = snapshot
      // tslint:enable
      return right(void 0)
    },
  }
}
