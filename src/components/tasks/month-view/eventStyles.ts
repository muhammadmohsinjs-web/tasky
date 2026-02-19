import type { CalendarEventType } from './types'

export interface EventStyleToken {
  pillClassName: string
  dotClassName: string
}

export const EVENT_STYLE_MAP: Record<CalendarEventType, EventStyleToken> = {
  work: {
    pillClassName: 'bg-[var(--calendar-work-bg)] text-[var(--calendar-work-text)]',
    dotClassName: 'bg-[var(--calendar-work-dot)]',
  },
  meeting: {
    pillClassName: 'bg-[var(--calendar-meeting-bg)] text-[var(--calendar-meeting-text)]',
    dotClassName: 'bg-[var(--calendar-meeting-dot)]',
  },
  personal: {
    pillClassName: 'bg-[var(--calendar-personal-bg)] text-[var(--calendar-personal-text)]',
    dotClassName: 'bg-[var(--calendar-personal-dot)]',
  },
  finance: {
    pillClassName: 'bg-[var(--calendar-finance-bg)] text-[var(--calendar-finance-text)]',
    dotClassName: 'bg-[var(--calendar-finance-dot)]',
  },
  important: {
    pillClassName: 'bg-[var(--calendar-important-bg)] text-[var(--calendar-important-text)]',
    dotClassName: 'bg-[var(--calendar-important-dot)]',
  },
}
