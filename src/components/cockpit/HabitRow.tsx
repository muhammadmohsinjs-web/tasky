import { Clock3 } from 'lucide-react'
import type { Task, TaskStatus, HabitStreak } from '../../types'

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

interface HabitRowProps {
  habit: Task
  streak: HabitStreak | null
  onToggle: (habitId: string, currentStatus: TaskStatus) => void
}

export function HabitRow({ habit, streak, onToggle }: HabitRowProps) {
  const isDone = habit.status === 'done'

  const timeLabel = (() => {
    if (!habit.time) return null
    const start = formatTimeLabel(habit.time)
    const end = habit.end_time ? formatTimeLabel(habit.end_time) : null
    return end ? `${start} - ${end}` : start
  })()

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition sm:px-4 ${
        isDone
          ? 'border-emerald-100/80 bg-emerald-50/50'
          : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)]'
      }`}
    >
      <button
        onClick={() => onToggle(habit.id, habit.status)}
        className={`h-5 w-5 flex-shrink-0 rounded-full border-2 transition-colors ${
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
        <p
          className={`truncate text-sm font-medium ${
            isDone ? 'text-slate-500 line-through' : 'text-slate-800'
          }`}
        >
          {habit.title}
        </p>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          {timeLabel && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <Clock3 className="h-3 w-3" />
              {timeLabel}
            </span>
          )}

          {habit.category && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: (habit.category as { hex?: string }).hex ?? '#94a3b8' }}
              />
              {(habit.category as { name?: string }).name ?? 'Category'}
            </span>
          )}
        </div>
      </div>

      {streak && streak.current_streak > 0 && (
        <span className="inline-flex flex-shrink-0 items-center rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-600">
          🔥 {streak.current_streak}
        </span>
      )}
    </div>
  )
}
