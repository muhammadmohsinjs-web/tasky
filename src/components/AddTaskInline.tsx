import { useEffect, useState } from 'react'
import type { Category } from '../types'

interface Props {
  date: string
  onAdd: (title: string, categoryId: string, date: string) => void
  categories: Category[]
}

/**
 * Inline add-task form that appears inside a calendar day cell.
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

  if (!open) {
    return (
      <button
        onClick={() => { resetCategory(); setOpen(true) }}
        className="w-full text-left text-[10px] text-slate-300 hover:text-indigo-400 py-0.5 cursor-pointer flex items-center gap-1 group/add mt-0.5"
      >
        <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="opacity-0 group-hover/add:opacity-100 transition-opacity">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>add task</span>
      </button>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="text-[10px] text-slate-300 py-1">Add categories to start</div>
    )
  }

  return (
    <div className="animate-slide-down flex flex-col gap-1.5 pt-1.5 mt-0.5">
      <input
        type="text"
        placeholder="What did you learn?"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 bg-white placeholder:text-slate-300"
      />
      <div className="flex items-center gap-1.5">
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="text-[10px] px-1.5 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 flex-1"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          className="text-[10px] px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-medium cursor-pointer shadow-sm"
        >
          Add
        </button>
        <button
          onClick={() => { setTitle(''); setOpen(false) }}
          className="text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer px-1"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
