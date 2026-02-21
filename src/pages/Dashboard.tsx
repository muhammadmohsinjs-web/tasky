import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAllTasks } from '../hooks/useAllTasks'
import { useEvents } from '../hooks/useEvents'
import { useCategories } from '../hooks/useCategories'
import { useProfile } from '../hooks/useProfile'
import { useCalendarSyncSettings } from '../hooks/useCalendarSyncSettings'
import { useGoogleCalendarPreview } from '../hooks/useGoogleCalendarPreview'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { StatusBadge } from '../components/ui/StatusBadge'
import { CategoryBadge } from '../components/ui/CategoryBadge'
import { ListTodo, Circle, Clock, CheckCircle2, Plus, ArrowRight, Flame, CalendarClock, CloudDownload } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_CONFIG } from '../lib/constants'
import type { TaskStatus } from '../types'

export default function Dashboard() {
  const { tasks, loading } = useAllTasks()
  const { events, loading: eventsLoading } = useEvents()
  const { categories } = useCategories()
  const { profile } = useProfile()
  const {
    connection,
    loading: connectionLoading,
    outboxLoading,
    outboxStats,
    ensureConnection,
    setSyncEnabled,
    setCalendarId,
    runSyncNow,
    retryDeadJobs,
    backfillMissingTaskEvents,
  } = useCalendarSyncSettings()
  const { loading: googlePreviewLoading, fetchAndLog } = useGoogleCalendarPreview()
  const navigate = useNavigate()
  const [googleSyncStatus, setGoogleSyncStatus] = useState('idle')
  const [availableCalendars, setAvailableCalendars] = useState<{ id: string; summary: string; primary?: boolean }[]>([])
  const autoSyncInFlightRef = useRef(false)
  const calendarsHydratedRef = useRef(false)

  const stats = useMemo(() => {
    const todo = tasks.filter((t) => t.status === 'todo').length
    const inprogress = tasks.filter((t) => t.status === 'inprogress').length
    const done = tasks.filter((t) => t.status === 'done').length
    return { total: tasks.length, todo, inprogress, done }
  }, [tasks])

  const statusChartData = useMemo(
    () => [
      { name: 'To Do', value: stats.todo, fill: STATUS_CONFIG.todo.hex },
      { name: 'In Progress', value: stats.inprogress, fill: STATUS_CONFIG.inprogress.hex },
      { name: 'Done', value: stats.done, fill: STATUS_CONFIG.done.hex },
    ],
    [stats]
  )

  const recentTasks = useMemo(() => tasks.slice(0, 6), [tasks])

  const categoryStats = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      count: tasks.filter((t) => t.category_id === cat.id).length,
    }))
  }, [tasks, categories])

  const today = new Date()
  const greeting = today.getHours() < 12 ? 'Good morning' : today.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  const todayISO = today.toISOString().slice(0, 10)

  const dueToday = useMemo(
    () => tasks.filter((task) => task.date === todayISO && task.status !== 'done').length,
    [tasks, todayISO]
  )

  const overdue = useMemo(
    () => tasks.filter((task) => task.date && task.date < todayISO && task.status !== 'done').length,
    [tasks, todayISO]
  )

  const completionRate = useMemo(
    () => (stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100)),
    [stats]
  )

  const statusRows = useMemo(
    () => [
      { key: 'todo' as TaskStatus, label: STATUS_CONFIG.todo.label, value: stats.todo, dot: STATUS_CONFIG.todo.dot, fill: STATUS_CONFIG.todo.hex },
      { key: 'inprogress' as TaskStatus, label: STATUS_CONFIG.inprogress.label, value: stats.inprogress, dot: STATUS_CONFIG.inprogress.dot, fill: STATUS_CONFIG.inprogress.hex },
      { key: 'done' as TaskStatus, label: STATUS_CONFIG.done.label, value: stats.done, dot: STATUS_CONFIG.done.dot, fill: STATUS_CONFIG.done.hex },
    ],
    [stats]
  )

  const formatTaskDate = (date: string | null) => {
    if (!date) return 'Unscheduled'
    const parsed = new Date(`${date}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return date
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const formatEventDateTime = (iso: string) => {
    const parsed = new Date(iso)
    if (Number.isNaN(parsed.getTime())) return iso
    return parsed.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const handleFetchGoogleData = async () => {
    const clickedAt = new Date().toLocaleTimeString()
    setGoogleSyncStatus(`refresh requested at ${clickedAt}`)
    toast.message('Refreshing Google calendars')
    try {
      const preview = await fetchAndLog()
      setAvailableCalendars(preview.calendars)
      setGoogleSyncStatus(`loaded ${preview.calendars.length} calendars`)
    } catch (error) {
      setGoogleSyncStatus('failed to refresh')
      console.error('[Dashboard] Google Calendar fetch failed', error)
    }
  }

  useEffect(() => {
    if (connectionLoading) return
    if (calendarsHydratedRef.current) return

    calendarsHydratedRef.current = true
    void (async () => {
      try {
        const preview = await fetchAndLog({ silent: true })
        setAvailableCalendars(preview.calendars)
      } catch (error) {
        console.warn('[Dashboard] Initial calendar preload failed', error)
      }
    })()
  }, [connectionLoading, fetchAndLog])

  const handleToggleSync = async () => {
    const ensured = await ensureConnection()
    if (!ensured) return

    const nextEnabled = !(connection?.sync_enabled ?? ensured.sync_enabled)
    const updated = await setSyncEnabled(nextEnabled)
    if (!updated) return

    if (nextEnabled) {
      const backfilled = await backfillMissingTaskEvents(150)
      if (backfilled > 0) {
        toast.success(`Sync enabled. Backfilled ${backfilled} task event${backfilled === 1 ? '' : 's'}.`)
      }
    }

    setGoogleSyncStatus(nextEnabled ? 'sync enabled' : 'sync disabled')
    toast.success(nextEnabled ? 'Google Calendar sync enabled' : 'Google Calendar sync disabled')
  }

  const handleCalendarChange = async (calendarId: string) => {
    const updated = await setCalendarId(calendarId)
    if (!updated) return

    setGoogleSyncStatus(`calendar set to ${calendarId}`)
    toast.success('Sync calendar updated')
  }

  const handleRunSyncNow = async () => {
    const result = await runSyncNow(30)
    if (!result) return

    setGoogleSyncStatus(`processed ${result.processed}, success ${result.succeeded}`)
    if (result.dead > 0) {
      toast.warning(`Sync finished with ${result.dead} dead jobs`)
    } else if (result.failed > 0) {
      toast.message(`Sync queued retries: ${result.failed}`)
    } else {
      toast.success(`Sync complete (${result.succeeded}/${result.processed})`)
    }
  }

  const handleRetryDeadJobs = async () => {
    const retried = await retryDeadJobs()
    if (retried > 0) {
      toast.success(`Queued ${retried} dead job${retried === 1 ? '' : 's'} for retry`)
      setGoogleSyncStatus(`retried ${retried} dead jobs`)
      return
    }
    toast.message('No dead jobs to retry')
  }

  useEffect(() => {
    if (!connection?.sync_enabled || connectionLoading) return

    const intervalMs = 2 * 60 * 1000
    const runAutoSync = async () => {
      if (autoSyncInFlightRef.current) return
      if (document.visibilityState !== 'visible') return
      if (!navigator.onLine) return

      autoSyncInFlightRef.current = true
      try {
        const result = await runSyncNow(20)
        if (result) {
          setGoogleSyncStatus(`auto-sync: processed ${result.processed}, success ${result.succeeded}`)
        }
      } finally {
        autoSyncInFlightRef.current = false
      }
    }

    void runAutoSync()
    const intervalId = window.setInterval(() => {
      void runAutoSync()
    }, intervalMs)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [connection?.sync_enabled, connectionLoading, runSyncNow])

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />
  }

  return (
    <div className="content-wrap">
      <div className="page-header">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <span className="page-kicker">Overview</span>
            <h1>
              {greeting}
              {profile?.display_name ? `, ${profile.display_name.split(' ')[0]}` : ''}
            </h1>
            <p className="page-subtitle">
              {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-[#D4E3F8] bg-[#EEF5FF] px-2.5 py-1 text-xs font-medium text-[#1D4F95]">
                <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
                Due today: {dueToday}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#F2D3D3] bg-[#FFF1F1] px-2.5 py-1 text-xs font-medium text-[#A33A3A]">
                Overdue: {overdue}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-2.5 py-1 text-xs font-medium text-[#38557C]">
                Google sync: {connection?.sync_enabled ? 'enabled' : 'disabled'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-2.5 py-1 text-xs font-medium text-[#38557C]">
                Target calendar: {connection?.google_calendar_id ?? 'primary'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-2.5 py-1 text-xs font-medium text-[#38557C]">
                Sync mode: {connection?.sync_direction ?? 'task_to_google'}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-2.5 py-1 text-xs font-medium text-[#38557C]">
                Status: {googleSyncStatus}
              </span>
              <span className="inline-flex items-center rounded-full border border-[#D9E5F6] bg-[#F6FAFF] px-2.5 py-1 text-xs font-medium text-[#38557C]">
                Outbox: {outboxLoading ? 'loading...' : `queued ${outboxStats?.queued ?? 0}, failed ${outboxStats?.failed ?? 0}, dead ${outboxStats?.dead ?? 0}`}
              </span>
              {outboxStats?.lastError ? (
                <span className="inline-flex items-center rounded-full border border-[#F2D3D3] bg-[#FFF1F1] px-2.5 py-1 text-xs font-medium text-[#A33A3A]">
                  Last sync error: {outboxStats.lastError.slice(0, 120)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => navigate('/tasks')} className="btn btn-secondary !h-10 !px-4">
              Plan Today
            </button>
            <button
              onClick={() => void handleFetchGoogleData()}
              disabled={googlePreviewLoading || connectionLoading}
              className="btn btn-secondary !h-10 !px-4"
            >
              <CloudDownload className="h-4 w-4" />
              {googlePreviewLoading ? 'Refreshing...' : 'Refresh Calendars'}
            </button>
            <button
              onClick={() => void handleToggleSync()}
              disabled={connectionLoading}
              className="btn btn-secondary !h-10 !px-4"
            >
              {connection?.sync_enabled ? 'Disable Sync' : 'Enable Sync'}
            </button>
            <button
              onClick={() => void handleRunSyncNow()}
              disabled={connectionLoading || !(connection?.sync_enabled)}
              className="btn btn-secondary !h-10 !px-4"
            >
              Run Sync Now
            </button>
            <button
              onClick={() => void handleRetryDeadJobs()}
              disabled={connectionLoading || outboxLoading || (outboxStats?.dead ?? 0) === 0}
              className="btn btn-secondary !h-10 !px-4"
            >
              Retry Dead Jobs
            </button>
            <label className="flex h-10 items-center gap-2 rounded-xl border border-[#D9E5F6] bg-white px-3 text-xs font-medium text-[#38557C]">
              Calendar
              <select
                value={connection?.google_calendar_id ?? 'primary'}
                onChange={(event) => void handleCalendarChange(event.target.value)}
                disabled={connectionLoading || googlePreviewLoading}
                className="bg-transparent text-xs outline-none"
              >
                {availableCalendars.length === 0 ? (
                  <option value={connection?.google_calendar_id ?? 'primary'}>
                    {connection?.google_calendar_id ?? 'primary'}
                  </option>
                ) : (
                  availableCalendars.map((calendar) => (
                    <option key={calendar.id} value={calendar.id}>
                      {calendar.summary}{calendar.primary ? ' (Primary)' : ''}
                    </option>
                  ))
                )}
              </select>
            </label>
            <button onClick={() => navigate('/tasks')} className="btn btn-primary !h-10 !px-4">
              <Plus className="h-4 w-4" />
              New Task
            </button>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="panel xl:col-span-6">
          <div className="flex items-start justify-between gap-4 p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">To Do</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{stats.todo}</p>
              <p className="mt-2 text-xs text-[#5F7698]">
                {dueToday} due today, {overdue} overdue
              </p>
            </div>
            <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#CAD7EA] bg-[#ECF3FF] text-[#2559A9]">
              <Circle className="h-5 w-5" />
            </div>
          </div>
          <div className="border-t border-[#E4EBF4] px-5 py-3 text-xs font-medium text-[#556D8F]">
            Completion rate this cycle: <span className="font-semibold text-[#1F3B67]">{completionRate}%</span>
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">Total Tasks</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{stats.total}</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#D5E1F1] bg-[#EFF5FF] text-[#2563EB]">
              <ListTodo className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">In Progress</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{stats.inprogress}</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#F2DEBE] bg-[#FFF6E8] text-[#B86A00]">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="panel xl:col-span-2">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">Done</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{stats.done}</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#CAE9DA] bg-[#EAF8F1] text-[#0D7D53]">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="panel">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">Current Streak</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{profile?.streak?.current ?? 0}</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#F4D6BC] bg-[#FFF3E6] text-[#D55B00]">
              <Flame className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">Longest Streak</p>
              <p className="mt-2 text-[36px] font-semibold leading-none text-[#122138]">{profile?.streak?.longest ?? 0}</p>
            </div>
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#F3D2DB] bg-[#FFF0F5] text-[#CC2E64]">
              <Flame className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="panel lg:col-span-2 overflow-hidden">
          <div className="panel-header">
            <h2 className="text-[34px] font-semibold leading-none tracking-tight text-[#122138]">Recent Tasks</h2>
            <button onClick={() => navigate('/tasks')} className="btn btn-ghost !px-2 !py-1.5 text-xs !text-[#5A6F91]">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="divide-y divide-[#E6ECF5]">
            {recentTasks.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-slate-500">No tasks yet. Create your first task.</div>
            ) : (
              recentTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => navigate('/tasks')}
                  className="group flex cursor-pointer items-center gap-3 px-5 py-3.5 hover:bg-[#F6F9FF]"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate('/tasks')
                  }}
                >
                  <StatusBadge status={task.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className={`truncate text-[20px] font-medium leading-tight ${task.status === 'done' ? 'text-[#7B8CA5] line-through' : 'text-[#243956]'}`}>
                      {task.title}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[12px] text-[#7789A3]">
                      <span>{formatTaskDate(task.date)}</span>
                      <span className="h-1 w-1 rounded-full bg-[#B1C0D4]" />
                      <span>{STATUS_CONFIG[task.status].label}</span>
                    </div>
                  </div>
                  <CategoryBadge category={task.category} />
                  <ArrowRight className="w-3.5 h-3.5 text-[#97A8BF] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="panel-header">
            <h2 className="text-[34px] font-semibold leading-none tracking-tight text-[#122138]">Status Overview</h2>
          </div>
          <div className="panel-body">
            {stats.total === 0 ? (
              <div className="py-8 text-center text-sm text-slate-500">No data yet</div>
            ) : (
              <div className="space-y-4">
                <div className="relative mx-auto h-[188px] max-w-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={54} outerRadius={78} paddingAngle={3} dataKey="value">
                        {statusChartData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #dbe3ef' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[#6E819F]">Done</p>
                    <p className="text-xl font-semibold text-[#173156]">{completionRate}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  {statusRows.map((row) => {
                    const pct = stats.total === 0 ? 0 : Math.round((row.value / stats.total) * 100)
                    return (
                      <div key={row.key} className="rounded-xl border border-[#E3EAF4] bg-[#F9FBFF] p-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${row.dot}`} />
                            <span className="text-xs font-medium text-[#415775]">{row.label}</span>
                          </div>
                          <div className="text-xs font-semibold text-[#203A61]">{row.value} ({pct}%)</div>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#E3EAF5]">
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: row.fill }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="panel overflow-hidden mb-8">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-slate-700">Upcoming Events</h2>
          <span className="text-xs text-slate-500">{events.length}</span>
        </div>
        <div className="panel-body">
          {eventsLoading ? (
            <div className="text-center py-4 text-sm text-slate-400">Loading events...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">No upcoming events</div>
          ) : (
            <div className="space-y-2">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`rounded-xl border border-[#E3EAF4] bg-[#F9FBFF] p-3 ${event.linked_task ? 'cursor-pointer hover:bg-[#F3F8FF]' : ''}`}
                  onClick={() => {
                    if (!event.linked_task) return
                    sessionStorage.setItem('tasky:openTaskId', event.linked_task.id)
                    navigate('/tasks')
                  }}
                  role={event.linked_task ? 'button' : undefined}
                  tabIndex={event.linked_task ? 0 : undefined}
                  onKeyDown={(keyboardEvent) => {
                    if (!event.linked_task) return
                    if (keyboardEvent.key === 'Enter') {
                      sessionStorage.setItem('tasky:openTaskId', event.linked_task.id)
                      navigate('/tasks')
                    }
                  }}
                >
                  <div className="text-sm font-medium text-[#243956] truncate">{event.title}</div>
                  <div className="mt-1 text-xs text-[#6C7F9D]">
                    {formatEventDateTime(event.start_at)} - {formatEventDateTime(event.end_at)}
                  </div>
                  {event.linked_task ? (
                    <div className="mt-1 text-xs text-[#4E6384]">
                      From task: {event.linked_task.title}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="panel overflow-hidden mb-8">
        <div className="panel-header">
          <h2 className="text-sm font-semibold text-slate-700">Tasks by Category</h2>
          <button onClick={() => navigate('/categories')} className="btn btn-ghost !px-2 !py-1 text-xs">
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="panel-body">
          {categoryStats.length === 0 ? (
            <div className="text-center py-4 text-sm text-slate-400">No categories</div>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((cat) => {
                const pct = stats.total > 0 ? Math.round((cat.count / stats.total) * 100) : 0
                return (
                  <div key={cat.id} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-24 truncate">{cat.name}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${cat.color.split(' ')[0]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-slate-400 w-12 text-right">{cat.count} tasks</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <button onClick={() => navigate('/tasks')} className="btn btn-primary">
        <Plus className="w-4 h-4" />
        Add Task
      </button>
    </div>
  )
}
