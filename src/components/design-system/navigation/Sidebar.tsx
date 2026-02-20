import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface SidebarProps {
  header?: ReactNode
  footer?: ReactNode
  children: ReactNode
  className?: string
}

export function Sidebar({ header, footer, children, className }: SidebarProps) {
  return (
    <aside className={cn('flex h-full w-64 flex-col border-r border-[var(--border)] bg-white p-3', className)}>
      {header ? <div className="mb-3">{header}</div> : null}
      <div className="flex-1 space-y-1 overflow-auto">{children}</div>
      {footer ? <div className="mt-3">{footer}</div> : null}
    </aside>
  )
}
