import { useState } from 'react'
import type { ReactNode } from 'react'

export interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
}

export function Popover({ trigger, children }: PopoverProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative inline-flex">
      <button type="button" onClick={() => setOpen((current) => !current)}>
        {trigger}
      </button>
      {open ? (
        <div className="absolute left-0 top-[calc(100%+8px)] z-30 min-w-44 rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3 shadow-[var(--shadow-dropdown)]">
          {children}
        </div>
      ) : null}
    </div>
  )
}
