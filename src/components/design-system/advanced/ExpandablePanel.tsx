import { useState } from 'react'
import type { ReactNode } from 'react'

export interface ExpandablePanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function ExpandablePanel({ title, children, defaultOpen = false }: ExpandablePanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-white">
      <button type="button" className="w-full px-4 py-3 text-left text-sm font-medium" onClick={() => setOpen((current) => !current)}>
        {title}
      </button>
      {open ? <div className="border-t border-[var(--border)] px-4 py-3">{children}</div> : null}
    </div>
  )
}
