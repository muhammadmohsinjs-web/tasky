import type { ReactNode } from 'react'
import { Button } from '../atoms'

export interface ModalProps {
  open: boolean
  title?: string
  description?: string
  onClose: () => void
  footer?: ReactNode
  children: ReactNode
}

export function Modal({ open, title, description, onClose, footer, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-[var(--radius-md)] bg-white p-5 shadow-[var(--shadow-modal)]">
        <div className="mb-4">
          {title ? <h3 className="text-lg font-semibold text-[var(--text-strong)]">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
        </div>
        <div>{children}</div>
        <div className="mt-5 flex justify-end gap-2">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
