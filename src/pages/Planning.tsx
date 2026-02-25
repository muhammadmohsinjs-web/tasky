import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  RefreshCw,
  Target,
} from 'lucide-react'
import { usePlanningCockpit } from '../hooks/usePlanningCockpit'

function formatDateLabel(iso: string | null) {
  if (!iso) return 'Backlog'
  const parsed = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function Planning() {
  const {
    loading,
    todayISO,
    weekDays,
    weekRangeLabel,
    weekCapacity,
    overdueTasks,
    focusQueue,
    completionReview,
    dailyCapacity,
    carryDateISO,
    setDailyCapacity,
    setCarryDateISO,
    moveWeek,
    resetToCurrentWeek,
    carryForwardOverdue,
    autoBalanceWeek,
    setTaskInProgress,
    setTaskDone,
    moveTaskToBacklog,
    scheduleTaskForDate,
    materializeNextOccurrence,
  } = usePlanningCockpit()

  const [selectedOverdueIds, setSelectedOverdueIds] = useState<Set<string>>(new Set())
  const [busyAction, setBusyAction] = useState<string | null>(null)

  const selectedCount = selectedOverdueIds.size
  const allOverdueSelected = overdueTasks.length > 0 && overdueTasks.every((task) => selectedOverdueIds.has(task.id))

  const totalOpenThisWeek = useMemo(
    () => weekCapacity.reduce((sum, day) => sum + day.openCount, 0),
    [weekCapacity],
  )
  const totalOverflow = useMemo(
    () => weekCapacity.reduce((sum, day) => sum + day.overflow, 0),
    [weekCapacity],
  )

  const toggleOverdueSelection = (taskId: string) => {
    setSelectedOverdueIds((previous) => {
      const next = new Set(previous)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  const toggleAllOverdue = () => {
    setSelectedOverdueIds((previous) => {
      if (allOverdueSelected) return new Set()
      const next = new Set(previous)
      overdueTasks.forEach((task) => next.add(task.id))
      return next
    })
  }

  const handleCarryForward = async () => {
    setBusyAction('carry-forward')
    try {
      const success = await carryForwardOverdue(Array.from(selectedOverdueIds), carryDateISO)
      if (success) {
        setSelectedOverdueIds(new Set())
      }
    } finally {
      setBusyAction(null)
    }
  }

  const handleAutoBalance = async () => {
    setBusyAction('auto-balance')
    try {
      await autoBalanceWeek()
    } finally {
      setBusyAction(null)
    }
  }

  if (loading) {
    return (
      <div className="content-wrap">
        <div className="panel p-6">
          <p className="text-sm text-[#4F6484]">Loading planning cockpit...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrap">
      <div className="page-header">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <span className="page-kicker">Phase 3</span>
            <h1>Weekly Planning Cockpit</h1>
            <p className="page-subtitle">Capacity, carry-forward, focus queue, and recurrence review in one operational surface.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => moveWeek(-1)} className="btn btn-secondary !h-10 !px-3" aria-label="Previous week">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={resetToCurrentWeek} className="btn btn-secondary !h-10 !px-4">Current Week</button>
            <button onClick={() => moveWeek(1)} className="btn btn-secondary !h-10 !px-3" aria-label="Next week">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="panel xl:col-span-8 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5B7090]">Weekly Capacity</p>
              <h2 className="mt-1 text-xl font-semibold text-[#122138]">{weekRangeLabel}</h2>
              <p className="mt-1 text-sm text-[#5E7596]">Open tasks this week: {totalOpenThisWeek} • Overflow: {totalOverflow}</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl border border-[#D7E2F3] bg-white px-3 py-2 text-xs font-medium text-[#3E5679]">
                Daily Capacity
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={dailyCapacity}
                  onChange={(event) => setDailyCapacity(Math.min(12, Math.max(1, Number(event.target.value) || 1)))}
                  className="w-14 rounded-md border border-[#CEDBEC] px-2 py-1 text-xs"
                />
              </label>
              <button
                onClick={() => void handleAutoBalance()}
                disabled={busyAction === 'auto-balance'}
                className="btn btn-secondary !h-10 !px-4"
              >
                <RefreshCw className={`h-4 w-4 ${busyAction === 'auto-balance' ? 'animate-spin' : ''}`} />
                Auto-Balance
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
            {weekCapacity.map((day) => {
              const fillPct = Math.min(100, Math.round((day.openCount / Math.max(1, day.capacity)) * 100))
              return (
                <article key={day.dateISO} className="rounded-2xl border border-[#DCE7F5] bg-[#F9FBFF] p-3">
                  <p className="text-xs font-semibold text-[#38527A]">{day.dayLabel}</p>
                  <p className="mt-1 text-[11px] text-[#5D7394]">{formatDateLabel(day.dateISO)}</p>
                  <p className="mt-2 text-lg font-semibold text-[#10223D]">{day.openCount}/{day.capacity}</p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6EDF8]">
                    <div
                      className={`h-full rounded-full ${day.overflow > 0 ? 'bg-[#D94848]' : 'bg-[#2A6FE3]'}`}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-[#5D7394]">
                    {day.overflow > 0 ? `${day.overflow} over capacity` : `${day.completedCount} completed`}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section className="panel xl:col-span-4 p-5">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="h-4 w-4 text-[#2A6FE3]" />
            <h2 className="text-base font-semibold text-[#13243C]">Overdue Carry-Forward</h2>
          </div>
          <p className="mt-2 text-sm text-[#5C7292]">Move overdue work into this week without opening each task.</p>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-2 rounded-xl border border-[#D7E2F3] bg-white px-3 py-2 text-xs font-medium text-[#3E5679]">
              Target Date
              <select
                value={carryDateISO}
                onChange={(event) => setCarryDateISO(event.target.value)}
                className="rounded-md border border-[#CEDBEC] px-2 py-1 text-xs"
              >
                {weekDays.map((day) => (
                  <option key={day.iso} value={day.iso}>{day.fullLabel}</option>
                ))}
              </select>
            </label>

            <button
              onClick={() => void handleCarryForward()}
              disabled={selectedCount === 0 || busyAction === 'carry-forward'}
              className="btn btn-primary !h-10 !px-4"
            >
              Carry Forward ({selectedCount})
            </button>
          </div>

          <div className="mt-4 max-h-[290px] overflow-y-auto space-y-2 pr-1">
            <button
              onClick={toggleAllOverdue}
              className="w-full rounded-xl border border-[#DCE7F5] bg-white px-3 py-2 text-left text-xs font-semibold text-[#36547A]"
            >
              {allOverdueSelected ? 'Unselect all overdue' : `Select all overdue (${overdueTasks.length})`}
            </button>

            {overdueTasks.length === 0 ? (
              <p className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFF] px-3 py-2 text-sm text-[#547096]">No overdue tasks. Weekly queue is clean.</p>
            ) : (
              overdueTasks.map((task) => (
                <label key={task.id} className="flex items-start gap-2 rounded-xl border border-[#DCE7F5] bg-white px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedOverdueIds.has(task.id)}
                    onChange={() => toggleOverdueSelection(task.id)}
                    className="mt-0.5"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-[#1A2D49]">{task.title}</span>
                    <span className="block text-xs text-[#5A7396]">{formatDateLabel(task.date)} • {task.priority}</span>
                  </span>
                </label>
              ))
            )}
          </div>
        </section>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[#2A6FE3]" />
            <h2 className="text-base font-semibold text-[#13243C]">Focus Queue</h2>
          </div>
          <p className="mt-2 text-sm text-[#5C7292]">Ranked next actions based on urgency, due-date pressure, and execution continuity.</p>

          <div className="mt-4 space-y-2">
            {focusQueue.length === 0 ? (
              <p className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFF] px-3 py-2 text-sm text-[#547096]">No open tasks in queue.</p>
            ) : (
              focusQueue.map((item) => (
                <article key={item.task.id} className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#162A48]">{item.task.title}</p>
                      <p className="text-xs text-[#5D7394]">{item.reason} • Due: {formatDateLabel(item.task.date)}</p>
                    </div>
                    <span className="rounded-full border border-[#D1E0F7] bg-[#EFF5FF] px-2 py-0.5 text-[11px] font-semibold text-[#2A5CA8]">
                      {item.task.priority}
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button onClick={() => void setTaskInProgress(item.task.id)} className="btn btn-secondary !h-8 !px-3 !text-xs">Start</button>
                    <button onClick={() => void setTaskDone(item.task.id)} className="btn btn-secondary !h-8 !px-3 !text-xs">Done</button>
                    <button onClick={() => void scheduleTaskForDate(item.task.id, todayISO)} className="btn btn-secondary !h-8 !px-3 !text-xs">Today</button>
                    {item.task.date ? (
                      <button onClick={() => void moveTaskToBacklog(item.task.id)} className="btn btn-secondary !h-8 !px-3 !text-xs">Backlog</button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="panel p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-[#2A6FE3]" />
            <h2 className="text-base font-semibold text-[#13243C]">Completion Intelligence</h2>
          </div>
          <p className="mt-2 text-sm text-[#5C7292]">Review completed recurring work and schedule the next occurrence in one click.</p>

          <div className="mt-4 space-y-2">
            {completionReview.length === 0 ? (
              <p className="rounded-xl border border-[#DCE7F5] bg-[#F8FBFF] px-3 py-2 text-sm text-[#547096]">
                No recurring completions in the last 21 days.
              </p>
            ) : (
              completionReview.map((item) => (
                <article key={item.task.id} className="rounded-xl border border-[#DCE7F5] bg-white px-3 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#162A48]">{item.task.title}</p>
                      <p className="text-xs text-[#5D7394]">Completed: {formatDateLabel(item.completedDate)}</p>
                      <p className="mt-1 text-xs text-[#446188]">{item.summary}</p>
                    </div>
                    <Clock3 className="h-4 w-4 shrink-0 text-[#6C86A8]" />
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => void materializeNextOccurrence(item)}
                      disabled={!item.nextDate || item.hasScheduledSuccessor}
                      className="btn btn-secondary !h-8 !px-3 !text-xs"
                    >
                      <ArrowRight className="h-3.5 w-3.5" />
                      Schedule Next
                    </button>
                    {item.nextDate ? (
                      <span className="rounded-full border border-[#D2E1F7] bg-[#EEF5FF] px-2 py-0.5 text-[11px] font-semibold text-[#2A5CA8]">
                        Next: {formatDateLabel(item.nextDate)}
                      </span>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
