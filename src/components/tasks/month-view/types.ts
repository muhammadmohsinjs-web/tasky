export type CalendarEventType = 'work' | 'meeting' | 'personal' | 'finance' | 'important'

export interface CalendarEvent {
  id: string
  title: string
  startTime: string
  type: CalendarEventType
}

export interface CalendarDay {
  date: Date
  isToday: boolean
  isCurrentMonth: boolean
  events: CalendarEvent[]
}
