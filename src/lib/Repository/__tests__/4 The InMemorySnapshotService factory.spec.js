import 'jest'

import { InMemorySnapshotService } from 'lib-export'

describe('The InMemorySnapshotService factory', () => {
  it('is a function', () => {
    expect(typeof InMemorySnapshotService).toBe('function')
  })
})

describe('InMemorySnapshotService() return a snapshotService instance', () => {
  it('snapshotService.loadAggregateSnapshot is a function', () => {
    const s = InMemorySnapshotService()
    expect(typeof s.loadAggregateSnapshot).toBe('function')
  })
  it('snapshotService.saveAggregateSnapshot is a function', () => {
    const s = InMemorySnapshotService()
    expect(typeof s.saveAggregateSnapshot).toBe('function')
  })
})
