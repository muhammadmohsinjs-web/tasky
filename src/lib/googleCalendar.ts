import { supabase } from './supabase'

const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3'

interface GoogleCalendarApiListResponse<T> {
  items?: T[]
}

interface GoogleCalendarDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
}

interface GoogleRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
}

export interface GoogleCalendarListItem {
  id: string
  summary: string
  primary?: boolean
  timeZone?: string
}

export interface GoogleCalendarEventItem {
  id: string
  status: string
  etag?: string
  summary?: string
  description?: string
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
  start?: GoogleCalendarDateTime
  end?: GoogleCalendarDateTime
}

export interface GoogleCalendarEventUpsertInput {
  summary: string
  description?: string | null
  start: GoogleCalendarDateTime
  end: GoogleCalendarDateTime
}

export interface GoogleCalendarPreviewData {
  calendars: GoogleCalendarListItem[]
  eventsByCalendar: Record<string, GoogleCalendarEventItem[]>
}

async function requestGoogleJson<T>(
  baseUrl: string,
  path: string,
  accessToken: string,
  options?: GoogleRequestOptions
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Calendar API request failed (${response.status}): ${errorText}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function fetchGoogleJson<T>(baseUrl: string, path: string, accessToken: string): Promise<T> {
  return requestGoogleJson<T>(baseUrl, path, accessToken)
}

export async function fetchGoogleCalendarPreview(
  googleAccessToken?: string,
  options?: { timeMin?: string; timeMax?: string; calendarMaxResults?: number; eventsMaxResults?: number }
): Promise<GoogleCalendarPreviewData> {
  let accessToken = googleAccessToken

  if (!accessToken) {
    // Fallback: try to get from session (only works right after OAuth sign-in)
    const { data: { session } } = await supabase.auth.getSession()
    accessToken = session?.provider_token ?? undefined
  }

  if (!accessToken) {
    throw new Error('Missing Google provider token. Please sign out and sign in with Google again.')
  }

  const calendarsResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleCalendarListItem>>(
    GOOGLE_CALENDAR_BASE_URL,
    `/users/me/calendarList?maxResults=${Math.min(Math.max(options?.calendarMaxResults ?? 10, 1), 25)}`,
    accessToken
  )

  const calendars = calendarsResponse.items ?? []
  const eventsByCalendar: Record<string, GoogleCalendarEventItem[]> = {}
  const defaultMonthStart = new Date()
  defaultMonthStart.setDate(1)
  defaultMonthStart.setHours(0, 0, 0, 0)
  const defaultMonthEnd = new Date(defaultMonthStart)
  defaultMonthEnd.setMonth(defaultMonthEnd.getMonth() + 1)
  const timeMin = options?.timeMin ?? defaultMonthStart.toISOString()
  const timeMax = options?.timeMax ?? defaultMonthEnd.toISOString()
  const eventsMaxResults = Math.min(Math.max(options?.eventsMaxResults ?? 50, 1), 100)

  await Promise.all(
    calendars.map(async (calendar) => {
      const eventsResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleCalendarEventItem>>(
        GOOGLE_CALENDAR_BASE_URL,
        `/calendars/${encodeURIComponent(calendar.id)}/events?maxResults=${eventsMaxResults}&singleEvents=true&orderBy=startTime&conferenceDataVersion=1&timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}`,
        accessToken
      )

      eventsByCalendar[calendar.id] = eventsResponse.items ?? []
    })
  )

  return {
    calendars,
    eventsByCalendar,
  }
}

export async function createGoogleCalendarEvent(
  calendarId: string,
  event: GoogleCalendarEventUpsertInput,
  accessToken: string
): Promise<GoogleCalendarEventItem> {

  return requestGoogleJson<GoogleCalendarEventItem>(
    GOOGLE_CALENDAR_BASE_URL,
    `/calendars/${encodeURIComponent(calendarId)}/events`,
    accessToken,
    {
      method: 'POST',
      body: {
        summary: event.summary,
        description: event.description ?? undefined,
        start: event.start,
        end: event.end,
      },
    }
  )
}

export async function updateGoogleCalendarEvent(
  calendarId: string,
  eventId: string,
  event: GoogleCalendarEventUpsertInput,
  accessToken: string
): Promise<GoogleCalendarEventItem> {

  return requestGoogleJson<GoogleCalendarEventItem>(
    GOOGLE_CALENDAR_BASE_URL,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    {
      method: 'PUT',
      body: {
        summary: event.summary,
        description: event.description ?? undefined,
        start: event.start,
        end: event.end,
      },
    }
  )
}

export async function deleteGoogleCalendarEvent(calendarId: string, eventId: string, accessToken: string): Promise<void> {

  await requestGoogleJson<void>(
    GOOGLE_CALENDAR_BASE_URL,
    `/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    accessToken,
    { method: 'DELETE' }
  )
}
