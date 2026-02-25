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
  googleSourceOfTruth?: boolean
}

interface GoogleCalendarListItem {
  id: string
  summary: string
  primary?: boolean
}

interface GoogleCalendarEventItem {
  id: string
  status?: string | null
  summary?: string | null
  description?: string | null
  location?: string | null
  attendees?: Array<{
    email?: string | null
    displayName?: string | null
    responseStatus?: string | null
    self?: boolean
    organizer?: boolean
  }> | null
  joinLink?: string | null
  meetingLink?: string | null
  updated?: string | null
  start?: {
    date?: string | null
    dateTime?: string | null
    timeZone?: string | null
  } | null
  end?: {
    date?: string | null
    dateTime?: string | null
    timeZone?: string | null
  } | null
  calendarId: string
  calendarSummary?: string | null
}

interface GoogleEventsFunctionPayload {
  ok?: boolean
  error?: string
  calendars?: GoogleCalendarListItem[]
  events?: GoogleCalendarEventItem[]
}

interface MappingRow {
  event_id: string
  provider_event_id: string | null
  provider_calendar_id: string | null
  sync_state: string
  last_error: string | null
}

interface LinkRow {
  event_id: string
  task: Pick<Task, 'id' | 'title' | 'status'>[] | null
}

interface OutboxRow {
  event_id: string | null
  status: string
  updated_at: string
}

function toIsoFromGoogleDate(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(`${value}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function toIsoFromGoogleDateTime(value: string | null | undefined): string | null {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function buildTaskByEventId(links: LinkRow[]): Map<string, Pick<Task, 'id' | 'title' | 'status'>> {
  const taskByEventId = new Map<string, Pick<Task, 'id' | 'title' | 'status'>>()
  links.forEach((link) => {
    const task = Array.isArray(link.task) ? link.task[0] : null
    if (task) taskByEventId.set(link.event_id, task)
  })
  return taskByEventId
}

function buildLatestOutboxByEventId(rows: OutboxRow[]): Map<string, { status: string; updated_at: string }> {
  const latestOutboxByEventId = new Map<string, { status: string; updated_at: string }>()
  rows.forEach((row) => {
    if (!row.event_id) return
    const existing = latestOutboxByEventId.get(row.event_id)
    if (!existing || new Date(row.updated_at).getTime() > new Date(existing.updated_at).getTime()) {
      latestOutboxByEventId.set(row.event_id, {
        status: row.status,
        updated_at: row.updated_at,
      })
    }
  })
  return latestOutboxByEventId
}

function toMappingKey(calendarId: string | null | undefined, providerEventId: string | null | undefined): string {
  return `${calendarId ?? ''}::${providerEventId ?? ''}`
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
  const googleSourceOfTruth = Boolean(options?.googleSourceOfTruth)

  const queryKey = useMemo(
    () => ['events', user?.id ?? 'anon', range.timeMin, range.timeMax, limit, selectedCalendarId, googleSourceOfTruth] as const,
    [googleSourceOfTruth, limit, range.timeMax, range.timeMin, selectedCalendarId, user?.id]
  )

  const { data: events = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return []

      if (googleSourceOfTruth) {
        const { data, error } = await supabase.functions.invoke('calendar-sync-outbox', {
          body: {
            action: 'listGoogleEvents',
            userId: user.id,
            calendarId: selectedCalendarId ?? undefined,
            timeMin: range.timeMin,
            timeMax: range.timeMax,
            calendarsLimit: selectedCalendarId ? 1 : 25,
            eventsLimit: Math.min(limit, 100),
          },
        })

        if (error) throw error

        const payload = (data ?? {}) as GoogleEventsFunctionPayload
        if (payload.error) throw new Error(payload.error)

        const googleEvents = payload.events ?? []
        const calendarNameById = new Map<string, string>(
          (payload.calendars ?? []).map((calendar) => [calendar.id, calendar.summary])
        )
        const providerEventIds = Array.from(new Set(googleEvents.map((event) => event.id).filter(Boolean)))

        const mappingRowsPromise = providerEventIds.length > 0
          ? supabase
            .from('external_event_mappings')
            .select('event_id,provider_event_id,provider_calendar_id,sync_state,last_error')
            .eq('user_id', user.id)
            .eq('provider', 'google')
            .in('provider_event_id', providerEventIds)
          : Promise.resolve({ data: [], error: null })

        const { data: mappings, error: mappingError } = await mappingRowsPromise
        if (mappingError) throw mappingError

        const mappingByProviderKey = new Map<string, MappingRow>()
        const mappedEventIds = new Set<string>()
        ;((mappings as MappingRow[]) ?? []).forEach((mapping) => {
          mappingByProviderKey.set(
            toMappingKey(mapping.provider_calendar_id, mapping.provider_event_id),
            mapping
          )
          mappedEventIds.add(mapping.event_id)
        })

        const eventIds = Array.from(mappedEventIds)
        const linkRowsPromise = eventIds.length > 0
          ? supabase
            .from('task_event_links')
            .select('event_id,task:tasks(id,title,status)')
            .eq('user_id', user.id)
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
          { data: outboxRows, error: outboxError },
        ] = await Promise.all([linkRowsPromise, outboxRowsPromise])

        if (linkError) throw linkError
        if (outboxError) throw outboxError

        const taskByEventId = buildTaskByEventId((links as LinkRow[]) ?? [])
        const latestOutboxByEventId = buildLatestOutboxByEventId((outboxRows as OutboxRow[]) ?? [])

        const canonicalGoogleEvents: EventWithTask[] = []
        for (const googleEvent of googleEvents) {
          const startAt = googleEvent.start?.dateTime
            ? toIsoFromGoogleDateTime(googleEvent.start.dateTime)
            : toIsoFromGoogleDate(googleEvent.start?.date)
          const endAt = googleEvent.end?.dateTime
            ? toIsoFromGoogleDateTime(googleEvent.end.dateTime)
            : toIsoFromGoogleDate(googleEvent.end?.date)
          if (!startAt || !endAt) continue

          const status: EventWithTask['status'] = googleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed'
          if (status !== 'confirmed') continue

          const mapping = mappingByProviderKey.get(
            toMappingKey(googleEvent.calendarId, googleEvent.id)
          )

          canonicalGoogleEvents.push({
            id: mapping?.event_id ?? `google:${googleEvent.calendarId}:${googleEvent.id}`,
            user_id: user.id,
            title: (googleEvent.summary ?? '').trim() || 'Untitled event',
            description: googleEvent.description ?? null,
            start_at: startAt,
            end_at: endAt,
            is_all_day: Boolean(googleEvent.start?.date && !googleEvent.start?.dateTime),
            timezone: googleEvent.start?.timeZone ?? googleEvent.end?.timeZone ?? 'UTC',
            source: 'native',
            status,
            created_at: googleEvent.updated ?? startAt,
            updated_at: googleEvent.updated ?? startAt,
            join_link: googleEvent.joinLink ?? googleEvent.meetingLink ?? null,
            meeting_link: googleEvent.meetingLink ?? googleEvent.joinLink ?? null,
            attendees: googleEvent.attendees ?? [],
            location: googleEvent.location ?? null,
            linked_task: mapping ? (taskByEventId.get(mapping.event_id) ?? null) : null,
            sync_status: mapping
              ? resolveEventSyncStatus({
                outboxStatus: latestOutboxByEventId.get(mapping.event_id)?.status,
                mappingState: mapping.sync_state,
              })
              : 'synced',
            sync_error: mapping?.last_error ?? null,
            provider_event_id: googleEvent.id,
            provider_calendar_id: googleEvent.calendarId,
            provider_calendar_name: googleEvent.calendarSummary ?? calendarNameById.get(googleEvent.calendarId) ?? googleEvent.calendarId,
            is_external_google_event: true,
          })
        }

        canonicalGoogleEvents.sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())

        return canonicalGoogleEvents
      }

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

      const taskByEventId = buildTaskByEventId((links as LinkRow[]) ?? [])

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

      const latestOutboxByEventId = buildLatestOutboxByEventId((outboxRows as OutboxRow[]) ?? [])

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
