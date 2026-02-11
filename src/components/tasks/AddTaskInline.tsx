import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, CalendarDays } from 'lucide-react'
import type { Category } from '../../types'

interface Props {
  date: string
  onAdd: (title: string, categoryId: string, date: string) => void
  categories: Category[]
}

/**
 * Add-task button that opens a centered popup modal.
 * Frictionless: type a title, pick category, press Enter.
 */
export function AddTaskInline({ date, onAdd, categories }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const resetCategory = () => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed || !categoryId) return
    onAdd(trimmed, categoryId, date)
    setTitle('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setTitle('')
      setOpen(false)
    }
  }

  const formattedDate = (() => {
    const [y, m, d] = date.split('-')
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })()

  return (
    <>
      <button
        onClick={() => { resetCategory(); setOpen(true) }}
        className="w-full text-left text-xs text-slate-300 hover:text-indigo-500 py-1 cursor-pointer flex items-center gap-1.5 group/add mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="opacity-0 group-hover/add:opacity-100 transition-opacity">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-medium">add task</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={() => { setTitle(''); setOpen(false) }}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">New Task</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm text-slate-400">{formattedDate}</span>
                </div>
              </div>
              <button
                onClick={() => { setTitle(''); setOpen(false) }}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="px-6 pb-6 pt-2 text-sm text-slate-400">
                Add categories first to create tasks.
              </div>
            ) : (
              <div className="px-6 pb-6 pt-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Title</label>
                  <input
                    type="text"
                    placeholder="What did you learn?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Task
                  </button>
                  <button
                    onClick={() => { setTitle(''); setOpen(false) }}
                    className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
