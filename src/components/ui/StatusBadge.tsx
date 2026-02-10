import type { TaskStatus } from '../../types'
import { STATUS_CONFIG } from '../../lib/constants'
import { Circle, Clock, CheckCircle2 } from 'lucide-react'

const STATUS_ICONS = {
  todo: Circle,
  inprogress: Clock,
  done: CheckCircle2,
} as const

interface Props {
  status: TaskStatus
  size?: 'sm' | 'md'
  onClick?: (e: React.MouseEvent) => void
}

export function StatusBadge({ status, size = 'sm', onClick }: Props) {
  const config = STATUS_CONFIG[status]
  const Icon = STATUS_ICONS[status]
  const sizeClass = size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap ${config.color} ${sizeClass} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  )
}

export function nextStatus(current: TaskStatus): TaskStatus {
  const cycle: TaskStatus[] = ['todo', 'inprogress', 'done']
  return cycle[(cycle.indexOf(current) + 1) % cycle.length]
}
