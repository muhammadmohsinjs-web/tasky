import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface KanbanCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

export function KanbanCard({ title, description, className, ...props }: KanbanCardProps) {
  return (
    <article className={cn('rounded-[var(--radius-sm)] border border-[var(--border)] bg-white p-3 shadow-xs', className)} {...props}>
      <h4 className="text-sm font-medium text-[var(--text-strong)]">{title}</h4>
      {description ? <p className="mt-1 text-xs text-[var(--text-muted)]">{description}</p> : null}
    </article>
  )
}
