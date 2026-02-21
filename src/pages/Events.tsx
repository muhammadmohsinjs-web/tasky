import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, CalendarDays, CalendarRange, LayoutList, Link2 } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import type { EventWithTask } from '../hooks/useEvents'
import { useCalendarSyncSettings } from '../hooks/useCalendarSyncSettings'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getSyncBadge } from '../lib/eventSync'

type SyncFilter = 'all' | 'synced' | 'pending' | 'failed' | 'dead' | 'disabled' | 'unknown'
type LayoutMode = 'calendar' | 'list'
type CalendarView = 'day' | 'week' | 'month'

interface CalendarEventUI extends EventWithTask {
  startDate: Date
  endDate: Date
  displayTime: string
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfWeek(date: Date) {
  const day = startOfDay(date)
  return addDays(day, -day.getDay())
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b)
}

function isSameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatRangeLabel(anchorDate: Date, view: CalendarView) {
  if (view === 'day') {
    return formatDayLabel(anchorDate)
  }

  if (view === 'week') {
    const weekStart = startOfWeek(anchorDate)
    const weekEnd = addDays(weekStart, 6)
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth() && weekStart.getFullYear() === weekEnd.getFullYear()

    if (sameMonth) {
      return `${weekStart.toLocaleDateString('en-US', { month: 'long' })} ${weekStart.getDate()}-${weekEnd.getDate()}, ${weekEnd.getFullYear()}`
    }

    return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }

  return anchorDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })
}

function formatListGroupLabel(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function toEventTimeLabel(event: EventWithTask) {
  if (event.is_all_day) return 'All day'

  const start = new Date(event.start_at)
  const end = new Date(event.end_at)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 'Time unavailable'

  return `${start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

function normalizeEvents(events: EventWithTask[]): CalendarEventUI[] {
  return events
    .map((event) => {
      const startDate = new Date(event.start_at)
      const endDate = new Date(event.end_at)
      return {
        ...event,
        startDate,
        endDate,
        displayTime: toEventTimeLabel(event),
      }
    })
    .filter((event) => !Number.isNaN(event.startDate.getTime()) && !Number.isNaN(event.endDate.getTime()))
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
}

function buildEventsByDay(events: CalendarEventUI[]) {
  const map = new Map<string, CalendarEventUI[]>()

  for (const event of events) {
    const from = startOfDay(event.startDate)
    const to = startOfDay(event.endDate)
    const daySpan = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)) + 1)

    for (let i = 0; i < Math.min(daySpan, 31); i += 1) {
      const day = addDays(from, i)
      const key = dateKey(day)
      const list = map.get(key) ?? []
      list.push(event)
      map.set(key, list)
    }
  }

  for (const [key, list] of map.entries()) {
    map.set(key, list.sort((a, b) => a.startDate.getTime() - b.startDate.getTime()))
  }

  return map
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function EventCard({ event, onOpenTask }: { event: CalendarEventUI; onOpenTask: (id: string) => void }) {
  const badge = getSyncBadge(event.sync_status ?? 'unknown')
  const descriptionText = event.description ? stripHtml(event.description) : ''

  return (
    <article className="w-full min-w-0 rounded-2xl border border-[#DEE7F4] bg-white p-3 shadow-[0_8px_18px_rgba(15,23,42,0.06)] md:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="event-card-title min-w-0 flex-1 break-words text-sm font-semibold leading-[1.35] tracking-[-0.015em] text-[#1E3353] sm:text-base md:text-xl">
          {event.title}
        </h3>
        <span className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-[0.01em] sm:text-[11px] ${badge.classes}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-2 text-xs font-semibold tracking-[-0.01em] text-[#335B8D] sm:text-sm md:text-base">{event.displayTime}</p>
      {descriptionText ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#7185A3] sm:text-sm sm:leading-6">{descriptionText}</p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[#5A6F8F] sm:text-xs md:text-sm">
        {event.is_external_google_event ? (
          <span className="max-w-full truncate rounded-full border border-[#D4E1F4] bg-[#F4F8FF] px-2.5 py-1 font-medium">
            Google{event.provider_calendar_name ? ` • ${event.provider_calendar_name}` : ''}
          </span>
        ) : (
          <span className="rounded-full border border-[#D4E1F4] bg-[#F4F8FF] px-2.5 py-1 font-medium">Tasky</span>
        )}
        {event.sync_error && (event.sync_status === 'failed' || event.sync_status === 'dead') ? (
          <span className="rounded-full border border-[#F4D4D4] bg-[#FFF3F3] px-2.5 py-1 text-[#A33A3A]">
            {event.sync_error.slice(0, 70)}
          </span>
        ) : null}
      </div>
      {event.linked_task ? (
        <button
          onClick={() => onOpenTask(event.linked_task!.id)}
          className="mt-3 inline-flex max-w-full items-center gap-1 overflow-hidden rounded-lg border border-[#C9D8F0] bg-[#F9FBFF] px-2.5 py-1.5 text-[11px] font-medium text-[#2C4D7A] hover:bg-[#F3F8FF] sm:text-xs md:text-sm"
        >
          <Link2 className="h-3 w-3 shrink-0" />
          <span className="truncate">{event.linked_task.title}</span>
        </button>
      ) : null}
    </article>
  )
}

export default function Events() {
  const navigate = useNavigate()
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all')
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('calendar')
  const [calendarView, setCalendarView] = useState<CalendarView>('month')
  const [anchorDate, setAnchorDate] = useState<Date>(startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()))
  const { connection } = useCalendarSyncSettings()

  const queryRange = useMemo(() => {
    if (calendarView === 'day') {
      const start = startOfDay(anchorDate)
      const end = addDays(start, 1)
      return { timeMin: start.toISOString(), timeMax: end.toISOString() }
    }

    if (calendarView === 'week') {
      const start = startOfWeek(anchorDate)
      const end = addDays(start, 7)
      return { timeMin: start.toISOString(), timeMax: end.toISOString() }
    }

    const monthStart = startOfMonth(anchorDate)
    const gridStart = startOfWeek(monthStart)
    const gridEnd = addDays(gridStart, 42)
    return { timeMin: gridStart.toISOString(), timeMax: gridEnd.toISOString() }
  }, [anchorDate, calendarView])
  const { events, loading } = useEvents({
    timeMin: queryRange.timeMin,
    timeMax: queryRange.timeMax,
    limit: 400,
    calendarId: connection?.google_calendar_id ?? null,
  })

  const visibleEvents = useMemo(() => {
    const scoped = syncFilter === 'all'
      ? events
      : events.filter((event) => (event.sync_status ?? 'unknown') === syncFilter)
    return normalizeEvents(scoped)
  }, [events, syncFilter])

  const eventsByDay = useMemo(() => buildEventsByDay(visibleEvents), [visibleEvents])

  const selectedDateEvents = useMemo(
    () => eventsByDay.get(dateKey(selectedDate)) ?? [],
    [eventsByDay, selectedDate]
  )

  const monthCells = useMemo(() => {
    const first = startOfMonth(anchorDate)
    const firstGridDate = startOfWeek(first)
    return Array.from({ length: 42 }, (_, index) => addDays(firstGridDate, index))
  }, [anchorDate])

  const weekDates = useMemo(() => {
    const weekStart = startOfWeek(anchorDate)
    return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index))
  }, [anchorDate])

  const monthDates = useMemo(() => {
    const monthStart = startOfMonth(anchorDate)
    const monthEnd = endOfMonth(anchorDate)
    const dates: Date[] = []
    for (let day = new Date(monthStart); day <= monthEnd; day = addDays(day, 1)) {
      dates.push(new Date(day))
    }
    return dates
  }, [anchorDate])

  const compactDates = useMemo(() => {
    if (calendarView === 'day') return [selectedDate]
    if (calendarView === 'week') return weekDates
    return monthDates
  }, [calendarView, monthDates, selectedDate, weekDates])

  const listGrouped = useMemo(() => {
    const ordered = Array.from(eventsByDay.entries())
      .sort(([a], [b]) => new Date(`${a}T00:00:00`).getTime() - new Date(`${b}T00:00:00`).getTime())
      .filter(([date]) => (eventsByDay.get(date)?.length ?? 0) > 0)

    return ordered
  }, [eventsByDay])

  const periodCount = useMemo(() => {
    if (calendarView === 'day') {
      return selectedDateEvents.length
    }

    if (calendarView === 'week') {
      return weekDates.reduce((acc, day) => acc + (eventsByDay.get(dateKey(day))?.length ?? 0), 0)
    }

    const monthStart = startOfMonth(anchorDate)
    const monthEnd = endOfMonth(anchorDate)
    let total = 0
    for (let day = new Date(monthStart); day <= monthEnd; day = addDays(day, 1)) {
      total += eventsByDay.get(dateKey(day))?.length ?? 0
    }
    return total
  }, [anchorDate, calendarView, eventsByDay, selectedDateEvents.length, weekDates])

  const openTaskFromEvent = (taskId: string) => {
    sessionStorage.setItem('tasky:openTaskId', taskId)
    navigate('/tasks')
  }

  const goToToday = () => {
    const today = startOfDay(new Date())
    setAnchorDate(today)
    setSelectedDate(today)
  }

  const navigatePeriod = (direction: 'prev' | 'next') => {
    const delta = direction === 'next' ? 1 : -1

    if (calendarView === 'day') {
      const next = addDays(anchorDate, delta)
      setAnchorDate(next)
      setSelectedDate(next)
      return
    }

    if (calendarView === 'week') {
      const next = addDays(anchorDate, delta * 7)
      setAnchorDate(next)
      setSelectedDate(startOfWeek(next))
      return
    }

    const next = new Date(anchorDate.getFullYear(), anchorDate.getMonth() + delta, 1)
    setAnchorDate(next)
    setSelectedDate(startOfDay(next))
  }

  if (loading) {
    return <LoadingSpinner message="Loading events..." />
  }

  return (
    <div className="content-wrap content-wrap-wide overflow-x-hidden pt-20 lg:pt-7">
      <div className="page-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="page-kicker">Calendar</span>
            <h1>Events Workspace</h1>
            <p className="page-subtitle">
              {connection?.sync_enabled
                ? `Showing Tasky + Google events for ${connection?.google_calendar_id ?? 'primary'}`
                : 'Showing Tasky events (Google sync disabled)'}
            </p>
          </div>
          <div className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-3 py-1.5 text-xs font-medium text-[#38557C]">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            {visibleEvents.length} events
          </div>
        </div>
      </div>

      <section className="panel overflow-x-hidden">
        <header className="panel-header flex-wrap">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setLayoutMode('calendar')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${layoutMode === 'calendar' ? 'border-[#AFC7F4] bg-[#EAF2FF] text-[#184593]' : 'border-[#D9E5F6] bg-white text-[#5C6E8A]'}`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              Calendar
            </button>
            <button
              onClick={() => setLayoutMode('list')}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${layoutMode === 'list' ? 'border-[#AFC7F4] bg-[#EAF2FF] text-[#184593]' : 'border-[#D9E5F6] bg-white text-[#5C6E8A]'}`}
            >
              <LayoutList className="h-3.5 w-3.5" />
              List
            </button>
          </div>

          <button onClick={() => navigate('/tasks')} className="btn btn-ghost !px-2 !py-1 text-xs">
            Open Tasks <ArrowRight className="h-3 w-3" />
          </button>
        </header>

        <div className="panel-body space-y-4">
          <div className="flex flex-wrap gap-2">
            {(['all', 'synced', 'pending', 'failed', 'dead', 'disabled', 'unknown'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSyncFilter(filter)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                  syncFilter === filter
                    ? 'border-[#AFC7F4] bg-[#EAF2FF] text-[#184593]'
                    : 'border-[#D9E5F6] bg-[#F6FAFF] text-[#5C6E8A]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[#DDE7F4] bg-gradient-to-br from-[#F7FAFF] to-[#FCFDFF] p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="inline-flex rounded-full border border-[#D5E3F7] bg-white p-1">
                {(['day', 'week', 'month'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCalendarView(view)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                      calendarView === view ? 'bg-[#1D4ED8] text-white shadow-sm' : 'text-[#4F6788] hover:bg-[#F1F6FF]'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>

              <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:flex-wrap md:items-center">
                <p className="w-full text-center text-xs font-semibold text-[#2A4568] md:min-w-[180px] md:w-auto md:text-sm">
                  {formatRangeLabel(anchorDate, calendarView)}
                </p>
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => navigatePeriod('prev')} className="btn btn-secondary !h-9 !px-3">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => navigatePeriod('next')} className="btn btn-secondary !h-9 !px-3">
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button onClick={goToToday} className="btn btn-secondary !h-9 !px-3 !text-xs">
                    Today
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-2 text-[11px] font-medium tracking-[0.01em] text-[#607999] md:text-xs">
              {periodCount} {periodCount === 1 ? 'event' : 'events'} in current view
            </p>
          </div>

          {visibleEvents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#CEDAEC] bg-[#F9FBFF] p-8 text-center text-sm text-[#7086A6]">
              No events match current filters.
            </div>
          ) : layoutMode === 'list' ? (
            <div className="space-y-5">
              {listGrouped.map(([date, dayEvents]) => (
                <section key={date} className="rounded-2xl border border-[#E3EAF4] bg-[#FAFCFF] p-4">
                  <h2 className="mb-3 text-2xl font-bold leading-tight tracking-[-0.02em] text-[#142847] md:text-3xl">
                    {formatListGroupLabel(date)}
                  </h2>
                  <div className="space-y-2">
                    {dayEvents.map((event) => (
                      <EventCard key={event.id} event={event} onOpenTask={openTaskFromEvent} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="grid min-w-0 gap-4 min-[1200px]:grid-cols-[1.6fr_1fr]">
              <div className="min-w-0 overflow-hidden rounded-2xl border border-[#DDE6F3] bg-white p-3">
                {calendarView !== 'day' ? (
                  <div className="mb-3 min-w-0 max-w-full md:hidden">
                    <div className="flex w-full min-w-0 max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 touch-pan-x [-webkit-overflow-scrolling:touch]">
                      {compactDates.map((day) => {
                        const key = dateKey(day)
                        const dayEvents = eventsByDay.get(key) ?? []
                        const isSelected = isSameDay(day, selectedDate)
                        const isToday = isSameDay(day, startOfDay(new Date()))

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDate(day)}
                            className={`min-w-[72px] shrink-0 snap-start rounded-xl border px-3 py-2 text-left ${
                              isSelected
                                ? 'border-[#9FBEF2] bg-[#EAF3FF]'
                                : 'border-[#DCE7F6] bg-white'
                            }`}
                          >
                            <p className={`text-[11px] font-semibold uppercase ${isToday ? 'text-[#1D4ED8]' : 'text-[#58749A]'}`}>
                              {day.toLocaleDateString('en-US', { weekday: 'short' })}
                            </p>
                            <p className="text-sm font-semibold text-[#2A4568]">{day.getDate()}</p>
                            <p className="text-[10px] text-[#6B84A6]">{dayEvents.length} evt</p>
                          </button>
                        )
                      })}
                    </div>

                    <div className="mt-2.5 space-y-2">
                      {selectedDateEvents.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-[#D6E1F2] bg-white p-3 text-xs text-[#7085A4]">
                          No events for this day.
                        </div>
                      ) : (
                        selectedDateEvents.map((event) => (
                          <EventCard key={event.id} event={event} onOpenTask={openTaskFromEvent} />
                        ))
                      )}
                    </div>
                  </div>
                ) : null}

                {calendarView === 'month' ? (
                  <>
                    <p className="mb-2 hidden text-[11px] text-[#7A8FAD] md:block">Swipe horizontally to browse the month</p>
                    <div className="hidden overflow-x-auto pb-1 md:block">
                      <div className="min-w-[780px]">
                        <div className="grid grid-cols-7 gap-1 border-b border-[#E7EEF8] pb-2">
                          {WEEKDAYS.map((label) => (
                            <div key={label} className="text-center text-[11px] font-semibold uppercase tracking-wide text-[#7084A3]">
                              {label}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 grid grid-cols-7 gap-2">
                          {monthCells.map((day) => {
                            const key = dateKey(day)
                            const dayEvents = eventsByDay.get(key) ?? []
                            const isSelected = isSameDay(day, selectedDate)
                            const isToday = isSameDay(day, startOfDay(new Date()))
                            const inMonth = isSameMonth(day, anchorDate)

                            return (
                              <button
                                key={key}
                                onClick={() => {
                                  setSelectedDate(day)
                                  setAnchorDate(day)
                                }}
                                className={`min-h-[104px] rounded-xl border p-2 text-left transition ${
                                  isSelected
                                    ? 'border-[#9DBAF0] bg-[#EDF4FF] shadow-[0_0_0_1px_rgba(157,186,240,0.35)]'
                                    : 'border-[#E6EDF7] bg-[#FCFDFF] hover:border-[#CFE0F6] hover:bg-[#F7FAFF]'
                                }`}
                              >
                                <div className="mb-1 flex items-center justify-between">
                                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-[#1D4ED8] text-white' : inMonth ? 'text-[#2F4E73]' : 'text-[#9BB0CC]'}`}>
                                    {day.getDate()}
                                  </span>
                                  {dayEvents.length > 0 ? (
                                    <span className="text-[10px] font-medium text-[#6A819F]">{dayEvents.length}</span>
                                  ) : null}
                                </div>
                                <div className="space-y-1">
                                  {dayEvents.slice(0, 3).map((event) => (
                                    <div key={event.id} className="truncate rounded-md border border-[#D7E3F5] bg-[#F3F8FF] px-1.5 py-0.5 text-[10px] font-medium text-[#365882]">
                                      {event.title}
                                    </div>
                                  ))}
                                  {dayEvents.length > 3 ? (
                                    <div className="text-[10px] font-medium text-[#6D83A1]">+{dayEvents.length - 3} more</div>
                                  ) : null}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {calendarView === 'week' ? (
                  <div className="hidden md:block">
                    <p className="mb-2 text-[11px] text-[#7A8FAD]">Swipe horizontally to browse the week</p>
                    <div className="overflow-x-auto pb-1">
                      <div className="grid min-w-[840px] grid-flow-col auto-cols-[120px] gap-2 md:min-w-0 md:grid-cols-7 md:grid-flow-row md:auto-cols-auto">
                        {weekDates.map((day) => {
                          const dayEvents = eventsByDay.get(dateKey(day)) ?? []
                          const isSelected = isSameDay(day, selectedDate)
                          const isToday = isSameDay(day, startOfDay(new Date()))

                          return (
                            <section
                              key={dateKey(day)}
                              className={`rounded-xl border p-2 ${isSelected ? 'border-[#AFC7F4] bg-[#EEF5FF]' : 'border-[#E3EAF4] bg-[#FCFDFF]'}`}
                            >
                              <button
                                onClick={() => setSelectedDate(day)}
                                className="mb-2 w-full rounded-md px-1 py-1 text-left hover:bg-white"
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#6F85A4]">{WEEKDAYS[day.getDay()]}</p>
                                <p className={`text-sm font-semibold ${isToday ? 'text-[#1D4ED8]' : 'text-[#2F4E73]'}`}>{day.getDate()}</p>
                              </button>
                              <div className="space-y-1">
                                {dayEvents.length === 0 ? (
                                  <p className="text-[11px] text-[#95A8C2]">No events</p>
                                ) : (
                                  dayEvents.map((event) => (
                                    <button
                                      key={event.id}
                                      onClick={() => setSelectedDate(day)}
                                      className="w-full truncate rounded-md border border-[#D9E5F6] bg-white px-2 py-1 text-left text-[11px] font-medium text-[#365882]"
                                    >
                                      {event.displayTime === 'All day' ? 'All day' : event.displayTime.split(' - ')[0]} {event.title}
                                    </button>
                                  ))
                                )}
                              </div>
                            </section>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : null}

                {calendarView === 'day' ? (
                  <div className="space-y-2">
                    {selectedDateEvents.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-[#D6E1F2] bg-[#F8FBFF] p-8 text-center text-sm text-[#7085A4]">
                        No events scheduled for {formatDayLabel(selectedDate)}.
                      </div>
                    ) : (
                      selectedDateEvents.map((event) => (
                        <EventCard key={event.id} event={event} onOpenTask={openTaskFromEvent} />
                      ))
                    )}
                  </div>
                ) : null}
              </div>

              <aside className="rounded-2xl border border-[#DDE6F3] bg-[#FBFDFF] p-4">
                <h2 className="text-xs font-semibold text-[#2D4B72] md:text-sm">Selected date</h2>
                <p className="mt-1 text-[11px] text-[#6A819F] md:text-xs">{formatDayLabel(selectedDate)}</p>
                <div className="mt-3 space-y-2">
                  {selectedDateEvents.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-[#D5E2F4] bg-white p-4 text-xs text-[#7B90AD]">
                      No events on this date.
                    </div>
                  ) : (
                    selectedDateEvents.map((event) => (
                      <EventCard key={event.id} event={event} onOpenTask={openTaskFromEvent} />
                    ))
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
