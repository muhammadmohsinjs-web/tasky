import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface ResizablePanelProps extends HTMLAttributes<HTMLDivElement> {
  minHeight?: number
  maxHeight?: number
}

export function ResizablePanel({ minHeight = 200, maxHeight = 640, className, style, ...props }: ResizablePanelProps) {
  return (
    <div
      className={cn('resize-y overflow-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-3', className)}
      style={{ minHeight, maxHeight, ...style }}
      {...props}
    />
  )
}
