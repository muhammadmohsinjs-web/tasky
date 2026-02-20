import { cn } from '../utils/cn'

export interface ProgressBarProps {
  value: number
  max?: number
  className?: string
}

export function ProgressBar({ value, max = 100, className }: ProgressBarProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100))

  return (
    <div className={cn('h-2 w-full rounded-full bg-slate-200', className)} role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}>
      <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${percent}%` }} />
    </div>
  )
}
