import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface MobileNavItem {
  value: string
  label: string
  icon?: ReactNode
}

export interface MobileBottomNavigationProps {
  items: MobileNavItem[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function MobileBottomNavigation({ items, value, onChange, className }: MobileBottomNavigationProps) {
  return (
    <nav className={cn('fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white px-2 py-1 md:hidden', className)}>
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => (
          <li key={item.value}>
            <button
              type="button"
              className={cn('flex w-full flex-col items-center rounded-[var(--radius-sm)] px-2 py-2 text-xs', value === item.value ? 'text-blue-700' : 'text-[var(--text-muted)]')}
              onClick={() => onChange(item.value)}
            >
              {item.icon}
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
