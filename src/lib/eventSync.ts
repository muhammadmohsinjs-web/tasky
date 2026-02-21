export type EventSyncStatus = 'synced' | 'pending' | 'failed' | 'dead' | 'disabled' | 'unknown'

export function resolveEventSyncStatus(params: {
  outboxStatus?: string | null
  mappingState?: string | null
}): EventSyncStatus {
  const outboxStatus = params.outboxStatus ?? null
  const mappingState = params.mappingState ?? null

  if (outboxStatus === 'queued' || outboxStatus === 'processing') return 'pending'
  if (outboxStatus === 'failed') return 'failed'
  if (outboxStatus === 'dead') return 'dead'

  if (mappingState === 'synced') return 'synced'
  if (mappingState === 'error') return 'failed'
  if (mappingState === 'pending') return 'pending'
  if (mappingState === 'disabled') return 'disabled'
  return 'unknown'
}

export function getSyncBadge(status: EventSyncStatus): { label: string; classes: string } {
  switch (status) {
    case 'synced':
      return { label: 'Synced', classes: 'border-[#CAE9DA] bg-[#EAF8F1] text-[#0D7D53]' }
    case 'pending':
      return { label: 'Pending', classes: 'border-[#F2DEBE] bg-[#FFF6E8] text-[#B86A00]' }
    case 'failed':
      return { label: 'Failed', classes: 'border-[#F2D3D3] bg-[#FFF1F1] text-[#A33A3A]' }
    case 'dead':
      return { label: 'Dead', classes: 'border-[#E8D5D5] bg-[#FAF3F3] text-[#8A3D3D]' }
    case 'disabled':
      return { label: 'Disabled', classes: 'border-[#D9E5F6] bg-[#F6FAFF] text-[#5C6E8A]' }
    default:
      return { label: 'Unknown', classes: 'border-[#D9E5F6] bg-[#F6FAFF] text-[#5C6E8A]' }
  }
}
