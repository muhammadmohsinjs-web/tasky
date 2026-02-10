import { useState } from 'react'
import type { Task, Category, TaskStatus } from '../types'
import { categoryAccent } from './categoryUtils'
import { nextStatus } from './ui/StatusBadge'
import { STATUS_CONFIG } from '../lib/constants'
import { Circle, Clock, CheckCircle2, Pencil, Trash2 } from 'lucide-react'

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
  onSelect: (task: Task) => void
  categories?: Category[]
}

export function TaskItem({ task, onStatusChange, onUpdate, onDelete, onSelect, categories = [] }: Props) {
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(task.title)
  const [editCategoryId, setEditCategoryId] = useState<string | null>(task.category_id)

  const handleSave = () => {
    const trimmed = editTitle.trim()
    if (!trimmed) return
    onUpdate(task.id, { title: trimmed, category_id: editCategoryId })
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setEditTitle(task.title)
      setEditCategoryId(task.category_id)
      setEditing(false)
    }
  }

  if (editing) {
    return (
      <div className="animate-slide-down flex flex-col gap-2 py-2 px-2 bg-white rounded-lg border border-slate-200 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 bg-white"
        />
        <div className="flex items-center gap-2">
          <select
            value={editCategoryId ?? ''}
            onChange={(e) => setEditCategoryId(e.target.value || null)}
            className="text-xs px-2 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 flex-1"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={() => { setEditTitle(task.title); setEditCategoryId(task.category_id); setEditing(false) }}
            className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer px-1"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  const StatusIcon = STATUS_ICONS[task.status]
  const statusColor = STATUS_CONFIG[task.status]

  return (
    <div
      className={`group relative flex items-center gap-1.5 py-1 px-1.5 rounded-md border-l-2 ${categoryAccent(task.category)} transition-all ${
        task.status === 'done' ? 'opacity-50' : 'hover:bg-slate-50/80'
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task) }}
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

      <span
        className={`text-xs leading-snug flex-1 min-w-0 truncate ${
          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'
        }`}
      >
        {task.title}
      </span>

      {/* Floating action bar on hover — overlays instead of pushing content */}
      <div className="hidden group-hover:flex items-center gap-0.5 absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-sm rounded-md shadow-sm border border-slate-100 px-0.5 py-0.5">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
          title="Edit"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
          title="Delete"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
