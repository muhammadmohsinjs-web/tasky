import { forwardRef } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, hasError, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-[var(--radius-md)] border bg-white px-3 py-2 text-sm text-[var(--text)] shadow-xs outline-none transition focus-visible:ring-2 disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)] disabled:text-[var(--disabled-text)]',
        hasError ? 'border-red-300 focus-visible:ring-red-200' : 'border-[var(--border-strong)] focus-visible:ring-blue-300',
        className,
      )}
      {...props}
    />
  )
})
