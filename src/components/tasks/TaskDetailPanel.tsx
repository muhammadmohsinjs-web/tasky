import { useEffect, useState } from 'react'
import type { Category, Task, TaskStatus } from '../../types'
import { categoryStyle, categoryLabel } from '../../lib/categoryUtils'
import { STATUS_CONFIG } from '../../lib/constants'
import { X, Trash2, Pencil } from 'lucide-react'

interface Props {
  task: Task | null
  categories: Category[]
  mode: 'view' | 'edit'
  onModeChange: (mode: 'view' | 'edit') => void
  onClose: () => void
  onUpdate: (id: string, updates: {
    title?: string
    description?: string | null
    notes?: string | null
    category_id?: string | null
    date?: string | null
    status?: TaskStatus
  }) => void
  onDelete: (id: string) => void
}

export function TaskDetailPanel({
  task,
  categories,
  mode,
  onModeChange,
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
    setDate(task.date ?? '')
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
      date: date || null,
      category_id: categoryId,
      status,
    })
    onModeChange('view')
  }

  const formattedDate = (() => {
    if (!task.date) return 'Unscheduled'
    const [y, m, d] = task.date.split('-')
    if (!y) return task.date
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  })()

  if (mode === 'view') {
    return (
      <aside className="w-full lg:w-[360px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400">Task details</div>
            <div className="text-sm font-semibold text-slate-700">Overview</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onModeChange('edit')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer"
              aria-label="Edit task"
              title="Edit"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              aria-label="Close detail panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded-lg border border-slate-200 ${
              task.status === 'done' ? 'text-emerald-600 bg-emerald-50' :
              task.status === 'inprogress' ? 'text-amber-600 bg-amber-50' :
              'text-slate-500 bg-slate-50'
            }`}>
              {STATUS_CONFIG[task.status].label}
            </span>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(activeCategory)}`}>
              {categoryLabel(activeCategory)}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Title</label>
            <p className="mt-1 text-sm text-slate-700">{task.title}</p>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-400">Date</label>
            <p className="mt-1 text-sm text-slate-600">{formattedDate}</p>
          </div>

          {task.description && (
            <div>
              <label className="text-[11px] font-medium text-slate-400">Description</label>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          {task.notes && (
            <div>
              <label className="text-[11px] font-medium text-slate-400">Notes</label>
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{task.notes}</p>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 flex items-center gap-2">
          <button
            onClick={() => onModeChange('edit')}
            className="flex-1 text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold cursor-pointer flex items-center justify-center gap-2"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Task
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

  return (
    <aside className="w-full lg:w-[360px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide text-slate-400">Task details</div>
          <div className="text-sm font-semibold text-slate-700">Edit and refine</div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
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
          <div className="flex items-center gap-2 mt-1">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
            {date && (
              <button
                onClick={() => setDate('')}
                className="text-xs px-2.5 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg cursor-pointer"
                title="Move to backlog"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {!date && (
            <p className="text-[10px] text-slate-400 mt-1">No date — task will be in backlog</p>
          )}
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
          onClick={() => onModeChange('view')}
          className="text-sm px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:border-slate-300 hover:text-slate-700 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </aside>
  )
}
