import 'jest'

import { InMemorySnapshotService } from 'lib-export'

describe('An InMemorySnapshotService instance `mss`', () => {
  it('mss.saveAggregateSnapshot works as expected', async () => {
    const mss = InMemorySnapshotService()
    const key = `akey${Math.random()}`
    const snapshot = { serializedState: '{}', version: 100 }
    await mss.saveAggregateSnapshot(key, snapshot)

    const loadedSnapshot = await mss.loadAggregateSnapshot(key)
    expect(loadedSnapshot).toBe(snapshot)
  })
  it('mss.loadAggregateSnapshot works as expected', async () => {
    const mss = InMemorySnapshotService()
    const key = `akey${Math.random()}`
    const snapshot = await mss.loadAggregateSnapshot(key)
    expect(snapshot).toBe(undefined)

    const newSnapshot = { serializedState: '{}', version: 100 }
    await mss.saveAggregateSnapshot(key, newSnapshot)

    const reloadedSnapshot = await mss.loadAggregateSnapshot(key)
    expect(reloadedSnapshot).toBe(newSnapshot)
  })
})
