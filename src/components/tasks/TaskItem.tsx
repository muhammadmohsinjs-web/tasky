import { useEffect, useRef, useState } from 'react'
import type { Task, Category, TaskStatus } from '../../types'
import { categoryAccent } from '../../lib/categoryUtils'
import { nextStatus } from '../ui/StatusBadge'
import { STATUS_CONFIG } from '../../lib/constants'
import { PriorityBadge } from '../ui/PriorityBadge'
import { Circle, Clock, CheckCircle2, Eye, Pencil, Trash2, Repeat, GripVertical } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'

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
  draggable?: boolean
}

export function TaskItem({ task, onStatusChange, onDelete, onSelect, draggable = false }: Props) {
  const [showBurst, setShowBurst] = useState(false)
  const previousStatus = useRef(task.status)
  const StatusIcon = STATUS_ICONS[task.status]
  const statusColor = STATUS_CONFIG[task.status]

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: !draggable || !!task.is_projected,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  useEffect(() => {
    const changedToDone = previousStatus.current !== 'done' && task.status === 'done'
    previousStatus.current = task.status
    if (!changedToDone) return

    setShowBurst(true)
    const timer = window.setTimeout(() => setShowBurst(false), 420)
    return () => window.clearTimeout(timer)
  }, [task.status])

  return (
    <div
      ref={draggable ? setNodeRef : undefined}
      style={style}
      className={`group relative flex items-center gap-1.5 min-h-[34px] py-1.5 px-1.5 rounded-md border-l-2 ${categoryAccent(task.category)} transition-all ${
        task.status === 'done' ? 'opacity-50' : 'hover:bg-slate-50/80'
      } ${isDragging ? 'opacity-40 z-50' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${task.title}, priority ${task.priority}, status ${statusColor.label}`}
      onClick={() => onSelect(task, 'view')}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(task, 'view') }
        if (e.key === ' ') { e.preventDefault(); e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }
      }}
    >
      {/* Drag handle */}
      {draggable && !task.is_projected && (
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 w-4 h-4 flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
          onClick={(e) => e.stopPropagation()}
          aria-label="Drag to reschedule"
        >
          <GripVertical className="w-3 h-3" />
        </button>
      )}

      <button
        onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }}
        className={`shrink-0 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer hover:bg-slate-100 transition-colors relative ${
          showBurst ? 'animate-complete-pop' : ''
        }`}
        title={statusColor.label}
        aria-label={`Mark as ${STATUS_CONFIG[nextStatus(task.status)].label}`}
      >
        <StatusIcon className={`w-3.5 h-3.5 ${
          task.status === 'done' ? 'text-emerald-500' :
          task.status === 'inprogress' ? 'text-amber-500' :
          'text-slate-300'
        }`} />
        {showBurst && <span className="complete-burst" aria-hidden />}
      </button>

      <PriorityBadge priority={task.priority} size="sm" />

      {task.is_projected && (
        <Repeat className="w-3 h-3 text-slate-400 shrink-0" aria-label="Recurring task" />
      )}

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
          className="p-1.5 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
          title="View"
          aria-label="View task"
        >
          <Eye className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(task, 'edit') }}
          className="p-1.5 rounded text-slate-400 hover:text-amber-500 hover:bg-amber-50 cursor-pointer"
          title="Edit"
          aria-label="Edit task"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="p-1.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
          title="Delete"
          aria-label="Delete task"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
