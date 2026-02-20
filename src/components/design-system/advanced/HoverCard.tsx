import { useState } from 'react'
import type { ReactNode } from 'react'

export interface HoverCardProps {
  trigger: ReactNode
  content: ReactNode
}

export function HoverCard({ trigger, content }: HoverCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {trigger}
      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-56 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-3 text-sm shadow-[var(--shadow-dropdown)]">
          {content}
        </div>
      ) : null}
    </div>
  )
}
