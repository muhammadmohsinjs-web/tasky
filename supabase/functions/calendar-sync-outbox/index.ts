import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const MAX_ATTEMPTS = 6
const RETRY_MINUTES = [1, 5, 15, 30, 60, 180]

type OutboxStatus = 'queued' | 'processing' | 'done' | 'failed' | 'dead'
type OutboxOperation = 'upsert' | 'delete'

interface OutboxRow {
  id: number
  user_id: string
  provider: 'google'
  event_id: string | null
  operation: OutboxOperation
  payload: Record<string, unknown> | null
  attempt_count: number
  status: OutboxStatus
}

interface CalendarEventRow {
  id: string
  user_id: string
  title: string
  description: string | null
  start_at: string
  end_at: string
  is_all_day: boolean
  timezone: string
  status: 'confirmed' | 'cancelled'
}

interface GoogleEventResponse {
  id: string
  etag?: string
}

interface CalendarConnectionRow {
  id: string
  user_id: string
  provider: 'google'
  google_calendar_id: string
  sync_enabled: boolean
  google_refresh_token: string | null
  google_access_token: string | null
  google_access_token_expires_at: string | null
}

interface SyncRequestBody {
  action?: 'processOutbox' | 'listGoogleEvents' | 'storeTokens' | 'disconnectGoogle'
  userId?: string
  googleAccessToken?: string
  googleRefreshToken?: string
  limit?: number
  userLimit?: number
  calendarId?: string
  calendarsLimit?: number
  eventsLimit?: number
  timeMin?: string
  timeMax?: string
}

interface ProcessResult {
  processed: number
  succeeded: number
  failed: number
  dead: number
  skipped: number
  usersProcessed: number
  usersSkippedNoToken: number
}

interface GoogleCalendarListResponse {
  items?: Array<{
    id: string
    summary?: string
    primary?: boolean
    timeZone?: string
  }>
}

interface GoogleCalendarEventListResponse {
  items?: Array<{
    id: string
    status?: string
    summary?: string
    description?: string
    start?: { date?: string; dateTime?: string; timeZone?: string }
    end?: { date?: string; dateTime?: string; timeZone?: string }
    htmlLink?: string
    hangoutLink?: string
    location?: string
    attendees?: Array<{
      email?: string
      displayName?: string
      responseStatus?: string
      self?: boolean
      organizer?: boolean
    }>
    conferenceData?: {
      entryPoints?: Array<{
        entryPointType?: string
        uri?: string
        label?: string
      }>
    }
    updated?: string
  }>
}

function getGoogleMeetingLink(event: NonNullable<GoogleCalendarEventListResponse['items']>[number]): string | null {
  const conferenceUri = event.conferenceData?.entryPoints?.find((entryPoint) => (
    entryPoint.entryPointType === 'video' && Boolean(entryPoint.uri)
  ))?.uri
    ?? event.conferenceData?.entryPoints?.find((entryPoint) => Boolean(entryPoint.uri))?.uri
    ?? null

  return conferenceUri ?? event.hangoutLink ?? null
}

class GoogleApiError extends Error {
  status: number
  responseText: string

  constructor(status: number, responseText: string) {
    super(`Google Calendar API request failed (${status}): ${responseText}`)
    this.status = status
    this.responseText = responseText
  }
}

class GoogleTokenRefreshError extends Error {
  status: number
  errorCode: string | null
  errorDescription: string | null

  constructor(status: number, errorCode: string | null, errorDescription: string | null) {
    super(`Google token refresh failed (${status})`)
    this.status = status
    this.errorCode = errorCode
    this.errorDescription = errorDescription
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

function isRetryableGoogleError(error: unknown): boolean {
  if (!(error instanceof GoogleApiError)) return false
  return error.status === 408 || error.status === 409 || error.status === 429 || error.status >= 500
}

function isUnauthorizedGoogleError(error: unknown): boolean {
  return error instanceof GoogleApiError && error.status === 401
}

function retryDelayMinutes(attemptCount: number): number {
  return RETRY_MINUTES[Math.min(attemptCount, RETRY_MINUTES.length - 1)]
}

function extractCalendarId(job: OutboxRow): string {
  const raw = (job.payload ?? {})['calendar_id']
  if (typeof raw === 'string' && raw.trim().length > 0) return raw
  return 'primary'
}

function toGoogleEventBody(event: CalendarEventRow) {
  if (event.is_all_day) {
    return {
      summary: event.title,
      description: event.description ?? undefined,
      start: {
        date: event.start_at.slice(0, 10),
        timeZone: event.timezone,
      },
      end: {
        date: event.end_at.slice(0, 10),
        timeZone: event.timezone,
      },
    }
  }

  return {
    summary: event.title,
    description: event.description ?? undefined,
    start: {
      dateTime: event.start_at,
      timeZone: event.timezone,
    },
    end: {
      dateTime: event.end_at,
      timeZone: event.timezone,
    },
  }
}

async function requestGoogleJson<T>(
  path: string,
  accessToken: string,
  options?: { method?: 'GET' | 'POST' | 'PUT' | 'DELETE'; body?: unknown }
): Promise<T> {
  const response = await fetch(`${GOOGLE_CALENDAR_BASE_URL}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    const responseText = await response.text()
    throw new GoogleApiError(response.status, responseText)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function refreshGoogleAccessToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; expiresIn: number; refreshToken?: string }> {
  const response = await fetch(GOOGLE_OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!response.ok) {
    let errorCode: string | null = null
    let errorDescription: string | null = null

    try {
      const payload = await response.json() as { error?: string; error_description?: string }
      errorCode = payload.error ?? null
      errorDescription = payload.error_description ?? null
    } catch {
      // Ignore non-JSON response bodies.
    }

    throw new GoogleTokenRefreshError(response.status, errorCode, errorDescription)
  }

  const data = await response.json() as {
    access_token?: string
    expires_in?: number
    refresh_token?: string
  }

  if (!data.access_token) {
    throw new Error('Google token refresh did not return an access_token')
  }

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in ?? 3600,
    refreshToken: data.refresh_token,
  }
}

async function markJobResult(
  supabase: ReturnType<typeof createClient>,
  job: OutboxRow,
  result: { status: OutboxStatus; error?: string }
) {
  const attemptCount = result.status === 'done' ? job.attempt_count : job.attempt_count + 1
  const nextAttemptAt =
    result.status === 'failed'
      ? new Date(Date.now() + retryDelayMinutes(attemptCount) * 60 * 1000).toISOString()
      : new Date().toISOString()

  await supabase
    .from('calendar_sync_outbox')
    .update({
      status: result.status,
      attempt_count: attemptCount,
      last_error: result.error ?? null,
      next_attempt_at: nextAttemptAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', job.id)
}

async function processUpsert(
  supabase: ReturnType<typeof createClient>,
  job: OutboxRow,
  accessToken: string
) {
  if (!job.event_id) throw new Error('Outbox job is missing event_id')

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id,user_id,title,description,start_at,end_at,is_all_day,timezone,status')
    .eq('id', job.event_id)
    .eq('user_id', job.user_id)
    .maybeSingle()

  if (eventError) throw eventError
  if (!event) throw new Error(`Linked event not found for ${job.event_id}`)
  if (event.status === 'cancelled') {
    return processDelete(supabase, job, accessToken)
  }

  const { data: mapping, error: mappingError } = await supabase
    .from('external_event_mappings')
    .select('provider_calendar_id,provider_event_id')
    .eq('user_id', job.user_id)
    .eq('event_id', job.event_id)
    .eq('provider', 'google')
    .maybeSingle()

  if (mappingError) throw mappingError

  const calendarId = mapping?.provider_calendar_id ?? extractCalendarId(job)
  const body = toGoogleEventBody(event as CalendarEventRow)

  let googleEvent: GoogleEventResponse
  if (mapping?.provider_event_id) {
    try {
      googleEvent = await requestGoogleJson<GoogleEventResponse>(
        `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(mapping.provider_event_id)}`,
        accessToken,
        { method: 'PUT', body }
      )
    } catch (error) {
      // If the mapped Google event was deleted externally, recreate it and remap.
      if (!(error instanceof GoogleApiError) || error.status !== 404) throw error
      googleEvent = await requestGoogleJson<GoogleEventResponse>(
        `/calendars/${encodeURIComponent(calendarId)}/events`,
        accessToken,
        { method: 'POST', body }
      )
    }
  } else {
    googleEvent = await requestGoogleJson<GoogleEventResponse>(
      `/calendars/${encodeURIComponent(calendarId)}/events`,
      accessToken,
      { method: 'POST', body }
    )
  }

  const { error: upsertError } = await supabase.from('external_event_mappings').upsert(
    {
      user_id: job.user_id,
      event_id: job.event_id,
      provider: 'google',
      provider_calendar_id: calendarId,
      provider_event_id: googleEvent.id,
      provider_etag: googleEvent.etag ?? null,
      sync_state: 'synced',
      last_synced_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,event_id,provider' }
  )

  if (upsertError) throw upsertError
}

async function processDelete(
  supabase: ReturnType<typeof createClient>,
  job: OutboxRow,
  accessToken: string
) {
  if (!job.event_id) return

  const { data: mapping, error: mappingError } = await supabase
    .from('external_event_mappings')
    .select('provider_calendar_id,provider_event_id')
    .eq('user_id', job.user_id)
    .eq('event_id', job.event_id)
    .eq('provider', 'google')
    .maybeSingle()

  if (mappingError) throw mappingError

  if (!mapping?.provider_event_id) {
    const { error } = await supabase
      .from('external_event_mappings')
      .update({
        sync_state: 'disabled',
        last_synced_at: new Date().toISOString(),
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', job.user_id)
      .eq('event_id', job.event_id)
      .eq('provider', 'google')

    if (error) throw error
    return
  }

  try {
    await requestGoogleJson<void>(
      `/calendars/${encodeURIComponent(mapping.provider_calendar_id)}/events/${encodeURIComponent(mapping.provider_event_id)}`,
      accessToken,
      { method: 'DELETE' }
    )
  } catch (error) {
    if (!(error instanceof GoogleApiError) || error.status !== 404) {
      throw error
    }
  }

  const { error } = await supabase
    .from('external_event_mappings')
    .update({
      sync_state: 'disabled',
      last_synced_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', job.user_id)
    .eq('event_id', job.event_id)
    .eq('provider', 'google')

  if (error) throw error
}

async function claimJobs(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  limit: number
): Promise<OutboxRow[]> {
  const nowIso = new Date().toISOString()
  const { data: candidates, error } = await supabase
    .from('calendar_sync_outbox')
    .select('id,user_id,provider,event_id,operation,payload,attempt_count,status')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .in('status', ['queued', 'failed'])
    .lte('next_attempt_at', nowIso)
    .order('id', { ascending: true })
    .limit(limit)

  if (error) throw error
  if (!candidates?.length) return []

  const claimed: OutboxRow[] = []
  for (const candidate of candidates as OutboxRow[]) {
    const { data: row, error: claimError } = await supabase
      .from('calendar_sync_outbox')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', candidate.id)
      .in('status', ['queued', 'failed'])
      .select('id,user_id,provider,event_id,operation,payload,attempt_count,status')
      .maybeSingle()

    if (claimError) throw claimError
    if (row) claimed.push(row as OutboxRow)
  }

  return claimed
}

async function getConnection(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<CalendarConnectionRow | null> {
  const { data, error } = await supabase
    .from('calendar_connections')
    .select('id,user_id,provider,google_calendar_id,sync_enabled,google_refresh_token,google_access_token,google_access_token_expires_at')
    .eq('user_id', userId)
    .eq('provider', 'google')
    .maybeSingle()

  if (error) throw error
  return data as CalendarConnectionRow | null
}

async function persistProvidedTokens(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  googleAccessToken?: string,
  googleRefreshToken?: string
) {
  if (!googleAccessToken && !googleRefreshToken) return

  const tokenUpdate: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (googleAccessToken) {
    tokenUpdate.google_access_token = googleAccessToken
    tokenUpdate.google_access_token_expires_at = new Date(Date.now() + 50 * 60 * 1000).toISOString()
  }
  if (googleRefreshToken) {
    tokenUpdate.google_refresh_token = googleRefreshToken
  }

  const existing = await getConnection(supabase, userId)
  if (existing) {
    const { error } = await supabase
      .from('calendar_connections')
      .update(tokenUpdate)
      .eq('user_id', userId)
      .eq('provider', 'google')

    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('calendar_connections')
    .insert({
      user_id: userId,
      provider: 'google',
      google_calendar_id: 'primary',
      sync_enabled: false,
      sync_direction: 'task_to_google',
      ...tokenUpdate,
    })

  if (error) throw error
}

async function getValidGoogleAccessToken(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  providedAccessToken?: string,
  forceRefresh = false
): Promise<string | null> {
  const connection = await getConnection(supabase, userId)

  if (!forceRefresh && providedAccessToken) {
    console.log('[calendar-sync-outbox] token source: provided access token', { userId })
    return providedAccessToken
  }

  if (!connection) {
    if (forceRefresh) return null
    console.log('[calendar-sync-outbox] token source: provided-only (no connection row)', {
      userId,
      hasProvidedAccessToken: Boolean(providedAccessToken),
    })
    return providedAccessToken ?? null
  }

  const expiresAt = connection.google_access_token_expires_at
  if (!forceRefresh && connection.google_access_token && expiresAt) {
    const msRemaining = new Date(expiresAt).getTime() - Date.now()
    if (msRemaining > 60 * 1000) {
      console.log('[calendar-sync-outbox] token source: stored access token', {
        userId,
        msRemaining,
      })
      return connection.google_access_token
    }
  }

  if (!connection.google_refresh_token) {
    console.log('[calendar-sync-outbox] token source: unavailable (no refresh token)', { userId })
    return null
  }

  const googleClientId = Deno.env.get('GOOGLE_OAUTH_CLIENT_ID')
  const googleClientSecret = Deno.env.get('GOOGLE_OAUTH_CLIENT_SECRET')
  if (!googleClientId || !googleClientSecret) {
    throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID or GOOGLE_OAUTH_CLIENT_SECRET')
  }

  let refreshed: { accessToken: string; expiresIn: number; refreshToken?: string }
  try {
    refreshed = await refreshGoogleAccessToken(
      connection.google_refresh_token,
      googleClientId,
      googleClientSecret
    )
  } catch (error) {
    if (error instanceof GoogleTokenRefreshError && error.errorCode === 'invalid_grant') {
      await supabase
        .from('calendar_connections')
        .update({
          sync_enabled: false,
          google_access_token: null,
          google_access_token_expires_at: null,
          google_refresh_token: null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider', 'google')

      throw new Error('Google authorization expired or revoked. Reconnect Google Calendar to continue sync.')
    }

    throw error
  }

  const { error } = await supabase
    .from('calendar_connections')
    .update({
      google_access_token: refreshed.accessToken,
      google_access_token_expires_at: new Date(Date.now() + Math.max(60, refreshed.expiresIn - 60) * 1000).toISOString(),
      ...(refreshed.refreshToken ? { google_refresh_token: refreshed.refreshToken } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google')

  if (error) throw error
  console.log('[calendar-sync-outbox] token source: refreshed with refresh token', {
    userId,
    expiresIn: refreshed.expiresIn,
  })
  return refreshed.accessToken
}

async function revokeGoogleToken(token: string) {
  const response = await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token }),
  })

  if (!response.ok && response.status !== 400) {
    const responseText = await response.text()
    throw new Error(`Failed to revoke Google token (${response.status}): ${responseText}`)
  }
}

async function disconnectGoogleConnection(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const connection = await getConnection(supabase, userId)
  if (!connection) return { revoked: false, removedMappings: 0, removedOutbox: 0, disabledConnection: false }

  const tokenCandidates = [connection.google_access_token, connection.google_refresh_token]
    .filter((token): token is string => Boolean(token))

  for (const token of tokenCandidates) {
    try {
      await revokeGoogleToken(token)
    } catch (error) {
      console.warn('[calendar-sync-outbox] Google token revoke failed', {
        userId,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const { data: mappingRows, error: mappingSelectError } = await supabase
    .from('external_event_mappings')
    .select('event_id')
    .eq('user_id', userId)
    .eq('provider', 'google')

  if (mappingSelectError) throw mappingSelectError

  const mappedEventIds = (mappingRows ?? [])
    .map((row) => row.event_id as string | null)
    .filter((eventId): eventId is string => Boolean(eventId))

  if (mappedEventIds.length > 0) {
    const { error: linksDeleteError } = await supabase
      .from('task_event_links')
      .delete()
      .eq('user_id', userId)
      .in('event_id', mappedEventIds)

    if (linksDeleteError) throw linksDeleteError
  }

  const { data: deletedMappings, error: mappingsDeleteError } = await supabase
    .from('external_event_mappings')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google')
    .select('id')

  if (mappingsDeleteError) throw mappingsDeleteError

  const { data: deletedOutboxRows, error: outboxDeleteError } = await supabase
    .from('calendar_sync_outbox')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'google')
    .select('id')

  if (outboxDeleteError) throw outboxDeleteError

  const { error: connectionUpdateError } = await supabase
    .from('calendar_connections')
    .update({
      sync_enabled: false,
      google_access_token: null,
      google_access_token_expires_at: null,
      google_refresh_token: null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('provider', 'google')

  if (connectionUpdateError) throw connectionUpdateError

  return {
    revoked: tokenCandidates.length > 0,
    removedMappings: deletedMappings?.length ?? 0,
    removedOutbox: deletedOutboxRows?.length ?? 0,
    disabledConnection: true,
  }
}

async function withGoogleTokenRefreshRetry<T>(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  providedAccessToken: string | undefined,
  operation: (accessToken: string) => Promise<T>
): Promise<T> {
  const firstToken = await getValidGoogleAccessToken(supabase, userId, providedAccessToken)
  if (!firstToken) {
    throw new Error('Missing Google access token and refresh token for this user')
  }

  try {
    return await operation(firstToken)
  } catch (error) {
    if (!isUnauthorizedGoogleError(error)) throw error

    const refreshedToken = await getValidGoogleAccessToken(supabase, userId, undefined, true)
    if (!refreshedToken) throw error

    return operation(refreshedToken)
  }
}

async function listGoogleEvents(
  accessToken: string,
  params: {
    calendarId?: string
    calendarsLimit: number
    eventsLimit: number
    timeMin: string
    timeMax: string
  }
) {
  console.log('[calendar-sync-outbox] listGoogleEvents start', {
    calendarId: params.calendarId ?? null,
    calendarsLimit: params.calendarsLimit,
    eventsLimit: params.eventsLimit,
    timeMin: params.timeMin,
  })
  let calendars: Array<{ id: string; summary: string; primary: boolean; timeZone: string | null }> = []

  if (params.calendarId) {
    calendars = [{ id: params.calendarId, summary: params.calendarId, primary: params.calendarId === 'primary', timeZone: null }]
  } else {
    const calendarListResponse = await requestGoogleJson<GoogleCalendarListResponse>(
      `/users/me/calendarList?maxResults=${params.calendarsLimit}`,
      accessToken
    )

    calendars = (calendarListResponse.items ?? []).map((calendar) => ({
      id: calendar.id,
      summary: calendar.summary ?? calendar.id,
      primary: Boolean(calendar.primary),
      timeZone: calendar.timeZone ?? null,
    }))
  }

  const eventsByCalendar = await Promise.all(
    calendars.map(async (calendar) => {
      const eventsResponse = await requestGoogleJson<GoogleCalendarEventListResponse>(
        `/calendars/${encodeURIComponent(calendar.id)}/events?maxResults=${params.eventsLimit}&singleEvents=true&orderBy=startTime&conferenceDataVersion=1&timeMin=${encodeURIComponent(params.timeMin)}&timeMax=${encodeURIComponent(params.timeMax)}`,
        accessToken
      )

      const events = (eventsResponse.items ?? []).map((event) => ({
        meetingLink: getGoogleMeetingLink(event),
        joinLink: getGoogleMeetingLink(event),
        id: event.id,
        status: event.status ?? 'confirmed',
        summary: event.summary ?? null,
        description: event.description ?? null,
        htmlLink: event.htmlLink ?? null,
        location: event.location ?? null,
        attendees: (event.attendees ?? [])
          .map((attendee) => ({
            email: attendee.email ?? null,
            displayName: attendee.displayName ?? null,
            responseStatus: attendee.responseStatus ?? null,
            self: Boolean(attendee.self),
            organizer: Boolean(attendee.organizer),
          }))
          .filter((attendee) => attendee.email || attendee.displayName),
        updated: event.updated ?? null,
        start: event.start ?? null,
        end: event.end ?? null,
        calendarId: calendar.id,
        calendarSummary: calendar.summary,
        calendarPrimary: calendar.primary,
      }))

      return events
    })
  )

  console.log('[calendar-sync-outbox] listGoogleEvents result', {
    calendars: calendars.length,
    events: eventsByCalendar.reduce((acc, list) => acc + list.length, 0),
  })

  return {
    calendars,
    events: eventsByCalendar.flat(),
  }
}

async function processJobsForUser(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  accessToken: string,
  limit: number,
  result: ProcessResult
) {
  const jobs = await claimJobs(supabase, userId, limit)
  if (!jobs.length) {
    result.skipped += 1
    return
  }

  for (const job of jobs) {
    result.processed += 1

    try {
      let effectiveAccessToken = accessToken
      const runJob = async () => {
        if (job.operation === 'upsert') {
          await processUpsert(supabase, job, effectiveAccessToken)
        } else {
          await processDelete(supabase, job, effectiveAccessToken)
        }
      }

      try {
        await runJob()
      } catch (error) {
        if (!isUnauthorizedGoogleError(error)) throw error

        const refreshedAccessToken = await getValidGoogleAccessToken(supabase, userId, undefined, true)
        if (!refreshedAccessToken) throw error
        effectiveAccessToken = refreshedAccessToken
        await runJob()
      }

      await markJobResult(supabase, job, { status: 'done' })
      result.succeeded += 1

      await supabase
        .from('calendar_connections')
        .update({ last_sync_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('user_id', job.user_id)
        .eq('provider', 'google')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown sync error'
      const retryable = isRetryableGoogleError(error) && job.attempt_count + 1 < MAX_ATTEMPTS
      const nextStatus: OutboxStatus = retryable ? 'failed' : 'dead'

      await markJobResult(supabase, job, { status: nextStatus, error: message })

      if (job.event_id) {
        await supabase
          .from('external_event_mappings')
          .update({
            sync_state: 'error',
            last_error: message,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', job.user_id)
          .eq('event_id', job.event_id)
          .eq('provider', 'google')
      }

      if (nextStatus === 'failed') {
        result.failed += 1
      } else {
        result.dead += 1
      }
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const cronSecret = Deno.env.get('CALENDAR_SYNC_CRON_SECRET')

  if (!supabaseUrl || !serviceRoleKey) {
    return json(500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables' })
  }

  let body: SyncRequestBody = {}
  try {
    body = (await req.json()) as SyncRequestBody
  } catch {
    return json(400, { error: 'Invalid JSON body' })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)
  const action = body.action ?? 'processOutbox'
  const limit = Math.min(Math.max(body.limit ?? 25, 1), 100)
  const userLimit = Math.min(Math.max(body.userLimit ?? 20, 1), 100)
  const authHeader = req.headers.get('Authorization') ?? ''
  const hasCronSecret = Boolean(cronSecret) && req.headers.get('x-sync-secret') === cronSecret

  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    dead: 0,
    skipped: 0,
    usersProcessed: 0,
    usersSkippedNoToken: 0,
  }

  try {
    console.log('[calendar-sync-outbox] request received', {
      action,
      method: req.method,
      hasCronSecret,
      hasAuthHeader: Boolean(authHeader),
      requestedUserId: body.userId ?? null,
    })

    if (hasCronSecret) {
      let userIds: string[] = []

      if (body.userId) {
        userIds = [body.userId]
      } else {
        const { data, error } = await supabase
          .from('calendar_connections')
          .select('user_id')
          .eq('provider', 'google')
          .eq('sync_enabled', true)
          .not('google_refresh_token', 'is', null)
          .limit(userLimit)

        if (error) throw error
        userIds = (data ?? []).map((row) => row.user_id as string)
      }

      for (const userId of userIds) {
        const accessToken = await getValidGoogleAccessToken(supabase, userId)
        if (!accessToken) {
          result.usersSkippedNoToken += 1
          continue
        }

        await processJobsForUser(supabase, userId, accessToken, limit, result)
        result.usersProcessed += 1
      }
    } else {
      if (!authHeader) return json(401, { error: 'Missing Authorization header' })

      const callerClient = createClient(supabaseUrl, serviceRoleKey, {
        global: { headers: { Authorization: authHeader } },
      })

      const {
        data: { user },
        error: userError,
      } = await callerClient.auth.getUser()

      if (userError || !user) return json(401, { error: 'Invalid user session' })

      const userId = body.userId ?? user.id
      if (userId !== user.id) {
        return json(403, { error: 'Cannot process outbox for another user' })
      }

      await persistProvidedTokens(supabase, userId, body.googleAccessToken, body.googleRefreshToken)

      if (action === 'storeTokens') {
        return json(200, { ok: true, persisted: true })
      }

      if (action === 'disconnectGoogle') {
        const disconnected = await disconnectGoogleConnection(supabase, userId)
        return json(200, { ok: true, disconnected })
      }

      if (action === 'listGoogleEvents') {
        const calendarsLimit = Math.min(Math.max(body.calendarsLimit ?? 10, 1), 25)
        const eventsLimit = Math.min(Math.max(body.eventsLimit ?? 30, 1), 100)
        const defaultMonthStart = new Date()
        defaultMonthStart.setDate(1)
        defaultMonthStart.setHours(0, 0, 0, 0)
        const defaultMonthEnd = new Date(defaultMonthStart)
        defaultMonthEnd.setMonth(defaultMonthEnd.getMonth() + 1)
        const timeMin = body.timeMin && !Number.isNaN(new Date(body.timeMin).getTime())
          ? new Date(body.timeMin).toISOString()
          : defaultMonthStart.toISOString()
        const timeMax = body.timeMax && !Number.isNaN(new Date(body.timeMax).getTime())
          ? new Date(body.timeMax).toISOString()
          : defaultMonthEnd.toISOString()

        const payload = await withGoogleTokenRefreshRetry(
          supabase,
          userId,
          body.googleAccessToken,
          (accessToken) => listGoogleEvents(accessToken, {
            calendarId: body.calendarId,
            calendarsLimit,
            eventsLimit,
            timeMin,
            timeMax,
          })
        )

        console.log('[calendar-sync-outbox] listGoogleEvents completed', {
          userId,
          calendars: payload.calendars.length,
          events: payload.events.length,
        })
        return json(200, { ok: true, ...payload })
      }

      const accessToken = await getValidGoogleAccessToken(supabase, userId, body.googleAccessToken)
      if (!accessToken) {
        return json(400, { error: 'Missing Google access token and refresh token for this user' })
      }

      await processJobsForUser(supabase, userId, accessToken, limit, result)
      result.usersProcessed = 1
    }

    return json(200, { ok: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected outbox processor error'
    console.error('[calendar-sync-outbox] request failed', {
      action,
      error: message,
    })
    return json(500, { error: message, ...result })
  }
})
