import type { CalendarDay, CalendarEvent } from './types'
import { EventPill } from './EventPill'

interface CalendarCellProps {
  day: CalendarDay
  isSelected?: boolean
  visibleEventCount: number
  onOpenDay: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarCell({ day, isSelected = false, visibleEventCount, onOpenDay, onEventClick }: CalendarCellProps) {
  const visibleEvents = day.events.slice(0, visibleEventCount)
  const hiddenEventCount = Math.max(day.events.length - visibleEventCount, 0)
  const dayNumber = day.date.getDate()

  return (
    <div
      className={`relative min-h-[120px] md:min-h-[140px] overflow-hidden border border-[var(--calendar-grid-border)] p-2 transition-colors hover:bg-[var(--calendar-cell-hover)] ${
        day.isCurrentMonth ? 'bg-[var(--calendar-cell-bg)]' : 'bg-[var(--calendar-cell-muted)]'
      } ${isSelected ? 'ring-2 ring-inset ring-[var(--calendar-selected-ring)]' : ''}`}
      role="gridcell"
      aria-label={day.date.toDateString()}
    >
      <button
        type="button"
        onClick={() => onOpenDay(day.date)}
        className="mb-2 flex h-6 items-center justify-center rounded-full px-1.5 text-[11px] md:text-xs font-medium text-[var(--calendar-date-text)] cursor-pointer"
      >
        {day.isToday ? (
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--calendar-today-bg)] text-white">
            {dayNumber}
          </span>
        ) : (
          dayNumber
        )}
      </button>

      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <EventPill key={event.id} event={event} onClick={onEventClick} />
        ))}

        {hiddenEventCount > 0 && (
          <button
            type="button"
            onClick={() => onOpenDay(day.date)}
            className="text-[11px] md:text-xs text-[var(--calendar-overflow-text)] hover:text-[var(--calendar-overflow-text-hover)] cursor-pointer"
          >
            {hiddenEventCount} more…
          </button>
        )}
      </div>
    </div>
  )
}
