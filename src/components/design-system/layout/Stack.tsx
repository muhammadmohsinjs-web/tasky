import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'vertical' | 'horizontal'
  gap?: 1 | 2 | 3 | 4
  align?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between'
  children: ReactNode
}

const gapClasses: Record<NonNullable<StackProps['gap']>, string> = {
  1: 'gap-2',
  2: 'gap-4',
  3: 'gap-6',
  4: 'gap-8',
}

const alignClasses: Record<NonNullable<StackProps['align']>, string> = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
}

const justifyClasses: Record<NonNullable<StackProps['justify']>, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
}

export function Stack({
  direction = 'vertical',
  gap = 2,
  align = 'stretch',
  justify = 'start',
  className,
  children,
  ...props
}: StackProps) {
  return (
    <div className={cn('flex', direction === 'vertical' ? 'flex-col' : 'flex-row', gapClasses[gap], alignClasses[align], justifyClasses[justify], className)} {...props}>
      {children}
    </div>
  )
}
