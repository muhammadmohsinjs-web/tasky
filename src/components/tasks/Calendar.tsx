import { useEffect, useMemo, useState } from 'react'
import type { Category, Task, TaskLink, TaskPriority, TaskStatus } from '../../types'
import { MONTH_NAMES } from '../../lib/constants'
import { CalendarCell } from './month-view/CalendarCell'
import type { CalendarDay, CalendarEvent, CalendarEventType } from './month-view/types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  year: number
  month: number
  tasks: Task[]
  categories: Category[]
  onAdd: (title: string, categoryId: string, date: string, priority?: TaskPriority, extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => Promise<Task | null> | void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  selectedDate?: string | null
  onDateSelect?: (date: string) => void
  completionTick?: number
}

export function Calendar({ year, month, tasks, categories, onAdd, onSelect, selectedDate, onDateSelect, completionTick = 0 }: Props) {
  const [isSmallScreen, setIsSmallScreen] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia('(max-width: 767px)').matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)')
    const handleChange = (event: MediaQueryListEvent) => setIsSmallScreen(event.matches)

    setIsSmallScreen(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const maxVisibleEvents = isSmallScreen ? 2 : 3

  const { days, taskLookup } = useMemo(() => {
    const taskByDate = new Map<string, Task[]>()

    for (const task of tasks) {
      if (!task.date) {
        continue
      }

      const start = parseLocalDate(task.date)
      const end = task.end_date && task.end_date > task.date ? parseLocalDate(task.end_date) : start
      const cursor = new Date(start)

      while (cursor <= end) {
        const key = toDateKey(cursor)
        const existing = taskByDate.get(key) ?? []
        existing.push(task)
        taskByDate.set(key, existing)
        cursor.setDate(cursor.getDate() + 1)
      }
    }

    const firstOfMonth = new Date(year, month, 1)
    const firstDayOffset = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const leadingDays = firstDayOffset
    const cellCount = Math.ceil((leadingDays + daysInMonth) / 7) * 7
    const startDate = new Date(year, month, 1 - leadingDays)

    const todayKey = toDateKey(new Date())

    const monthDays: CalendarDay[] = Array.from({ length: cellCount }, (_, index) => {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + index)
      const dateKey = toDateKey(date)

      return {
        date,
        isToday: dateKey === todayKey,
        isCurrentMonth: date.getMonth() === month,
        events: (taskByDate.get(dateKey) ?? [])
          .slice(0, 8)
          .map((task) => mapTaskToCalendarEvent(task)),
      }
    })

    return { days: monthDays, taskLookup: taskByDate }
  }, [year, month, tasks])

  const weeks = useMemo(() => {
    const rows: CalendarDay[][] = []
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7))
    }
    return rows
  }, [days])

  const handleOpenDay = (date: Date) => {
    onDateSelect?.(toDateKey(date))
  }

  const handleEventClick = (event: CalendarEvent) => {
    const task = tasks.find((candidate) => candidate.id === event.id)
    if (task) {
      onSelect(task, 'view')
    }
  }

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-7 border border-[var(--calendar-grid-border)] border-b-0 bg-[var(--calendar-header-bg)]">
        {DAY_NAMES.map((dayLabel) => (
          <div
            key={dayLabel}
            className="border-r last:border-r-0 border-[var(--calendar-grid-border)] px-2 py-2 text-center text-[11px] md:text-xs font-medium text-[var(--calendar-weekday-text)]"
          >
            {dayLabel}
          </div>
        ))}
      </div>

      <div role="grid" aria-label={`Task calendar for ${MONTH_NAMES[month]} ${year}`} className="space-y-0">
        {weeks.map((week, index) => (
          <div key={`week-${index}`} className="grid grid-cols-7 border-x border-[var(--calendar-grid-border)]">
            {week.map((day) => {
              const dayKey = toDateKey(day.date)
              const selected = selectedDate === dayKey
              const dayEvents = day.isCurrentMonth
                ? day.events
                : []

              const extraDayEvents = !day.isCurrentMonth
                ? []
                : (taskLookup.get(dayKey) ?? []).slice(dayEvents.length)
                    .map((task) => mapTaskToCalendarEvent(task))

              return (
                <CalendarCell
                  key={dayKey}
                  dateKey={dayKey}
                  day={{ ...day, events: [...dayEvents, ...extraDayEvents] }}
                  isSelected={selected}
                  completionTick={completionTick}
                  visibleEventCount={maxVisibleEvents}
                  categories={categories}
                  onAdd={onAdd}
                  onOpenDay={handleOpenDay}
                  onEventClick={handleEventClick}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

function toDateKey(date: Date): string {
  const yearValue = date.getFullYear()
  const monthValue = String(date.getMonth() + 1).padStart(2, '0')
  const dayValue = String(date.getDate()).padStart(2, '0')
  return `${yearValue}-${monthValue}-${dayValue}`
}

function mapTaskToCalendarEvent(task: Task): CalendarEvent {
  return {
    id: task.id,
    title: task.title,
    startTime: getTaskStartTime(task),
    type: getTaskEventType(task),
  }
}

function getTaskStartTime(task: Task): string {
  if (!task.created_at) {
    return 'All day'
  }

  const date = new Date(task.created_at)
  if (Number.isNaN(date.getTime())) {
    return 'All day'
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getTaskEventType(task: Task): CalendarEventType {
  const categoryName = task.category?.name?.toLowerCase() ?? ''
  const categorySlug = task.category?.slug?.toLowerCase() ?? ''

  if (task.priority === 'urgent') {
    return 'important'
  }

  if (categorySlug.includes('meeting') || categoryName.includes('meeting') || categoryName.includes('sync')) {
    return 'meeting'
  }

  if (categorySlug.includes('finance') || categoryName.includes('finance') || categoryName.includes('invoice')) {
    return 'finance'
  }

  if (categorySlug.includes('personal') || categoryName.includes('personal') || categoryName.includes('health')) {
    return 'personal'
  }

  if (categorySlug.includes('important') || categoryName.includes('important')) {
    return 'important'
  }

  return 'work'
}

function parseLocalDate(value: string): Date {
  const [yearPart, monthPart, dayPart] = value.split('-')
  const yearValue = Number(yearPart)
  const monthValue = Number(monthPart)
  const dayValue = Number(dayPart)

  if (!yearValue || !monthValue || !dayValue) {
    return new Date(value)
  }

  return new Date(yearValue, monthValue - 1, dayValue)
}
