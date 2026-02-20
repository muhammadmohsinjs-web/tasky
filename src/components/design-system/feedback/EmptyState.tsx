import type { ReactNode } from 'react'

export interface EmptyStateProps {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-white p-8 text-center">
      <h3 className="text-base font-semibold text-[var(--text-strong)]">{title}</h3>
      {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
