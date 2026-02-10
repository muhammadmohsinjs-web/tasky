import { useEffect, useState } from 'react'
import type { Category, Task, TaskStatus } from '../types'
import { categoryStyle, categoryLabel } from './categoryUtils'
import { STATUS_CONFIG } from '../lib/constants'
import { X, Trash2 } from 'lucide-react'

interface Props {
  task: Task | null
  categories: Category[]
  onClose: () => void
  onUpdate: (id: string, updates: {
    title?: string
    description?: string | null
    notes?: string | null
    category_id?: string | null
    date?: string
    status?: TaskStatus
  }) => void
  onDelete: (id: string) => void
}

export function TaskDetailPanel({
  task,
  categories,
  onClose,
  onUpdate,
  onDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string | null>('')
  const [notes, setNotes] = useState<string | null>('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<TaskStatus>('todo')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setNotes(task.notes ?? '')
    setDate(task.date)
    setCategoryId(task.category_id)
    setStatus(task.status)
  }, [task])

  if (!task) return null
  const activeCategory = categories.find((c) => c.id === categoryId) ?? task.category

  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim() || task.title,
      description: description?.trim() || null,
      notes: notes?.trim() || null,
      date,
      category_id: categoryId,
      status,
    })
  }

  return (
    <aside className="w-full lg:w-[360px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Task details</div>
          <div className="text-sm font-semibold text-slate-700">Edit and refine</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          aria-label="Close detail panel"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300"
          >
            {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
            ))}
          </select>
          <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(activeCategory)}`}>
            {categoryLabel(activeCategory)}
          </span>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500">Category</label>
          <select
            value={categoryId ?? ''}
            onChange={(e) => setCategoryId(e.target.value || null)}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
          >
            <option value="">Uncategorized</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500">Description</label>
          <textarea
            value={description ?? ''}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none"
            placeholder="What did you learn and why does it matter?"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-slate-500">Notes</label>
          <textarea
            value={notes ?? ''}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none"
            placeholder="Links, snippets, or next steps..."
          />
        </div>
      </div>

      <div className="p-5 border-t border-slate-200 flex items-center gap-2">
        <button
          onClick={handleSave}
          className="flex-1 text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold cursor-pointer"
        >
          Save changes
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="text-sm px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:border-red-200 hover:text-red-500 cursor-pointer flex items-center gap-1.5"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </aside>
  )
}
