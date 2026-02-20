export interface ActivityFeedItem {
  id: string
  actor: string
  action: string
  target?: string
  timestamp: string
}

export interface ActivityFeedProps {
  items: ActivityFeedItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-white px-3 py-2 text-sm">
          <p>
            <span className="font-medium text-[var(--text-strong)]">{item.actor}</span>{' '}
            <span className="text-[var(--text)]">{item.action}</span>{' '}
            {item.target ? <span className="font-medium text-[var(--text-strong)]">{item.target}</span> : null}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{item.timestamp}</p>
        </li>
      ))}
    </ul>
  )
}
