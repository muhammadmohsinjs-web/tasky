import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4 | 6 | 12
  gap?: 1 | 2 | 3 | 4 | 6
  children: ReactNode
}

const colClasses: Record<NonNullable<GridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
}

const gapClasses: Record<NonNullable<GridProps['gap']>, string> = {
  1: 'gap-2',
  2: 'gap-4',
  3: 'gap-6',
  4: 'gap-8',
  6: 'gap-12',
}

export function Grid({ columns = 3, gap = 2, className, children, ...props }: GridProps) {
  return (
    <div className={cn('grid', colClasses[columns], gapClasses[gap], className)} {...props}>
      {children}
    </div>
  )
}
