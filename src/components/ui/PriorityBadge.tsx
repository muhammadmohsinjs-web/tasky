import { Flag } from 'lucide-react'
import type { TaskPriority } from '../../types'
import { PRIORITY_CONFIG } from '../../lib/constants'

interface Props {
  priority: TaskPriority
  size?: 'sm' | 'md'
}

export function PriorityBadge({ priority, size = 'sm' }: Props) {
  const config = PRIORITY_CONFIG[priority]
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'

  return (
    <div className="flex items-center gap-1" title={`Priority: ${config.label}`}>
      <Flag className={`${iconSize} ${config.color}`} fill="currentColor" />
    </div>
  )
}
