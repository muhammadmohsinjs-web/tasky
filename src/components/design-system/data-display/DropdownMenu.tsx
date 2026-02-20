import { useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface DropdownItem {
  label: string
  onSelect: () => void
}

export interface DropdownMenuProps {
  trigger: ReactNode
  items: DropdownItem[]
  align?: 'left' | 'right'
}

export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <button type="button" onClick={() => setOpen((current) => !current)}>{trigger}</button>
      {open ? (
        <ul className={cn('absolute top-[calc(100%+8px)] z-30 min-w-36 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-1 shadow-[var(--shadow-dropdown)]', align === 'right' ? 'right-0' : 'left-0')}>
          {items.map((item) => (
            <li key={item.label}>
              <button
                type="button"
                onClick={() => {
                  item.onSelect()
                  setOpen(false)
                }}
                className="w-full rounded-[var(--radius-xs)] px-2 py-1.5 text-left text-sm text-[var(--text)] hover:bg-slate-100"
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
