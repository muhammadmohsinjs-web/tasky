import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { EVENT_SELECT } from '../lib/constants'
import { resolveEventSyncStatus } from '../lib/eventSync'
import { fetchGoogleCalendarPreview } from '../lib/googleCalendar'
import { supabase } from '../lib/supabase'
import type { CalendarEvent, Task } from '../types'
import type { EventSyncStatus } from '../lib/eventSync'

export interface EventWithTask extends CalendarEvent {
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
  const { user, googleRefreshToken, refreshGoogleToken } = useAuth()
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
    () => ['events', user?.id, range.timeMin, range.timeMax, limit, selectedCalendarId] as const,
    [limit, range.timeMax, range.timeMin, selectedCalendarId, user?.id]
  )

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const debugPrefix = '[useEvents]'
      const nowIso = new Date().toISOString()
      const timeMinIso = range.timeMin
      const timeMaxIso = range.timeMax
      console.info(`${debugPrefix} starting fetch`, {
        userId: user?.id ?? null,
        nowIso,
        timeMinIso,
        timeMaxIso,
        selectedCalendarId,
        hasGoogleRefreshToken: Boolean(googleRefreshToken),
      })

      const { data: eventRows, error } = await supabase
        .from('events')
        .select(EVENT_SELECT)
        .eq('status', 'confirmed')
        .lte('start_at', timeMaxIso)
        .gte('end_at', timeMinIso)
        .order('start_at', { ascending: true })
        .limit(limit)

      if (error) throw error
      const typedEvents = (eventRows as CalendarEvent[]) ?? []
      console.info(`${debugPrefix} local events loaded`, { count: typedEvents.length })

      const eventIds = typedEvents.map((event) => event.id)
      const linkRowsPromise = eventIds.length > 0
        ? supabase
          .from('task_event_links')
          .select('event_id,task:tasks(id,title,status)')
          .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null })
      const mappingRowsPromise = eventIds.length > 0
        ? supabase
          .from('external_event_mappings')
          .select('event_id,provider_event_id,provider_calendar_id,sync_state,last_error,last_synced_at')
          .eq('provider', 'google')
          .in('event_id', eventIds)
        : Promise.resolve({ data: [], error: null })
      const outboxRowsPromise = eventIds.length > 0
        ? supabase
          .from('calendar_sync_outbox')
          .select('event_id,status,updated_at')
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
      console.info(`${debugPrefix} related rows loaded`, {
        taskLinks: Array.isArray(links) ? links.length : 0,
        mappings: Array.isArray(mappings) ? mappings.length : 0,
        outboxRows: Array.isArray(outboxRows) ? outboxRows.length : 0,
      })

      const taskByEventId = new Map<string, Pick<Task, 'id' | 'title' | 'status'>>()
      ;((links as Array<{ event_id: string; task: Pick<Task, 'id' | 'title' | 'status'>[] | null }>) ?? []).forEach((link) => {
        const task = Array.isArray(link.task) ? link.task[0] : null
        if (task) taskByEventId.set(link.event_id, task)
      })

      const mappingByEventId = new Map<string, { sync_state: string; last_error: string | null }>()
      const mappedProviderEventIds = new Set<string>()
      ;((mappings as Array<{
        event_id: string
        provider_event_id: string | null
        provider_calendar_id: string | null
        sync_state: string
        last_error: string | null
      }>) ?? []).forEach((mapping) => {
        mappingByEventId.set(mapping.event_id, {
          sync_state: mapping.sync_state,
          last_error: mapping.last_error,
        })
        if (mapping.provider_event_id) mappedProviderEventIds.add(mapping.provider_event_id)
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

      const localEvents: EventWithTask[] = typedEvents.map((event) => ({
        ...event,
        linked_task: taskByEventId.get(event.id) ?? null,
        sync_status: resolveEventSyncStatus({
          outboxStatus: latestOutboxByEventId.get(event.id)?.status,
          mappingState: mappingByEventId.get(event.id)?.sync_state,
        }),
        sync_error: mappingByEventId.get(event.id)?.last_error ?? null,
      }))
      console.info(`${debugPrefix} local events normalized`, { count: localEvents.length })

      const googleAccessToken = await refreshGoogleToken()
      console.info(`${debugPrefix} invoking edge function`, {
        hasGoogleAccessToken: Boolean(googleAccessToken),
        hasGoogleRefreshToken: Boolean(googleRefreshToken),
      })
      const invokeResult = await supabase.functions.invoke('calendar-sync-outbox', {
        body: {
          action: 'listGoogleEvents',
          userId: user?.id,
          googleAccessToken,
          googleRefreshToken,
          calendarId: selectedCalendarId ?? undefined,
          calendarsLimit: 10,
          eventsLimit: 100,
          timeMin: timeMinIso,
          timeMax: timeMaxIso,
        },
      })
      let googleData = invokeResult.data
      const googleError = invokeResult.error

      if (googleError) {
        console.warn(`${debugPrefix} edge function invocation failed`, {
          message: googleError.message,
          details: (googleError as unknown as { context?: unknown })?.context ?? null,
        })
        return localEvents
      }

      const functionError = (googleData as { error?: string } | null)?.error
      if (functionError) {
        console.warn(`${debugPrefix} edge function returned error payload`, {
          error: functionError,
          payload: googleData,
        })
        return localEvents
      }

      const payload = (googleData as Record<string, unknown> | null) ?? null
      const payloadKeys = payload ? Object.keys(payload) : []
      console.info(`${debugPrefix} edge function payload keys`, { payloadKeys })
      if (payload && !('events' in payload) && 'processed' in payload) {
        console.warn(`${debugPrefix} edge function appears to be old deployment (processOutbox shape, no events array)`, {
          payload,
        })

        try {
          const preview = await fetchGoogleCalendarPreview(googleAccessToken ?? undefined, {
            timeMin: timeMinIso,
            timeMax: timeMaxIso,
            calendarMaxResults: 10,
            eventsMaxResults: 100,
          })
          const fallbackEvents = Object.entries(preview.eventsByCalendar).flatMap(([calendarId, events]) =>
            events.map((event) => ({
              id: event.id,
              status: event.status,
              summary: event.summary ?? null,
              description: event.description ?? null,
              start: event.start ?? null,
              end: event.end ?? null,
              calendarId,
              calendarSummary:
                preview.calendars.find((calendar) => calendar.id === calendarId)?.summary ?? calendarId,
            }))
          )
          const scopedFallbackEvents = selectedCalendarId
            ? fallbackEvents.filter((event) => event.calendarId === selectedCalendarId)
            : fallbackEvents
          console.info(`${debugPrefix} fallback Google fetch succeeded`, {
            calendarsCount: preview.calendars.length,
            rawCount: fallbackEvents.length,
            scopedCount: scopedFallbackEvents.length,
          })

          googleData = {
            calendars: preview.calendars,
            events: scopedFallbackEvents,
          }
        } catch (fallbackError) {
          console.warn(`${debugPrefix} fallback Google fetch failed`, {
            message: fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error',
          })
        }
      }

      const externalEvents = (((googleData as {
        calendars?: Array<{ id: string }>
        events?: Array<{
          id: string
          status?: string
          summary?: string | null
          description?: string | null
          start?: { date?: string; dateTime?: string } | null
          end?: { date?: string; dateTime?: string } | null
          calendarId?: string
          calendarSummary?: string
        }>
      })?.events) ?? [])
        .filter((event) => {
          if (!selectedCalendarId) return true
          return (event.calendarId ?? null) === selectedCalendarId
        })
        .filter((event) => {
          if (!event.id || mappedProviderEventIds.has(event.id)) return false
          if ((event.status ?? 'confirmed') === 'cancelled') return false
          return Boolean(event.start?.dateTime || event.start?.date)
        })
        .map<EventWithTask>((event) => {
          const startAt = event.start?.dateTime
            ?? (event.start?.date ? `${event.start.date}T00:00:00.000Z` : nowIso)
          const endAt = event.end?.dateTime
            ?? (event.end?.date ? `${event.end.date}T00:00:00.000Z` : startAt)

          return {
            id: `google:${event.calendarId ?? 'primary'}:${event.id}`,
            user_id: user?.id ?? '',
            title: event.summary?.trim() || '(Untitled Google event)',
            description: event.description ?? null,
            start_at: startAt,
            end_at: endAt,
            is_all_day: Boolean(event.start?.date && !event.start?.dateTime),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
            source: 'native',
            status: 'confirmed',
            created_at: startAt,
            updated_at: endAt,
            linked_task: null,
            sync_status: 'synced',
            sync_error: null,
            provider_event_id: event.id,
            provider_calendar_id: event.calendarId ?? null,
            provider_calendar_name: event.calendarSummary ?? null,
            is_external_google_event: true,
          }
        })

      console.info(`${debugPrefix} raw google events sample`, {
        sample: externalEvents.slice(0, 20).map((event) => ({
          providerEventId: event.provider_event_id,
          calendarId: event.provider_calendar_id,
          calendarName: event.provider_calendar_name,
          title: event.title,
          startAt: event.start_at,
          endAt: event.end_at,
          isAllDay: event.is_all_day,
        })),
      })

      const duplicateBuckets = new Map<string, number>()
      externalEvents.forEach((event) => {
        const key = [
          event.provider_calendar_id ?? '',
          event.provider_event_id ?? event.id,
          event.start_at,
          event.end_at,
        ].join('|')
        duplicateBuckets.set(key, (duplicateBuckets.get(key) ?? 0) + 1)
      })
      const duplicateCount = Array.from(duplicateBuckets.values()).filter((count) => count > 1).length
      if (duplicateCount > 0) {
        console.warn(`${debugPrefix} duplicate external event buckets detected`, {
          duplicateBuckets: duplicateCount,
          externalCount: externalEvents.length,
        })
      }

      const uniqueExternalBySignature = new Map<string, EventWithTask>()
      for (const event of externalEvents) {
        // Deduplicate identical occurrences so one Google event does not flood the list.
        const signature = [
          event.start_at,
          event.end_at,
          event.is_all_day ? 'all-day' : 'timed',
          event.title.trim().toLowerCase(),
        ].join('|')
        if (!uniqueExternalBySignature.has(signature)) {
          uniqueExternalBySignature.set(signature, event)
        }
      }
      const dedupedExternalEvents = Array.from(uniqueExternalBySignature.values())
      console.info(`${debugPrefix} deduped google events sample`, {
        sample: dedupedExternalEvents.slice(0, 20).map((event) => ({
          providerEventId: event.provider_event_id,
          calendarId: event.provider_calendar_id,
          calendarName: event.provider_calendar_name,
          title: event.title,
          startAt: event.start_at,
          endAt: event.end_at,
          isAllDay: event.is_all_day,
        })),
      })
      console.info(`${debugPrefix} google events normalized`, {
        calendarsCount: (((googleData as { calendars?: unknown[] } | null)?.calendars) ?? []).length,
        rawCount: (((googleData as { events?: unknown[] } | null)?.events) ?? []).length,
        mergedCount: dedupedExternalEvents.length,
        dedupedOut: externalEvents.length - dedupedExternalEvents.length,
        skippedAsMapped: mappedProviderEventIds.size,
      })

      const merged = [...localEvents, ...dedupedExternalEvents].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )
      console.info(`${debugPrefix} final merged events`, { count: merged.length })
      return merged
    },
  })

  return {
    events: events as EventWithTask[],
    loading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  }
}
