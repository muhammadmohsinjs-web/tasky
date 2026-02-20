import type { DragEvent, ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface DragDropWrapperProps {
  onDropFiles?: (files: FileList) => void
  children: ReactNode
  className?: string
}

export function DragDropWrapper({ onDropFiles, children, className }: DragDropWrapperProps) {
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (event.dataTransfer.files.length > 0) {
      onDropFiles?.(event.dataTransfer.files)
    }
  }

  return (
    <div
      className={cn('rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] p-4', className)}
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
    >
      {children}
    </div>
  )
}
