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
    return end ? `${start} – ${end}` : start
  })()

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors ${
        isDone ? 'opacity-60' : ''
      }`}
    >
      {/* Circular checkbox for habits */}
      <button
        onClick={() => onToggle(habit.id, habit.status)}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
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
      {habit.category && (
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: (habit.category as { hex?: string }).hex ?? '#94a3b8' }}
        />
      )}

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium ${
          isDone ? 'line-through text-slate-400' : 'text-slate-700'
        }`}
      >
        {habit.title}
      </span>

      {/* Time range */}
      {timeLabel && (
        <span className="text-xs text-slate-400 flex-shrink-0">{timeLabel}</span>
      )}

      {/* Streak badge */}
      {streak && streak.current_streak > 0 && (
        <span className="text-xs font-semibold text-orange-500 flex-shrink-0">
          🔥 {streak.current_streak}
        </span>
      )}
    </div>
  )
}
