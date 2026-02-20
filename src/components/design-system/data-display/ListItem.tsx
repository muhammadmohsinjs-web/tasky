import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  leading?: ReactNode
  trailing?: ReactNode
  title: string
  subtitle?: string
}

export function ListItem({ leading, trailing, title, subtitle, className, ...props }: ListItemProps) {
  return (
    <li className={cn('flex items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2', className)} {...props}>
      <div className="flex items-center gap-3">
        {leading}
        <div>
          <p className="text-sm font-medium text-[var(--text-strong)]">{title}</p>
          {subtitle ? <p className="text-xs text-[var(--text-muted)]">{subtitle}</p> : null}
        </div>
      </div>
      {trailing}
    </li>
  )
}
