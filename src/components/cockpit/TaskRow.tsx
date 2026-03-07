import { Clock3, Flag } from 'lucide-react'
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
      className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition sm:px-4 ${
        isDone
          ? 'border-emerald-100/80 bg-emerald-50/50'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
      }`}
    >
      <button
        onClick={() => onToggle(task.id, task.status)}
        className={`h-5 w-5 flex-shrink-0 rounded border-2 transition-colors ${
          isDone
            ? 'border-emerald-500 bg-emerald-500'
            : 'border-slate-300 bg-white group-hover:border-emerald-400'
        }`}
        aria-label={isDone ? 'Mark incomplete' : 'Mark complete'}
      >
        {isDone && (
          <svg
            className="mx-auto mt-0.5 h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <button
          onClick={() => onOpen(task)}
          className={`w-full truncate text-left text-sm font-medium ${
            isDone ? 'text-slate-500 line-through' : 'text-slate-800'
          }`}
        >
          {task.title}
        </button>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {task.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: (task.category as { hex?: string }).hex ?? '#94a3b8' }}
              />
              {(task.category as { name?: string }).name ?? 'Category'}
            </span>
          )}

          {task.goal_id && task.goal && (
            <span className="inline-flex max-w-[180px] items-center gap-1 truncate rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700">
              <Flag className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{task.goal.title}</span>
            </span>
          )}

          {task.time && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Clock3 className="h-3 w-3" />
              {formatTimeLabel(task.time)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
