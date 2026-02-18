import type { Task, Category, TaskStatus } from '../../types'
import { categoryAccent } from '../../lib/categoryUtils'
import { nextStatus } from '../ui/StatusBadge'
import { STATUS_CONFIG } from '../../lib/constants'
import { PriorityBadge } from '../ui/PriorityBadge'
import { Circle, Clock, CheckCircle2, Eye, Pencil, Trash2 } from 'lucide-react'

const STATUS_ICONS = {
  todo: Circle,
  inprogress: Clock,
  done: CheckCircle2,
} as const

interface Props {
  task: Task
  onStatusChange: (id: string, status: TaskStatus) => void
  onUpdate: (id: string, updates: { title?: string; category_id?: string | null }) => void
  onDelete: (id: string) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  categories?: Category[]
}

export function TaskItem({ task, onStatusChange, onDelete, onSelect }: Props) {
  const StatusIcon = STATUS_ICONS[task.status]
  const statusColor = STATUS_CONFIG[task.status]

  return (
    <div
      className={`group relative flex items-center gap-1.5 py-1 px-1.5 rounded-md border-l-2 ${categoryAccent(task.category)} transition-all ${
        task.status === 'done' ? 'opacity-50' : 'hover:bg-slate-50/80'
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task, 'view')}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task, 'view') }}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }}
        className="shrink-0 cursor-pointer hover:scale-110 transition-transform"
        title={statusColor.label}
      >
        <StatusIcon className={`w-3.5 h-3.5 ${
          task.status === 'done' ? 'text-emerald-500' :
          task.status === 'inprogress' ? 'text-amber-500' :
          'text-slate-300'
        }`} />
      </button>

      <PriorityBadge priority={task.priority} size="sm" />

      <span
        className={`text-xs leading-snug flex-1 min-w-0 truncate ${
          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'
        }`}
      >
        {task.title}
      </span>

      {/* Floating action bar on hover */}
      <div className="hidden group-hover:flex items-center gap-0.5 absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-slate-100 px-0.5 py-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(task, 'view') }}
          className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
          title="View"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(task, 'edit') }}
          className="p-1 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 cursor-pointer"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id) }}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
