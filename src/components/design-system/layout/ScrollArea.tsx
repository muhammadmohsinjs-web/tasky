import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface ScrollAreaProps extends HTMLAttributes<HTMLDivElement> {
  maxHeight?: number
}

export function ScrollArea({ maxHeight = 320, className, style, ...props }: ScrollAreaProps) {
  return (
    <div className={cn('overflow-auto', className)} style={{ maxHeight, ...style }} {...props} />
  )
}
