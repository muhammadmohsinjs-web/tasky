import type { HTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses: Record<NonNullable<ContainerProps['size']>, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
}

export function Container({ size = 'lg', className, ...props }: ContainerProps) {
  return <div className={cn('mx-auto w-full px-4', sizeClasses[size], className)} {...props} />
}
