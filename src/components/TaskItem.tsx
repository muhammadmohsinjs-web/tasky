import { useState } from 'react'
import type { Task, Category, TaskStatus } from '../types'
import { categoryAccent, categoryStyle, categoryLabel } from './categoryUtils'
import { StatusBadge, nextStatus } from './ui/StatusBadge'
import { Pencil, X } from 'lucide-react'

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
      <div className="animate-slide-down flex flex-col gap-1.5 py-1.5 px-1.5 bg-white rounded-lg border border-slate-200 shadow-sm">
        <input
          type="text"
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="w-full px-2 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 bg-white"
        />
        <div className="flex items-center gap-1.5">
          <select
            value={editCategoryId ?? ''}
            onChange={(e) => setEditCategoryId(e.target.value || null)}
            className="text-[10px] px-1.5 py-1 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-indigo-300 flex-1"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="text-[10px] px-2.5 py-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 font-medium cursor-pointer"
          >
            Save
          </button>
          <button
            onClick={() => { setEditTitle(task.title); setEditCategoryId(task.category_id); setEditing(false) }}
            className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer px-1"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`group flex items-start gap-1.5 py-[3px] px-1.5 rounded-md border-l-2 ${categoryAccent(task.category)} transition-all ${
        task.status === 'done' ? 'opacity-50' : 'hover:bg-slate-50'
      }`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect(task)}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task) }}
    >
      <div
        onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }}
        className="shrink-0 mt-[1px]"
      >
        <StatusBadge status={task.status} size="sm" />
      </div>
      <span
        className={`text-[11px] leading-snug flex-1 min-w-0 ${
          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'
        }`}
      >
        {task.title}
      </span>
      <span className={`shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${categoryStyle(task.category)}`}>
        {categoryLabel(task.category)}
      </span>
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setEditing(true) }}
          className="p-0.5 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
          title="Edit"
        >
          <Pencil className="w-2.5 h-2.5" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
          className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
          title="Delete"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  )
}
