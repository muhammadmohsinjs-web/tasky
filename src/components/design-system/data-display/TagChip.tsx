import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface TagChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function TagChip({ active, className, ...props }: TagChipProps) {
  return (
    <button
      type="button"
      className={cn('inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium', active ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-[var(--border)] bg-white text-[var(--text-muted)] hover:text-[var(--text)]', className)}
      {...props}
    />
  )
}
