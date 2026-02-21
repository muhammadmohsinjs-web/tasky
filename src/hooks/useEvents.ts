import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { EVENT_SELECT } from '../lib/constants'
import { resolveEventSyncStatus } from '../lib/eventSync'
import { supabase } from '../lib/supabase'
import type { CalendarEvent, Task } from '../types'
import type { EventSyncStatus } from '../lib/eventSync'

export interface EventWithTask extends CalendarEvent {
  linked_task?: Pick<Task, 'id' | 'title' | 'status'> | null
  sync_status?: EventSyncStatus
  sync_error?: string | null
}

export function useEvents() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['events', user?.id] as const, [user?.id])

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const nowIso = new Date().toISOString()
      const { data: eventRows, error } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('status', 'confirmed')
        .gte('end_at', nowIso)
        .order('start_at', { ascending: true })
        .limit(8)

      if (error) throw error
      const typedEvents = (eventRows as CalendarEvent[]) ?? []
      if (typedEvents.length === 0) return []

      const eventIds = typedEvents.map((event) => event.id)
      const [
        { data: links, error: linkError },
        { data: mappings, error: mappingError },
        { data: outboxRows, error: outboxError },
      ] = await Promise.all([
        supabase
          .from('task_event_links')
          .select('event_id,task:tasks(id,title,status)')
          .in('event_id', eventIds),
        supabase
          .from('external_event_mappings')
          .select('event_id,sync_state,last_error,last_synced_at')
          .eq('provider', 'google')
          .in('event_id', eventIds),
        supabase
          .from('calendar_sync_outbox')
          .select('event_id,status,updated_at')
          .eq('provider', 'google')
          .in('event_id', eventIds),
      ])

      if (linkError) throw linkError
      if (mappingError) throw mappingError
      if (outboxError) throw outboxError

      const taskByEventId = new Map<string, Pick<Task, 'id' | 'title' | 'status'>>()
      ;((links as Array<{ event_id: string; task: Pick<Task, 'id' | 'title' | 'status'>[] | null }>) ?? []).forEach((link) => {
        const task = Array.isArray(link.task) ? link.task[0] : null
        if (task) taskByEventId.set(link.event_id, task)
      })

      const mappingByEventId = new Map<string, { sync_state: string; last_error: string | null }>()
      ;((mappings as Array<{ event_id: string; sync_state: string; last_error: string | null }>) ?? []).forEach((mapping) => {
        mappingByEventId.set(mapping.event_id, {
          sync_state: mapping.sync_state,
          last_error: mapping.last_error,
        })
      })

      const latestOutboxByEventId = new Map<string, { status: string; updated_at: string }>()
      ;((outboxRows as Array<{ event_id: string | null; status: string; updated_at: string }>) ?? []).forEach((row) => {
        if (!row.event_id) return
        const existing = latestOutboxByEventId.get(row.event_id)
        if (!existing || new Date(row.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
          latestOutboxByEventId.set(row.event_id, {
            status: row.status,
            updated_at: row.updated_at,
          })
        }
      })

      return typedEvents.map((event) => ({
        ...event,
        linked_task: taskByEventId.get(event.id) ?? null,
        sync_status: resolveEventSyncStatus({
          outboxStatus: latestOutboxByEventId.get(event.id)?.status,
          mappingState: mappingByEventId.get(event.id)?.sync_state,
        }),
        sync_error: mappingByEventId.get(event.id)?.last_error ?? null,
      }))
    },
  })

  return {
    events: events as EventWithTask[],
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  }
}
