import { useCallback, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { listTaskMutations, removeTaskMutation } from '../lib/offlineQueue'

async function applyMutation(kind: string, payload: Record<string, unknown>) {
  if (kind === 'insert') {
    const { error } = await supabase.from('tasks').insert(payload)
    if (error) throw error
    return
  }

  if (kind === 'update') {
    const id = payload.id as string
    const updates = (payload.updates ?? {}) as Record<string, unknown>
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) throw error
    return
  }

  if (kind === 'delete') {
    const id = payload.id as string
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) throw error
    return
  }

  if (kind === 'bulk_update') {
    const ids = (payload.ids as string[]) ?? []
    const updates = (payload.updates ?? {}) as Record<string, unknown>
    const { error } = await supabase.from('tasks').update(updates).in('id', ids)
    if (error) throw error
    return
  }

  if (kind === 'bulk_delete') {
    const ids = (payload.ids as string[]) ?? []
    const { error } = await supabase.from('tasks').delete().in('id', ids)
    if (error) throw error
  }
}

export function useOfflineSync() {
  const queryClient = useQueryClient()
  const syncing = useRef(false)

  const flush = useCallback(async () => {
    if (syncing.current || typeof navigator === 'undefined' || !navigator.onLine) return

    syncing.current = true
    try {
      const queued = await listTaskMutations()
      if (queued.length === 0) return

      for (const entry of queued) {
        if (!entry.id) continue

        try {
          await applyMutation(entry.kind, entry.payload)
          await removeTaskMutation(entry.id)
        } catch (error) {
          // Stop flush on first failure to preserve ordering guarantees.
          console.error('Offline sync mutation failed:', error)
          break
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Offline changes synced')
    } finally {
      syncing.current = false
    }
  }, [queryClient])

  useEffect(() => {
    flush()
    const onOnline = () => {
      flush()
    }

    window.addEventListener('online', onOnline)
    return () => window.removeEventListener('online', onOnline)
  }, [flush])

  return { flush }
}
