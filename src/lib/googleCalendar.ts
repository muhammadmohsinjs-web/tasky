import { supabase } from './supabase'

const GOOGLE_CALENDAR_BASE_URL = 'https://www.googleapis.com/calendar/v3'
const GOOGLE_TASKS_BASE_URL = 'https://tasks.googleapis.com/tasks/v1'

interface GoogleCalendarApiListResponse<T> {
  items?: T[]
}

interface GoogleCalendarDateTime {
  date?: string
  dateTime?: string
  timeZone?: string
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
  summary?: string
  start?: GoogleCalendarDateTime
  end?: GoogleCalendarDateTime
}

export interface GoogleCalendarPreviewData {
  calendars: GoogleCalendarListItem[]
  eventsByCalendar: Record<string, GoogleCalendarEventItem[]>
  taskLists: GoogleTaskListItem[]
  tasksByList: Record<string, GoogleTaskItem[]>
  tasksError?: string
}

export interface GoogleTaskListItem {
  id: string
  title: string
}

export interface GoogleTaskItem {
  id: string
  title?: string
  status?: 'needsAction' | 'completed'
  due?: string
  completed?: string
  notes?: string
}

async function fetchGoogleJson<T>(baseUrl: string, path: string, accessToken: string): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Google Calendar API request failed (${response.status}): ${errorText}`)
  }

  return response.json() as Promise<T>
}

async function getGoogleAccessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const token = session?.provider_token

  if (!token) {
    throw new Error('Missing Google provider token. Please sign out and sign in with Google again.')
  }

  return token
}

export async function fetchGoogleCalendarPreview(): Promise<GoogleCalendarPreviewData> {
  const accessToken = await getGoogleAccessToken()

  const calendarsResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleCalendarListItem>>(
    GOOGLE_CALENDAR_BASE_URL,
    '/users/me/calendarList?maxResults=5',
    accessToken
  )

  const calendars = calendarsResponse.items ?? []
  const eventsByCalendar: Record<string, GoogleCalendarEventItem[]> = {}
  const timeMin = new Date().toISOString()

  await Promise.all(
    calendars.map(async (calendar) => {
      const eventsResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleCalendarEventItem>>(
        GOOGLE_CALENDAR_BASE_URL,
        `/calendars/${encodeURIComponent(calendar.id)}/events?maxResults=10&singleEvents=true&orderBy=startTime&timeMin=${encodeURIComponent(timeMin)}`,
        accessToken
      )

      eventsByCalendar[calendar.id] = eventsResponse.items ?? []
    })
  )

  let taskLists: GoogleTaskListItem[] = []
  const tasksByList: Record<string, GoogleTaskItem[]> = {}
  let tasksError: string | undefined

  try {
    const taskListsResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleTaskListItem>>(
      GOOGLE_TASKS_BASE_URL,
      '/users/@me/lists?maxResults=10',
      accessToken
    )

    taskLists = taskListsResponse.items ?? []

    await Promise.all(
      taskLists.map(async (taskList) => {
        const tasksResponse = await fetchGoogleJson<GoogleCalendarApiListResponse<GoogleTaskItem>>(
          GOOGLE_TASKS_BASE_URL,
          `/lists/${encodeURIComponent(taskList.id)}/tasks?maxResults=50&showCompleted=true&showHidden=true`,
          accessToken
        )

        tasksByList[taskList.id] = tasksResponse.items ?? []
      })
    )
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : 'Failed to fetch Google Tasks data.'
    if (rawMessage.includes('403')) {
      tasksError =
        'Google Tasks API returned 403. Enable Google Tasks API in your Google Cloud project and sign in again to grant tasks.readonly scope.'
    } else {
      tasksError = rawMessage
    }
  }

  return {
    calendars,
    eventsByCalendar,
    taskLists,
    tasksByList,
    tasksError,
  }
}
