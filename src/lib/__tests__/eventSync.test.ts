import { describe, expect, it } from 'vitest'
import { getSyncBadge, resolveEventSyncStatus } from '../eventSync'

describe('resolveEventSyncStatus', () => {
  it('prefers outbox queued/processing as pending', () => {
    expect(resolveEventSyncStatus({ outboxStatus: 'queued', mappingState: 'synced' })).toBe('pending')
    expect(resolveEventSyncStatus({ outboxStatus: 'processing', mappingState: 'synced' })).toBe('pending')
  })

  it('maps outbox failed/dead', () => {
    expect(resolveEventSyncStatus({ outboxStatus: 'failed', mappingState: 'synced' })).toBe('failed')
    expect(resolveEventSyncStatus({ outboxStatus: 'dead', mappingState: 'synced' })).toBe('dead')
  })

  it('falls back to mapping state when outbox is not active', () => {
    expect(resolveEventSyncStatus({ mappingState: 'synced' })).toBe('synced')
    expect(resolveEventSyncStatus({ mappingState: 'error' })).toBe('failed')
    expect(resolveEventSyncStatus({ mappingState: 'pending' })).toBe('pending')
    expect(resolveEventSyncStatus({ mappingState: 'disabled' })).toBe('disabled')
  })

  it('returns unknown when nothing matches', () => {
    expect(resolveEventSyncStatus({})).toBe('unknown')
    expect(resolveEventSyncStatus({ mappingState: 'other' })).toBe('unknown')
  })
})

describe('getSyncBadge', () => {
  it('returns consistent labels and classes', () => {
    expect(getSyncBadge('synced').label).toBe('Synced')
    expect(getSyncBadge('pending').label).toBe('Pending')
    expect(getSyncBadge('failed').label).toBe('Failed')
    expect(getSyncBadge('dead').label).toBe('Dead')
    expect(getSyncBadge('disabled').label).toBe('Disabled')
    expect(getSyncBadge('unknown').label).toBe('Unknown')
  })
})

