import { cn } from '../utils/cn'

export interface SpinnerProps {
  className?: string
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-7 w-7 border-3',
}

export function Spinner({ className, label = 'Loading', size = 'md' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center">
      <span className={cn('animate-spin rounded-full border-current border-r-transparent text-blue-600', sizeClasses[size], className)} />
    </span>
  )
}
