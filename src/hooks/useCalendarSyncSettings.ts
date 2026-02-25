import { useCallback, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { CALENDAR_CONNECTION_SELECT } from '../lib/constants'
import { supabase } from '../lib/supabase'
import type { CalendarConnection, SyncDirection } from '../types'

const GOOGLE_PROVIDER = 'google' as const
const STALE_PROCESSING_MINUTES = 15

async function extractFunctionInvokeErrorMessage(error: unknown): Promise<string | null> {
  if (!error || typeof error !== 'object' || !('context' in error)) return null

  const context = (error as { context?: unknown }).context
  if (!(context instanceof Response)) return null

  try {
    const payload = await context.clone().json() as { error?: string }
    if (payload.error && payload.error.trim().length > 0) {
      return payload.error.trim()
    }
  } catch {
    // Ignore non-JSON payloads.
  }

  try {
    const text = (await context.clone().text()).trim()
    if (text.length > 0) {
      return text.slice(0, 240)
    }
  } catch {
    // Ignore body parsing failures.
  }

  return null
}

export function useCalendarSyncSettings() {
  const { user, googleRefreshToken, refreshGoogleToken } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['calendar-connection', user?.id], [user?.id])
  const outboxQueryKey = useMemo(() => ['calendar-sync-outbox', user?.id], [user?.id])
  const [syncingNow, setSyncingNow] = useState(false)

  const { data: connection = null, isLoading: loading, error } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('calendar_connections')
        .select(CALENDAR_CONNECTION_SELECT)
        .eq('user_id', user.id)
        .eq('provider', GOOGLE_PROVIDER)
        .maybeSingle()

      if (error) throw error
      return data as CalendarConnection | null
    },
  })

  const { data: outboxStats = null, isLoading: outboxLoading } = useQuery({
    queryKey: outboxQueryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const sinceIso = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      const staleBeforeIso = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000).toISOString()

      const [
        queuedCountRes,
        failedCountRes,
        deadCountRes,
        latestErrorRes,
        done24hRes,
        failed24hRes,
        dead24hRes,
        staleProcessingRes,
      ] = await Promise.all([
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'queued'),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'failed'),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'dead'),
        supabase
          .from('calendar_sync_outbox')
          .select('last_error,updated_at')
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .not('last_error', 'is', null)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'done')
          .gte('updated_at', sinceIso),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'failed')
          .gte('updated_at', sinceIso),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'dead')
          .gte('updated_at', sinceIso),
        supabase
          .from('calendar_sync_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('provider', GOOGLE_PROVIDER)
          .eq('status', 'processing')
          .lt('updated_at', staleBeforeIso),
      ])

      if (queuedCountRes.error) throw queuedCountRes.error
      if (failedCountRes.error) throw failedCountRes.error
      if (deadCountRes.error) throw deadCountRes.error
      if (latestErrorRes.error) throw latestErrorRes.error
      if (done24hRes.error) throw done24hRes.error
      if (failed24hRes.error) throw failed24hRes.error
      if (dead24hRes.error) throw dead24hRes.error
      if (staleProcessingRes.error) throw staleProcessingRes.error

      const done24h = done24hRes.count ?? 0
      const failed24h = failed24hRes.count ?? 0
      const dead24h = dead24hRes.count ?? 0
      const processed24h = done24h + failed24h + dead24h
      const successRate24h = processed24h > 0 ? Math.round((done24h / processed24h) * 100) : 100
      const deadRate24h = processed24h > 0 ? Number(((dead24h / processed24h) * 100).toFixed(1)) : 0

      return {
        queued: queuedCountRes.count ?? 0,
        failed: failedCountRes.count ?? 0,
        dead: deadCountRes.count ?? 0,
        lastError: latestErrorRes.data?.last_error ?? null,
        lastErrorAt: latestErrorRes.data?.updated_at ?? null,
        done24h,
        failed24h,
        dead24h,
        processed24h,
        successRate24h,
        deadRate24h,
        staleProcessing: staleProcessingRes.count ?? 0,
      }
    },
  })

  const invalidate = useCallback(() => queryClient.invalidateQueries({ queryKey }), [queryClient, queryKey])
  const invalidateOutbox = useCallback(
    () => queryClient.invalidateQueries({ queryKey: outboxQueryKey }),
    [outboxQueryKey, queryClient]
  )

  const ensureConnection = useCallback(async () => {
    if (!user?.id) return null
    if (connection) return connection

    const { data, error } = await supabase
      .from('calendar_connections')
      .upsert(
        {
          user_id: user.id,
          provider: GOOGLE_PROVIDER,
          google_calendar_id: 'primary',
          sync_enabled: false,
          sync_direction: 'task_to_google' as SyncDirection,
        },
        { onConflict: 'user_id,provider' }
      )
      .select(CALENDAR_CONNECTION_SELECT)
      .single()

    if (error) {
      console.error('Failed to initialize calendar settings:', error)
      toast.error('Failed to initialize Google sync settings')
      return null
    }

    await invalidate()
    return data as CalendarConnection
  }, [connection, invalidate, user?.id])

  const updateConnection = useCallback(
    async (updates: Partial<Pick<CalendarConnection, 'google_calendar_id' | 'sync_enabled' | 'sync_direction' | 'last_sync_at'>>) => {
      const ensured = await ensureConnection()
      if (!ensured) return null

      const { data, error } = await supabase
        .from('calendar_connections')
        .update(updates)
        .eq('id', ensured.id)
        .select(CALENDAR_CONNECTION_SELECT)
        .single()

      if (error) {
        console.error('Failed to update calendar settings:', error)
        toast.error('Failed to update Google sync settings')
        return null
      }

      await invalidate()
      return data as CalendarConnection
    },
    [ensureConnection, invalidate]
  )

  const setSyncEnabled = useCallback(
    async (enabled: boolean) => updateConnection({ sync_enabled: enabled }),
    [updateConnection]
  )

  const setCalendarId = useCallback(
    async (calendarId: string) => {
      const normalized = calendarId.trim()
      if (!normalized) {
        toast.error('Calendar ID is required')
        return null
      }
      return updateConnection({ google_calendar_id: normalized })
    },
    [updateConnection]
  )

  const setSyncDirection = useCallback(
    async (direction: SyncDirection) => updateConnection({ sync_direction: direction }),
    [updateConnection]
  )

  const markSyncCompleted = useCallback(
    async (when = new Date().toISOString()) => updateConnection({ last_sync_at: when }),
    [updateConnection]
  )

  const runSyncNow = useCallback(
    async (limit = 25) => {
      setSyncingNow(true)

      try {
        if (!user?.id) {
          toast.error('Please sign in to run calendar sync')
          return null
        }

        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token) {
          toast.error('Session expired. Please sign in again.')
          return null
        }

        const googleAccessToken = session.provider_token ?? await refreshGoogleToken()

        const { data, error: invokeError } = await supabase.functions.invoke('calendar-sync-outbox', {
          body: {
            userId: user.id,
            googleAccessToken,
            googleRefreshToken,
            limit,
          },
        })

        if (invokeError) {
          console.error('Failed to run sync outbox processor:', {
            invokeError,
          })
          const detailedMessage = await extractFunctionInvokeErrorMessage(invokeError)
          const message = detailedMessage || invokeError.message || 'Failed to run Google sync'
          toast.error(message)
          return null
        }

        await markSyncCompleted()
        await invalidate()
        await invalidateOutbox()
        return (data ?? null) as {
          ok: boolean
          processed: number
          succeeded: number
          failed: number
          dead: number
          skipped: number
        }
      } finally {
        setSyncingNow(false)
      }
    },
    [googleRefreshToken, invalidate, invalidateOutbox, markSyncCompleted, refreshGoogleToken, user?.id]
  )

  const retryDeadJobs = useCallback(async () => {
    if (!user?.id) return 0

    const { data, error } = await supabase
      .from('calendar_sync_outbox')
      .update({
        status: 'queued',
        attempt_count: 0,
        last_error: null,
        next_attempt_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('provider', GOOGLE_PROVIDER)
      .eq('status', 'dead')
      .select('id')

    if (error) {
      console.error('Failed to retry dead sync jobs:', error)
      toast.error('Failed to retry dead sync jobs')
      return 0
    }

    await invalidateOutbox()
    return data?.length ?? 0
  }, [invalidateOutbox, user?.id])

  const replayRecoverableJobs = useCallback(async () => {
    if (!user?.id) return 0
    const nowIso = new Date().toISOString()
    const staleBeforeIso = new Date(Date.now() - STALE_PROCESSING_MINUTES * 60 * 1000).toISOString()

    const [recoverDeadFailedRes, recoverStaleProcessingRes] = await Promise.all([
      supabase
        .from('calendar_sync_outbox')
        .update({
          status: 'queued',
          attempt_count: 0,
          last_error: null,
          next_attempt_at: nowIso,
          updated_at: nowIso,
        })
        .eq('user_id', user.id)
        .eq('provider', GOOGLE_PROVIDER)
        .in('status', ['dead', 'failed'])
        .select('id'),
      supabase
        .from('calendar_sync_outbox')
        .update({
          status: 'queued',
          last_error: null,
          next_attempt_at: nowIso,
          updated_at: nowIso,
        })
        .eq('user_id', user.id)
        .eq('provider', GOOGLE_PROVIDER)
        .eq('status', 'processing')
        .lt('updated_at', staleBeforeIso)
        .select('id'),
    ])

    if (recoverDeadFailedRes.error || recoverStaleProcessingRes.error) {
      console.error('Failed to replay recoverable sync jobs:', {
        deadFailedError: recoverDeadFailedRes.error,
        staleProcessingError: recoverStaleProcessingRes.error,
      })
      toast.error('Failed to replay recoverable sync jobs')
      return 0
    }

    const recovered = (recoverDeadFailedRes.data?.length ?? 0) + (recoverStaleProcessingRes.data?.length ?? 0)
    await invalidateOutbox()
    return recovered
  }, [invalidateOutbox, user?.id])

  const backfillMissingTaskEvents = useCallback(async (limit = 100) => {
    if (!user?.id) return 0

    const safeLimit = Math.min(Math.max(limit, 1), 500)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

    const [{ data: tasks, error: tasksError }, { data: links, error: linksError }] = await Promise.all([
      supabase
        .from('tasks')
        .select('id,title,description,notes,date,end_date,time')
        .eq('user_id', user.id)
        .not('date', 'is', null)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(safeLimit),
      supabase
        .from('task_event_links')
        .select('task_id')
        .eq('user_id', user.id),
    ])

    if (tasksError) {
      console.error('Failed to load tasks for event backfill:', tasksError)
      toast.error('Failed to prepare event backfill')
      return 0
    }

    if (linksError) {
      console.error('Failed to load existing task-event links:', linksError)
      toast.error('Failed to prepare event backfill')
      return 0
    }

    const linkedTaskIds = new Set(((links as Array<{ task_id: string }>) ?? []).map((link) => link.task_id))
    const missing = ((tasks as Array<{
      id: string
      title: string
      description: string | null
      notes: string | null
      date: string | null
      end_date: string | null
      time: string | null
    }>) ?? []).filter((task) => !linkedTaskIds.has(task.id))

    if (missing.length === 0) return 0

    const connection = await ensureConnection()
    if (!connection) return 0

    let created = 0
    for (const task of missing) {
      if (!task.date) continue

      const normalizedTime = task.time?.trim() ?? ''
      const timedMatch = normalizedTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

      let startAt: string
      let endAt: string
      let isAllDay: boolean

      if (timedMatch) {
        const hours = Number(timedMatch[1])
        const minutes = Number(timedMatch[2])
        const start = new Date(`${task.date}T00:00:00`)
        start.setHours(hours, minutes, 0, 0)
        const end = new Date(start.getTime() + 60 * 60 * 1000)
        startAt = start.toISOString()
        endAt = end.toISOString()
        isAllDay = false
      } else {
        const start = new Date(`${task.date}T00:00:00`)
        const endBase = task.end_date ?? task.date
        const end = new Date(`${endBase}T00:00:00`)
        end.setDate(end.getDate() + 1)
        startAt = start.toISOString()
        endAt = end.toISOString()
        isAllDay = true
      }

      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          user_id: user.id,
          title: task.title,
          description: task.notes ?? task.description ?? null,
          start_at: startAt,
          end_at: endAt,
          is_all_day: isAllDay,
          timezone,
          source: 'task',
          status: 'confirmed',
        })
        .select('id')
        .single()

      if (eventError || !event?.id) {
        console.error('Failed to backfill event for task:', task.id, eventError)
        continue
      }

      const { error: linkInsertError } = await supabase
        .from('task_event_links')
        .insert({
          user_id: user.id,
          task_id: task.id,
          event_id: event.id,
          relation_type: 'scheduled_from_task',
        })

      if (linkInsertError) {
        console.error('Failed to backfill task-event link for task:', task.id, linkInsertError)
        continue
      }

      if (connection.sync_enabled) {
        await supabase.from('calendar_sync_outbox').insert({
          user_id: user.id,
          provider: GOOGLE_PROVIDER,
          event_id: event.id,
          operation: 'upsert',
          payload: {
            task_id: task.id,
            event_id: event.id,
            title: task.title,
            description: task.description,
            notes: task.notes,
            date: task.date,
            end_date: task.end_date,
            time: task.time,
            calendar_id: connection.google_calendar_id,
          },
          dedupe_key: `backfill:upsert:${task.id}:${event.id}:${crypto.randomUUID()}`,
          status: 'queued',
        })
      }

      created += 1
    }

    await Promise.all([invalidateOutbox(), queryClient.invalidateQueries({ queryKey: ['events'] })])
    return created
  }, [ensureConnection, invalidateOutbox, queryClient, user?.id])

  const disconnectGoogle = useCallback(async () => {
    if (!user?.id) {
      toast.error('Please sign in to disconnect Google Calendar')
      return false
    }

    const { data, error: invokeError } = await supabase.functions.invoke('calendar-sync-outbox', {
      body: {
        action: 'disconnectGoogle',
        userId: user.id,
      },
    })

    if (invokeError) {
      console.error('Failed to disconnect Google Calendar:', invokeError)
      const detailedMessage = await extractFunctionInvokeErrorMessage(invokeError)
      toast.error(detailedMessage || invokeError.message || 'Failed to disconnect Google Calendar')
      return false
    }

    const functionError = (data as { error?: string } | null)?.error
    if (functionError) {
      toast.error(functionError)
      return false
    }

    await Promise.all([
      invalidate(),
      invalidateOutbox(),
      queryClient.invalidateQueries({ queryKey: ['events'] }),
      queryClient.invalidateQueries({ queryKey: ['calendar-connection', user.id] }),
    ])
    return true
  }, [invalidate, invalidateOutbox, queryClient, user?.id])

  return {
    connection,
    loading,
    outboxLoading,
    error: error ? (error as Error).message : null,
    outboxStats,
    ensureConnection,
    updateConnection,
    setSyncEnabled,
    setCalendarId,
    setSyncDirection,
    markSyncCompleted,
    runSyncNow,
    syncingNow,
    retryDeadJobs,
    replayRecoverableJobs,
    backfillMissingTaskEvents,
    disconnectGoogle,
    refetch: invalidate,
  }
}
