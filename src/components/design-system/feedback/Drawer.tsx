import type { ReactNode } from 'react'

export interface DrawerProps {
  open: boolean
  title?: string
  onClose: () => void
  side?: 'left' | 'right'
  children: ReactNode
}

export function Drawer({ open, title, onClose, side = 'right', children }: DrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/30" role="dialog" aria-modal="true" onClick={onClose}>
      <aside
        className={`absolute top-0 h-full w-full max-w-md bg-white p-4 shadow-[var(--shadow-drawer)] ${side === 'right' ? 'right-0' : 'left-0'}`}
        onClick={(event) => event.stopPropagation()}
      >
        {title ? <h3 className="mb-3 text-base font-semibold text-[var(--text-strong)]">{title}</h3> : null}
        {children}
      </aside>
    </div>
  )
}
