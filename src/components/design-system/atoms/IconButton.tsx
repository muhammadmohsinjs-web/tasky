import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Button } from './Button'

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: ReactNode
  label: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, label, variant = 'ghost', ...props },
  ref,
) {
  return (
    <Button ref={ref} size="icon" variant={variant} aria-label={label} {...props}>
      {icon}
    </Button>
  )
})
