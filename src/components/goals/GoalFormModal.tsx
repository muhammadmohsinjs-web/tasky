import { useEffect, useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { CATEGORY_PALETTE } from '../../lib/constants'
import type { Goal } from '../../types'

interface GoalFormValues {
  title: string
  description: string | null
  start_date: string | null
  end_date: string | null
  color: string | null
  status?: Goal['status']
}

interface GoalFormModalProps {
  isOpen: boolean
  mode: 'create' | 'edit'
  initialGoal?: Goal | null
  onClose: () => void
  onSubmit: (values: GoalFormValues) => Promise<boolean>
}

export function GoalFormModal({ isOpen, mode, initialGoal = null, onClose, onSubmit }: GoalFormModalProps) {
  const [submitting, setSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [color, setColor] = useState<string>('')
  const [status, setStatus] = useState<Goal['status']>('active')
  const [titleError, setTitleError] = useState('')

  const heading = useMemo(() => (mode === 'create' ? 'Create Goal' : 'Edit Goal'), [mode])

  useEffect(() => {
    if (!isOpen) return
    setTitle(initialGoal?.title ?? '')
    setDescription(initialGoal?.description ?? '')
    setStartDate(initialGoal?.start_date ?? '')
    setEndDate(initialGoal?.end_date ?? '')
    setColor(initialGoal?.color ?? '')
    setStatus(initialGoal?.status ?? 'active')
    setTitleError('')
  }, [isOpen, initialGoal])

  if (!isOpen) return null

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting) return

    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      setTitleError('Title is required')
      return
    }

    setSubmitting(true)
    try {
      const ok = await onSubmit({
        title: normalizedTitle,
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        color: color || null,
        status,
      })

      if (ok) onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4" onClick={() => !submitting && onClose()}>
      <section
        className="w-full max-w-xl rounded-3xl border border-[#DCE5F3] bg-white p-5 md:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="mb-5 flex items-center justify-between border-b border-[#E8EDF5] pb-4">
          <h2 className="text-2xl font-semibold text-[#132238]">{heading}</h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#314866]">Title</span>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value)
                if (titleError && event.target.value.trim()) setTitleError('')
              }}
              className={`h-11 w-full rounded-xl border bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                titleError ? 'border-red-500' : 'border-[#CFDBEA]'
              }`}
              placeholder="Goal title"
            />
            {titleError ? <p className="mt-1 text-xs text-red-500">{titleError}</p> : null}
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-[#314866]">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[#CFDBEA] bg-white px-3 py-2 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="What are you trying to achieve?"
            />
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Start date</span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47]"
              />
            </label>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-[#314866]">Color</span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setColor('')}
                className={`h-8 px-2 rounded-lg border text-xs font-semibold ${
                  color === '' ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-500'
                }`}
              >
                Default
              </button>
              {CATEGORY_PALETTE.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  aria-label={`Select color ${swatch.name}`}
                  onClick={() => setColor(swatch.hex)}
                  className={`h-8 w-8 rounded-lg border-2 ${color === swatch.hex ? 'border-slate-700' : 'border-transparent'}`}
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          </div>

          {mode === 'edit' ? (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as Goal['status'])}
                className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47]"
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </label>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Saving...' : mode === 'create' ? 'Create goal' : 'Save changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
