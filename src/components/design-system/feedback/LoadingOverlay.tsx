import type { ReactNode } from 'react'
import { Spinner } from '../atoms'

export interface LoadingOverlayProps {
  loading: boolean
  label?: string
  children: ReactNode
}

export function LoadingOverlay({ loading, label = 'Loading', children }: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {loading ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-[var(--radius-md)] bg-white/70">
          <Spinner label={label} size="lg" />
        </div>
      ) : null}
    </div>
  )
}
