import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Input } from '../atoms'

export interface CommandItem {
  id: string
  label: string
  hint?: string
  icon?: ReactNode
  onSelect: () => void
}

export interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  items: CommandItem[]
}

export function CommandPalette({ open, onClose, items }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(
    () => items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [items, query],
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/35 p-4 pt-20" onClick={onClose}>
      <div className="w-full max-w-xl rounded-[var(--radius-md)] bg-white p-3 shadow-[var(--shadow-modal)]" onClick={(event) => event.stopPropagation()}>
        <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Type a command..." />
        <ul className="mt-2 max-h-80 space-y-1 overflow-auto">
          {filtered.map((item) => (
            <li key={item.id}>
              <button type="button" className="flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left hover:bg-slate-100" onClick={() => { item.onSelect(); onClose() }}>
                {item.icon}
                <span className="text-sm text-[var(--text)]">{item.label}</span>
                {item.hint ? <span className="ml-auto text-xs text-[var(--text-muted)]">{item.hint}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
