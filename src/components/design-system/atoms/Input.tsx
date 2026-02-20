import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ className, hasError, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[var(--radius-md)] border bg-white px-3 text-sm text-[var(--text)] shadow-xs outline-none transition focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)]',
        hasError ? 'border-red-300 focus-visible:ring-red-200' : 'border-[var(--border-strong)]',
        className,
      )}
      {...props}
    />
  )
})
