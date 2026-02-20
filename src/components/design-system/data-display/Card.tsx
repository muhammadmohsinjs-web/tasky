import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: ReactNode
}

export function Card({ title, description, footer, className, children, ...props }: CardProps) {
  return (
    <section className={cn('rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4 shadow-[var(--shadow-sm)]', className)} {...props}>
      {title ? <h3 className="text-base font-semibold text-[var(--text-strong)]">{title}</h3> : null}
      {description ? <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p> : null}
      <div className={title || description ? 'mt-3' : ''}>{children}</div>
      {footer ? <div className="mt-4 border-t border-[var(--border)] pt-3">{footer}</div> : null}
    </section>
  )
}
