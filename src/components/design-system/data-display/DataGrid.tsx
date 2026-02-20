import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface DataGridProps extends HTMLAttributes<HTMLDivElement> {
  columns?: 1 | 2 | 3 | 4
  children: ReactNode
}

const columnsMap: Record<NonNullable<DataGridProps['columns']>, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
}

export function DataGrid({ columns = 3, className, children, ...props }: DataGridProps) {
  return (
    <div className={cn('grid gap-4', columnsMap[columns], className)} {...props}>
      {children}
    </div>
  )
}
