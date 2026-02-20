import type { ReactNode } from 'react'

export interface TimelineItem {
  id: string
  title: string
  timestamp: string
  description?: string
  icon?: ReactNode
}

export interface TimelineProps {
  items: TimelineItem[]
}

export function Timeline({ items }: TimelineProps) {
  return (
    <ol className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs">{item.icon ?? '•'}</span>
          <div>
            <p className="text-sm font-medium text-[var(--text-strong)]">{item.title}</p>
            <p className="text-xs text-[var(--text-muted)]">{item.timestamp}</p>
            {item.description ? <p className="mt-1 text-sm text-[var(--text)]">{item.description}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  )
}
