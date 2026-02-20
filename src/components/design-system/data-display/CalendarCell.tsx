import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface CalendarCellProps extends HTMLAttributes<HTMLDivElement> {
  dateLabel: string
  children?: ReactNode
  isToday?: boolean
}

export function CalendarCell({ dateLabel, children, isToday, className, ...props }: CalendarCellProps) {
  return (
    <div className={cn('min-h-28 rounded-[var(--radius-sm)] border border-[var(--calendar-grid-border)] bg-[var(--calendar-cell-bg)] p-2', className)} {...props}>
      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs', isToday ? 'bg-[var(--calendar-today-bg)] text-white' : 'text-[var(--calendar-date-text)]')}>
        {dateLabel}
      </span>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  )
}
