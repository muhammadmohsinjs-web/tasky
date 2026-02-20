import { forwardRef } from 'react'
import type { AnchorHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement>

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link({ className, ...props }, ref) {
  return <a ref={ref} className={cn('text-blue-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300', className)} {...props} />
})
