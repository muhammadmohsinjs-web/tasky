import type { Task } from '../../types'
import { Repeat } from 'lucide-react'

interface Props {
  task: Task
  colStart: number  // 0-based column index
  colSpan: number   // how many columns to span
  onClick: () => void
}

export function MultiDayBar({ task, colStart, colSpan, onClick }: Props) {
  const categoryColor = task.category?.color ?? 'bg-slate-100 text-slate-600'
  const categoryAccent = task.category?.accent ?? 'border-l-slate-400'

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`absolute h-6 rounded-md text-[11px] font-semibold truncate px-2 flex items-center gap-1 border-l-2 cursor-pointer hover:opacity-90 transition-opacity ${categoryColor} ${categoryAccent}`}
      style={{
        left: `calc(${(colStart / 7) * 100}% + 4px)`,
        width: `calc(${(colSpan / 7) * 100}% - 8px)`,
        top: '0',
      }}
      title={`${task.title} (${task.date} to ${task.end_date})`}
      aria-label={`${task.title}, multi-day task from ${task.date} to ${task.end_date}`}
    >
      {task.is_projected && <Repeat className="w-3 h-3 flex-shrink-0" />}
      <span className="truncate">{task.title}</span>
    </button>
  )
}
