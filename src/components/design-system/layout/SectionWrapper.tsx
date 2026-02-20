import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type SectionWrapperProps = HTMLAttributes<HTMLElement>

export function SectionWrapper({ className, ...props }: SectionWrapperProps) {
  return <section className={cn('rounded-[var(--radius-md)] border border-[var(--border)] bg-white p-4', className)} {...props} />
}
