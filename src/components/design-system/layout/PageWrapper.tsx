import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type PageWrapperProps = HTMLAttributes<HTMLDivElement>

export function PageWrapper({ className, ...props }: PageWrapperProps) {
  return <div className={cn('min-h-screen bg-[var(--bg-canvas)] px-4 py-6', className)} {...props} />
}
