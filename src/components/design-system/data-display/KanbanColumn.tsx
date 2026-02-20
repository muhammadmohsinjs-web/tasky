import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface KanbanColumnProps {
  title: string
  count?: number
  children: ReactNode
  className?: string
}

export function KanbanColumn({ title, count, children, className }: KanbanColumnProps) {
  return (
    <section className={cn('min-h-60 rounded-[var(--radius-md)] bg-slate-100 p-3', className)}>
      <header className="mb-3 flex items-center justify-between text-sm font-medium text-[var(--text-strong)]">
        <span>{title}</span>
        {count !== undefined ? <span className="rounded-full bg-white px-2 py-0.5 text-xs text-[var(--text-muted)]">{count}</span> : null}
      </header>
      <div className="space-y-2">{children}</div>
    </section>
  )
}
