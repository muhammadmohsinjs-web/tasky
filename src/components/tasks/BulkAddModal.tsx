import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Inbox, CalendarDays } from 'lucide-react'
import type { Category, TaskPriority } from '../../types'

type Destination = 'backlog' | 'date'

interface Props {
  open: boolean
  onClose: () => void
  categories: Category[]
  onAddToDate: (items: { title: string; categoryId: string; date: string; priority?: TaskPriority }[]) => Promise<void>
  onAddToBacklog: (items: { title: string; categoryId: string; priority?: TaskPriority }[]) => Promise<void>
}

export function BulkAddModal({ open, onClose, categories, onAddToDate, onAddToBacklog }: Props) {
  const [text, setText] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [destination, setDestination] = useState<Destination>('backlog')
  const [date, setDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const titles = useMemo(() => {
    return text.split('\n').map((l) => l.trim()).filter(Boolean)
  }, [text])

  const taskCount = titles.length

  const handleSubmit = async () => {
    if (taskCount === 0) return
    if (destination === 'date' && !date) return

    setSubmitting(true)
    try {
      if (destination === 'backlog') {
        await onAddToBacklog(titles.map((title) => ({ title, categoryId, priority })))
      } else {
        await onAddToDate(titles.map((title) => ({ title, categoryId, date, priority })))
      }
      setText('')
      setDate('')
      setPriority('medium')
      setDestination('backlog')
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Bulk Add Tasks</h3>
            <p className="text-sm text-slate-400 mt-0.5">One task per line</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

          <div className="px-6 pb-6 pt-2 space-y-4">
            {/* Textarea */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Task Titles</label>
              <textarea
                placeholder={"Research auth providers\nWrite API documentation\nDesign onboarding flow"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                rows={6}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-slate-300 resize-none leading-relaxed"
              />
              {taskCount > 0 && (
                <p className="text-xs text-slate-400 mt-1.5">
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'} will be created
                </p>
              )}
            </div>

            {/* Category */}
            {categories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Destination toggle */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Destination</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDestination('backlog')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border cursor-pointer transition-colors ${
                    destination === 'backlog'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Inbox className="w-4 h-4" />
                  Backlog
                </button>
                <button
                  onClick={() => setDestination('date')}
                  className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl border cursor-pointer transition-colors ${
                    destination === 'date'
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <CalendarDays className="w-4 h-4" />
                  Schedule
                </button>
              </div>
            </div>

            {/* Date picker (conditional) */}
            {destination === 'date' && (
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSubmit}
                disabled={taskCount === 0 || submitting || (destination === 'date' && !date)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                {submitting
                  ? 'Adding...'
                  : taskCount > 0
                    ? `Add ${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}`
                    : 'Add Tasks'
                }
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
      </div>
    </div>,
    document.body
  )
}
