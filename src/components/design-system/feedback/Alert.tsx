import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  variant?: 'info' | 'success' | 'warning' | 'error'
  children: ReactNode
}

const variantClasses: Record<NonNullable<AlertProps['variant']>, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  error: 'border-red-200 bg-red-50 text-red-800',
}

export function Alert({ title, variant = 'info', className, children, ...props }: AlertProps) {
  return (
    <div className={cn('rounded-[var(--radius-md)] border p-3 text-sm', variantClasses[variant], className)} role="alert" {...props}>
      {title ? <p className="mb-1 font-semibold">{title}</p> : null}
      <div>{children}</div>
    </div>
  )
}
