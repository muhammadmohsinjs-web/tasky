import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { useEvents } from '../hooks/useEvents'
import { useCalendarSyncSettings } from '../hooks/useCalendarSyncSettings'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getSyncBadge } from '../lib/eventSync'

function formatEventDateTime(iso: string) {
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function Events() {
  const navigate = useNavigate()
  const { events, loading } = useEvents()
  const { connection } = useCalendarSyncSettings()
  const [syncFilter, setSyncFilter] = useState<'all' | 'synced' | 'pending' | 'failed' | 'dead' | 'disabled' | 'unknown'>('all')

  const filteredEvents = useMemo(
    () => (syncFilter === 'all' ? events : events.filter((event) => event.sync_status === syncFilter)),
    [events, syncFilter]
  )

  const grouped = useMemo(() => {
    return filteredEvents.reduce<Record<string, typeof filteredEvents>>((acc, event) => {
      const key = event.start_at.slice(0, 10)
      if (!acc[key]) acc[key] = []
      acc[key].push(event)
      return acc
    }, {})
  }, [filteredEvents])

  if (loading) {
    return <LoadingSpinner message="Loading events..." />
  }

  return (
    <div className="content-wrap">
      <div className="page-header">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="page-kicker">Calendar</span>
            <h1>Events</h1>
            <p className="page-subtitle">
              {connection?.sync_enabled ? 'Showing Tasky + Google Calendar events' : 'Showing Tasky events (Google sync disabled)'}
            </p>
          </div>
          <div className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-3 py-1.5 text-xs font-medium text-[#38557C]">
            <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
            {filteredEvents.length} upcoming
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-slate-700">Upcoming</h2>
          <button onClick={() => navigate('/tasks')} className="btn btn-ghost !px-2 !py-1 text-xs">
            Open Tasks <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="panel-body">
          <div className="mb-3 flex flex-wrap gap-2">
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

          {filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-sm text-slate-400">
              No upcoming events.
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([date, items]) => (
                <div key={date}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#5B7090]">
                    {new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </p>
                  <div className="space-y-2">
                    {items.map((event) => (
                      <div key={event.id} className="rounded-xl border border-[#E3EAF4] bg-[#F9FBFF] p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-sm font-medium text-[#243956]">{event.title}</div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSyncBadge(event.sync_status ?? 'unknown').classes}`}>
                            {getSyncBadge(event.sync_status ?? 'unknown').label}
                          </span>
                        </div>
                        <div className="mt-1 text-xs text-[#6C7F9D]">
                          {formatEventDateTime(event.start_at)} - {formatEventDateTime(event.end_at)}
                        </div>
                        {event.is_external_google_event ? (
                          <div className="mt-1 text-[11px] text-[#456489]">
                            Google Calendar event{event.provider_calendar_name ? ` • ${event.provider_calendar_name}` : ''}
                          </div>
                        ) : null}
                        {event.sync_status === 'failed' || event.sync_status === 'dead' ? (
                          <div className="mt-1 text-[11px] text-[#A33A3A]">
                            {event.sync_error ? `Sync error: ${event.sync_error.slice(0, 140)}` : 'Sync failed. Retry from dashboard.'}
                          </div>
                        ) : null}
                        {event.linked_task ? (
                          <button
                            onClick={() => {
                              sessionStorage.setItem('tasky:openTaskId', event.linked_task!.id)
                              navigate('/tasks')
                            }}
                            className="mt-2 inline-flex items-center rounded-md border border-[#C9D8F0] bg-white px-2 py-1 text-[11px] font-medium text-[#2C4D7A] hover:bg-[#F3F8FF]"
                          >
                            From task: {event.linked_task.title}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
