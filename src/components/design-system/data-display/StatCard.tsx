import type { ReactNode } from 'react'
import { Card } from './Card'

export interface StatCardProps {
  label: string
  value: string | number
  delta?: string
  icon?: ReactNode
}

export function StatCard({ label, value, delta, icon }: StatCardProps) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-[var(--text-muted)]">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--text-strong)]">{value}</p>
          {delta ? <p className="mt-1 text-xs text-emerald-700">{delta}</p> : null}
        </div>
        {icon ? <div className="text-[var(--text-muted)]">{icon}</div> : null}
      </div>
    </Card>
  )
}
