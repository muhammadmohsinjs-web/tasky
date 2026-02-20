import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, Inbox, CalendarDays, Sparkles } from 'lucide-react'
import type { Category, TaskPriority } from '../../types'

type Destination = 'backlog' | 'date'
type ParsedInput = {
  titles: string[]
  duplicateCount: number
}

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

  const parsedInput = useMemo<ParsedInput>(() => {
    const seen = new Set<string>()
    let duplicateCount = 0
    const titles = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .filter((title) => {
        const normalized = title.toLowerCase()
        if (seen.has(normalized)) {
          duplicateCount += 1
          return false
        }
        seen.add(normalized)
        return true
      })

    return { titles, duplicateCount }
  }, [text])

  const taskCount = parsedInput.titles.length

  const handleSubmit = async () => {
    if (taskCount === 0) return
    if (destination === 'date' && !date) return

    setSubmitting(true)
    try {
      if (destination === 'backlog') {
        await onAddToBacklog(parsedInput.titles.map((title) => ({ title, categoryId, priority })))
      } else {
        await onAddToDate(parsedInput.titles.map((title) => ({ title, categoryId, date, priority })))
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
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      void handleSubmit()
      return
    }
    if (e.key === 'Escape') {
      onClose()
    }
  }

  const handleDestinationChange = (nextDestination: Destination) => {
    setDestination(nextDestination)
    if (nextDestination === 'date' && !date) {
      setDate(new Date().toISOString().slice(0, 10))
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
        className="relative w-full max-w-2xl mx-4 overflow-hidden rounded-3xl border border-[#DEE7F5] bg-white shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-gradient-to-r from-[#5A7DFF] via-[#5AA6FF] to-[#70D6FF]" />

        <div className="flex items-start justify-between px-6 pt-6 pb-3">
          <div>
            <h3 className="text-2xl font-bold text-[#13243F]">Bulk Add Tasks</h3>
            <p className="mt-1 text-sm text-[#5B6F8E]">Paste one task per line. Duplicates are skipped automatically.</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-xl p-2 text-[#7A8EAC] hover:bg-[#EEF4FF] hover:text-[#4E6488]"
            aria-label="Close bulk add dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

          <div className="px-6 pb-6 pt-1 space-y-5">
            {/* Textarea */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#2C4160]">Task Titles</label>
              <textarea
                placeholder={"Research auth providers\nWrite API documentation\nDesign onboarding flow"}
                value={text}
                onChange={(e) => setText(e.target.value)}
                autoFocus
                rows={7}
                className="w-full rounded-2xl border border-[#CBD8EC] bg-[#FCFDFF] px-4 py-3 text-sm leading-relaxed text-[#18304F] placeholder:text-[#95A6C0] focus:border-[#6D8DFF] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF] resize-none"
              />
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full bg-[#E9F1FF] px-2.5 py-1 font-semibold text-[#2959A6]">
                  {taskCount} {taskCount === 1 ? 'task' : 'tasks'} ready
                </span>
                {parsedInput.duplicateCount > 0 ? (
                  <span className="inline-flex items-center rounded-full bg-[#FFF4E6] px-2.5 py-1 font-semibold text-[#8A5A15]">
                    {parsedInput.duplicateCount} duplicate{parsedInput.duplicateCount === 1 ? '' : 's'} skipped
                  </span>
                ) : null}
                <span className="text-[#6B7D98]">Tip: press Cmd/Ctrl + Enter to add quickly.</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Category */}
              {categories.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#CAD8EC] bg-white px-4 text-sm text-[#203855] focus:border-[#6D8DFF] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF]"
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
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="h-12 w-full rounded-2xl border border-[#CAD8EC] bg-white px-4 text-sm text-[#203855] focus:border-[#6D8DFF] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF]"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Destination toggle */}
            <div className="rounded-2xl border border-[#D9E4F4] bg-[#F8FBFF] p-3">
              <label className="mb-2 block text-sm font-semibold text-[#2C4160]">Destination</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => handleDestinationChange('backlog')}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold cursor-pointer transition ${
                    destination === 'backlog'
                      ? 'border-[#95B5FF] bg-[#EAF2FF] text-[#1F4C9A]'
                      : 'border-[#D6E1F2] bg-white text-[#576B8B] hover:bg-[#F2F7FF]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <Inbox className="h-4 w-4" />
                    Backlog
                  </span>
                  {destination === 'backlog' ? <span className="rounded-full bg-[#CDE0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Active</span> : null}
                </button>
                <button
                  onClick={() => handleDestinationChange('date')}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm font-semibold cursor-pointer transition ${
                    destination === 'date'
                      ? 'border-[#95B5FF] bg-[#EAF2FF] text-[#1F4C9A]'
                      : 'border-[#D6E1F2] bg-white text-[#576B8B] hover:bg-[#F2F7FF]'
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Schedule
                  </span>
                  {destination === 'date' ? <span className="rounded-full bg-[#CDE0FF] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Active</span> : null}
                </button>
              </div>
            </div>

            {/* Date picker (conditional) */}
            {destination === 'date' && (
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-[#CAD8EC] bg-white px-4 text-sm text-[#203855] focus:border-[#6D8DFF] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF]"
                />
                <p className="mt-1.5 text-xs text-[#667A98]">New tasks will be added on this date in calendar view.</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center">
              <button
                onClick={handleSubmit}
                disabled={taskCount === 0 || submitting || (destination === 'date' && !date)}
                className="flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#5E79FF] to-[#6FAAFF] px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                {submitting
                  ? 'Adding...'
                  : taskCount > 0
                    ? `Add ${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}`
                    : 'Add Tasks'
                }
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setText('')}
                  disabled={!text.trim() || submitting}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#D8E2F3] bg-white px-4 text-sm font-semibold text-[#546A8D] hover:bg-[#F3F7FF] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear
                </button>
                <button
                  onClick={onClose}
                  className="inline-flex h-12 items-center justify-center rounded-2xl px-4 text-sm font-semibold text-[#546A8D] hover:bg-[#F3F7FF]"
                >
                  Cancel
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#DBE6F6] bg-[#F7FBFF] px-3 py-2.5">
              <p className="inline-flex items-center gap-2 text-xs text-[#4A6288]">
                <Sparkles className="h-3.5 w-3.5 text-[#4D74DE]" />
                Bulk add keeps category and priority consistent so planning stays clean.
              </p>
            </div>
          </div>
      </div>
    </div>,
    document.body
  )
}
