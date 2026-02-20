import { useEffect, useMemo, useRef, useState } from 'react'
import { Command, CornerDownLeft } from 'lucide-react'

export interface CommandPaletteAction {
  id: string
  label: string
  hint?: string
  run: () => void
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  actions: CommandPaletteAction[]
}

export function CommandPalette({ open, onOpenChange, actions }: Props) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        onOpenChange(!open)
      } else if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onOpenChange])

  useEffect(() => {
    if (!open) return
    setQuery('')
    inputRef.current?.focus()
  }, [open])

  const filteredActions = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return actions
    return actions.filter(
      (action) =>
        action.label.toLowerCase().includes(q) ||
        action.hint?.toLowerCase().includes(q)
    )
  }, [actions, query])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[12vh]">
      <button
        className="absolute inset-0 bg-slate-950/40"
        onClick={() => onOpenChange(false)}
        aria-label="Close command palette"
      />
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden animate-fade-in">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
          <Command className="w-4 h-4 text-slate-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command..."
            className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
          />
          <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">Esc</kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm text-slate-400">No command found.</div>
          ) : (
            filteredActions.map((action) => (
              <button
                key={action.id}
                onClick={() => {
                  action.run()
                  onOpenChange(false)
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-700 truncate">{action.label}</span>
                  {action.hint && <span className="block text-xs text-slate-400 mt-0.5">{action.hint}</span>}
                </span>
                <CornerDownLeft className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
