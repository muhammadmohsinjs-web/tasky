import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type SkeletonProps = HTMLAttributes<HTMLDivElement>

export function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn('animate-pulse-soft rounded-[var(--radius-sm)] bg-slate-200', className)} {...props} />
}
