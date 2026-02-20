import type { HTMLAttributes, ReactNode } from 'react'
import { Label } from '../atoms'
import { cn } from '../utils/cn'

export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  label?: string
  hint?: string
  error?: string
  htmlFor?: string
  required?: boolean
  children: ReactNode
}

export function FormField({
  label,
  hint,
  error,
  htmlFor,
  required,
  className,
  children,
  ...props
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)} {...props}>
      {label ? (
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className="ml-1 text-red-600">*</span> : null}
        </Label>
      ) : null}
      {children}
      {error ? <p className="text-xs text-red-600">{error}</p> : hint ? <p className="text-xs text-[var(--text-muted)]">{hint}</p> : null}
    </div>
  )
}
