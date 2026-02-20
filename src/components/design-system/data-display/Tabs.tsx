import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export interface TabItem {
  label: string
  value: string
}

export interface TabsProps {
  tabs: TabItem[]
  value: string
  onChange: (value: string) => void
  children?: ReactNode
}

export function Tabs({ tabs, value, onChange, children }: TabsProps) {
  return (
    <div className="space-y-3">
      <div className="inline-flex rounded-[var(--radius-sm)] bg-slate-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'rounded-[var(--radius-sm)] px-3 py-1.5 text-sm',
              value === tab.value ? 'bg-white text-[var(--text-strong)] shadow-xs' : 'text-[var(--text-muted)]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  )
}
