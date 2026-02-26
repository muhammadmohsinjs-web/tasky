import type { Goal } from '../../types'

function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'No timeline'
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })
  const start = startDate ? formatter.format(new Date(`${startDate}T00:00:00`)) : 'Any time'
  const end = endDate ? formatter.format(new Date(`${endDate}T00:00:00`)) : 'No end'
  return `${start} - ${end}`
}

function statusStyles(status: Goal['status']): string {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'abandoned') return 'bg-rose-100 text-rose-700'
  return 'bg-blue-100 text-blue-700'
}

function statusLabel(status: Goal['status']): string {
  if (status === 'completed') return 'Completed'
  if (status === 'abandoned') return 'Abandoned'
  return 'Active'
}

interface GoalCardProps {
  goal: Goal
  onClick: () => void
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const total = goal.task_count ?? 0
  const completed = goal.completed_task_count ?? 0
  const progress = goal.progress ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex">
        <div
          className="w-1.5"
          style={{ backgroundColor: goal.color ?? '#94a3b8' }}
          aria-hidden
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-800 truncate">{goal.title}</h3>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusStyles(goal.status)}`}>
              {statusLabel(goal.status)}
            </span>
          </div>

          <p className="text-sm text-slate-500 mt-1">{formatDateRange(goal.start_date, goal.end_date)}</p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>{completed} / {total} tasks</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </button>
  )
}
