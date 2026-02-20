import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface NavbarProps {
  brand: ReactNode
  actions?: ReactNode
  className?: string
}

export function Navbar({ brand, actions, className }: NavbarProps) {
  return (
    <nav className={cn('flex h-14 items-center justify-between border-b border-[var(--border)] bg-white px-4', className)}>
      <div>{brand}</div>
      <div className="flex items-center gap-2">{actions}</div>
    </nav>
  )
}
