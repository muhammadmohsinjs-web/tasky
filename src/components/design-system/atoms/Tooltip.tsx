import type { HTMLAttributes, ReactNode } from 'react'

export interface TooltipProps extends HTMLAttributes<HTMLSpanElement> {
  tooltipContent: ReactNode
  children: ReactNode
}

export function Tooltip({ tooltipContent, children, ...props }: TooltipProps) {
  return (
    <span title={typeof tooltipContent === 'string' ? tooltipContent : undefined} {...props}>
      {children}
    </span>
  )
}
