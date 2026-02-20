import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  orientation?: 'horizontal' | 'vertical'
}

export function Divider({ className, orientation = 'horizontal', ...props }: DividerProps) {
  return (
    <hr
      className={cn(orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px min-h-4', 'border-0 bg-[var(--border)]', className)}
      {...props}
    />
  )
}
