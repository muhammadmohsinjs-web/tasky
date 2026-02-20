import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

interface BaseTypographyProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode
}

export function Heading({ className, children, ...props }: BaseTypographyProps) {
  return (
    <h2 className={cn('text-2xl font-semibold tracking-tight text-[var(--text-strong)]', className)} {...props}>
      {children}
    </h2>
  )
}

export function Text({ className, children, ...props }: BaseTypographyProps) {
  return (
    <p className={cn('text-sm text-[var(--text)]', className)} {...props}>
      {children}
    </p>
  )
}

export function Caption({ className, children, ...props }: BaseTypographyProps) {
  return (
    <span className={cn('text-xs text-[var(--text-muted)]', className)} {...props}>
      {children}
    </span>
  )
}
