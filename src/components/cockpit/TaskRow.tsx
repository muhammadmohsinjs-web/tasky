import type { Task, TaskStatus } from '../../types'

function formatTimeLabel(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes('AM') || value.includes('PM')) return value
  const [hoursRaw, minutesRaw] = value.split(':')
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHour = hours % 12 === 0 ? 12 : hours % 12
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`
}

interface TaskRowProps {
  task: Task
  onToggle: (taskId: string, currentStatus: TaskStatus) => void
  onOpen: (task: Task) => void
}

export function TaskRow({ task, onToggle, onOpen }: TaskRowProps) {
  const isDone = task.status === 'done'

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors ${
        isDone ? 'opacity-60' : ''
      }`}
    >
      {/* Square checkbox for tasks */}
      <button
        onClick={() => onToggle(task.id, task.status)}
        className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
          isDone
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-300 hover:border-emerald-400'
        }`}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Category dot */}
      {task.category && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: (task.category as { hex?: string }).hex ?? '#94a3b8' }}
        />
      )}

      {/* Clickable title */}
      <button
        onClick={() => onOpen(task)}
        className={`flex-1 text-left text-sm font-medium cursor-pointer ${
          isDone ? 'line-through text-slate-400' : 'text-slate-700 hover:text-slate-900'
        }`}
      >
        {task.title}
      </button>

      {/* Goal badge */}
      {task.goal_id && task.goal && (
        <span className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full flex-shrink-0 max-w-[120px] truncate">
          {task.goal.title}
        </span>
      )}

      {/* Time */}
      {task.time && (
        <span className="text-xs text-slate-400 flex-shrink-0">
          {formatTimeLabel(task.time)}
        </span>
      )}
    </div>
  )
}
