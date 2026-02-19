import { useEffect, useState } from 'react'
import { AddTaskInline } from '../AddTaskInline'
import type { CalendarDay, CalendarEvent } from './types'
import type { Category, Task, TaskLink, TaskPriority, TaskStatus } from '../../../types'
import { EventPill } from './EventPill'

interface CalendarCellProps {
  day: CalendarDay
  dateKey: string
  isSelected?: boolean
  completionTick?: number
  visibleEventCount: number
  categories: Category[]
  onAdd: (title: string, categoryId: string, date: string, priority?: TaskPriority, extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => Promise<Task | null> | void
  onOpenDay: (date: Date) => void
  onEventClick: (event: CalendarEvent) => void
}

export function CalendarCell({
  day,
  dateKey,
  isSelected = false,
  completionTick = 0,
  visibleEventCount,
  categories,
  onAdd,
  onOpenDay,
  onEventClick,
}: CalendarCellProps) {
  const [celebrating, setCelebrating] = useState(false)
  const visibleEvents = day.events.slice(0, visibleEventCount)
  const hiddenEventCount = Math.max(day.events.length - visibleEventCount, 0)
  const dayNumber = day.date.getDate()

  useEffect(() => {
    if (!day.isToday || completionTick <= 0) return
    setCelebrating(true)
    const timer = window.setTimeout(() => setCelebrating(false), 280)
    return () => window.clearTimeout(timer)
  }, [day.isToday, completionTick])

  return (
    <div
      className={`relative min-h-[120px] md:min-h-[140px] overflow-hidden border border-[var(--calendar-grid-border)] p-2 transition-colors hover:bg-[var(--calendar-cell-hover)] ${
        day.isCurrentMonth ? 'bg-[var(--calendar-cell-bg)]' : 'bg-[var(--calendar-cell-muted)]'
      } ${isSelected ? 'ring-2 ring-inset ring-[var(--calendar-selected-ring)]' : ''} ${celebrating ? 'animate-done-pulse' : ''}`}
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

      {day.isCurrentMonth && (
        <div className="mt-1.5">
          <AddTaskInline date={dateKey} onAdd={onAdd} categories={categories} />
        </div>
      )}
    </div>
  )
}
