import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface SidebarItemProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean
}

export function SidebarItem({ active, className, ...props }: SidebarItemProps) {
  return (
    <a
      className={cn(
        'block rounded-[var(--radius-sm)] px-3 py-2 text-sm',
        active ? 'bg-blue-50 text-blue-700' : 'text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--text)]',
        className,
      )}
      {...props}
    />
  )
}
