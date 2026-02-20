import type { ImgHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface AvatarProps extends ImgHTMLAttributes<HTMLImageElement> {
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
}

export function Avatar({ fallback, alt = 'Avatar', size = 'md', className, src, ...props }: AvatarProps) {
  if (!src && fallback) {
    return (
      <span
        aria-label={alt}
        className={cn(
          'inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700',
          sizeClasses[size],
          className,
        )}
      >
        {fallback.slice(0, 2).toUpperCase()}
      </span>
    )
  }

  return <img src={src} alt={alt} className={cn('rounded-full object-cover', sizeClasses[size], className)} {...props} />
}
