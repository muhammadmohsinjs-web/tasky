import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { EVENT_SELECT } from '../lib/constants'
import { resolveEventSyncStatus } from '../lib/eventSync'
import { supabase } from '../lib/supabase'
import type { CalendarEvent, Task } from '../types'
import type { EventSyncStatus } from '../lib/eventSync'

export interface EventWithTask extends CalendarEvent {
  join_link?: string | null
  meeting_link?: string | null
  attendees?: Array<{
    email?: string | null
    displayName?: string | null
    responseStatus?: string | null
    self?: boolean
    organizer?: boolean
  }>
  location?: string | null
  linked_task?: Pick<Task, 'id' | 'title' | 'status'> | null
  sync_status?: EventSyncStatus
  sync_error?: string | null
  provider_event_id?: string | null
  provider_calendar_id?: string | null
  provider_calendar_name?: string | null
  is_external_google_event?: boolean
}

export interface UseEventsOptions {
  timeMin?: string
  timeMax?: string
  limit?: number
  calendarId?: string | null
}

function getDefaultRange() {
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthEnd = new Date(monthStart)
  monthEnd.setMonth(monthEnd.getMonth() + 1)
  return {
    timeMin: monthStart.toISOString(),
    timeMax: monthEnd.toISOString(),
  }
}

export function useEvents(options?: UseEventsOptions) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const range = useMemo(() => {
    const defaults = getDefaultRange()
    return {
      timeMin: options?.timeMin ?? defaults.timeMin,
      timeMax: options?.timeMax ?? defaults.timeMax,
    }
  }, [options?.timeMax, options?.timeMin])

  const limit = Math.min(Math.max(options?.limit ?? 200, 20), 500)
  const selectedCalendarId = options?.calendarId?.trim() || null

  const queryKey = useMemo(
    () => ['events', user?.id ?? 'anon', range.timeMin, range.timeMax, limit, selectedCalendarId] as const,
    [limit, range.timeMax, range.timeMin, selectedCalendarId, user?.id]
  )

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return []

      const { data: eventRows, error } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('user_id', user.id)
        .eq('status', 'confirmed')
        .lte('start_at', range.timeMax)
        .gte('end_at', range.timeMin)
        .order('start_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      const typedEvents = (eventRows as CalendarEvent[]) ?? []
      const eventIds = typedEvents.map((event) => event.id)

      const linkRowsPromise = eventIds.length > 0
        ? supabase
          .from('task_event_links')
          .select('event_id,task:tasks(id,title,status)')
          .eq('user_id', user.id)
          .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null })

      const mappingRowsPromise = eventIds.length > 0
        ? supabase
          .from('external_event_mappings')
          .select('event_id,provider_event_id,provider_calendar_id,sync_state,last_error,last_synced_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null })

      const outboxRowsPromise = eventIds.length > 0
        ? supabase
          .from('calendar_sync_outbox')
          .select('event_id,status,updated_at')
          .eq('user_id', user.id)
          .eq('provider', 'google')
          .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null })

      const [
        { data: links, error: linkError },
        { data: mappings, error: mappingError },
        { data: outboxRows, error: outboxError },
      ] = await Promise.all([linkRowsPromise, mappingRowsPromise, outboxRowsPromise])

      if (linkError) throw linkError
      if (mappingError) throw mappingError
      if (outboxError) throw outboxError

      const taskByEventId = new Map<string, Pick<Task, 'id' | 'title' | 'status'>>()
      ;((links as Array<{ event_id: string; task: Pick<Task, 'id' | 'title' | 'status'>[] | null }>) ?? []).forEach((link) => {
        const task = Array.isArray(link.task) ? link.task[0] : null
        if (task) taskByEventId.set(link.event_id, task)
      })

      const mappingByEventId = new Map<string, {
        provider_event_id: string | null
        provider_calendar_id: string | null
        sync_state: string
        last_error: string | null
      }>()

      ;((mappings as Array<{
        event_id: string
        provider_event_id: string | null
        provider_calendar_id: string | null
        sync_state: string
        last_error: string | null
      }>) ?? []).forEach((mapping) => {
        mappingByEventId.set(mapping.event_id, {
          provider_event_id: mapping.provider_event_id,
          provider_calendar_id: mapping.provider_calendar_id,
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

      const localEvents: EventWithTask[] = typedEvents
        .filter((event) => {
          if (!selectedCalendarId) return true
          const mapping = mappingByEventId.get(event.id)
          if (!mapping?.provider_calendar_id) return true
          return mapping.provider_calendar_id === selectedCalendarId
        })
        .map((event) => {
          const mapping = mappingByEventId.get(event.id)
          return {
            ...event,
            linked_task: taskByEventId.get(event.id) ?? null,
            sync_status: resolveEventSyncStatus({
              outboxStatus: latestOutboxByEventId.get(event.id)?.status,
              mappingState: mapping?.sync_state,
            }),
            sync_error: mapping?.last_error ?? null,
            provider_event_id: mapping?.provider_event_id ?? null,
            provider_calendar_id: mapping?.provider_calendar_id ?? null,
            provider_calendar_name: mapping?.provider_calendar_id ?? null,
            is_external_google_event: Boolean(mapping?.provider_event_id && event.source === 'native'),
          }
        })
        .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

      return localEvents
    },
  })

  return {
    events: events as EventWithTask[],
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  }
}
