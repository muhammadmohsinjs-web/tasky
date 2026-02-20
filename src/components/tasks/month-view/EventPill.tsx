import type { CalendarEvent } from './types'
import { EVENT_STYLE_MAP } from './eventStyles'

interface EventPillProps {
  event: CalendarEvent
  showDot?: boolean
  onClick: (event: CalendarEvent) => void
}

export function EventPill({ event, showDot = true, onClick }: EventPillProps) {
  const style = EVENT_STYLE_MAP[event.type]

  return (
    <button
      type="button"
      onClick={() => onClick(event)}
      className={`flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1 text-left text-[11px] md:text-xs leading-none transition duration-150 hover:brightness-105 cursor-pointer ${style.pillClassName}`}
      aria-label={`${event.title} at ${event.startTime}`}
    >
      <span className="min-w-0 flex items-center gap-1.5">
        {showDot && <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${style.dotClassName}`} aria-hidden="true" />}
        <span className="truncate font-medium">{event.title}</span>
      </span>
      <span className="shrink-0 font-normal opacity-75">{event.startTime}</span>
    </button>
  )
}
