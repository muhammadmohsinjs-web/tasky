import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface TopHeaderBarProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function TopHeaderBar({ title, subtitle, actions, className }: TopHeaderBarProps) {
  return (
    <header className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-strong)]">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </header>
  )
}
