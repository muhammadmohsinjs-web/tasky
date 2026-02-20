import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cva } from '../utils/variants'
import { cn } from '../utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] border text-sm font-semibold leading-none transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'border-transparent text-white bg-linear-to-br from-blue-600 to-blue-700 shadow-sm hover:from-blue-700 hover:to-blue-800',
        secondary: 'border-[var(--border-strong)] bg-white text-[var(--text)] hover:bg-slate-50',
        ghost:
          'border-transparent bg-transparent text-[var(--text-muted)] hover:bg-slate-100 hover:text-[var(--text)]',
        destructive: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4',
        lg: 'h-11 px-5',
        icon: 'h-10 w-10 p-0',
      },
      state: {
        default: '',
        loading: 'cursor-wait',
        error: 'ring-2 ring-red-200',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      state: 'default',
    },
  },
)

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  state?: 'default' | 'loading' | 'error'
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

/**
 * Reusable action trigger with visual variants, size scale, and loading/error states.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    children,
    variant = 'primary',
    size = 'md',
    state = 'default',
    isLoading = false,
    disabled,
    leftIcon,
    rightIcon,
    type = 'button',
    ...props
  },
  ref,
) {
  const computedState = isLoading ? 'loading' : state

  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, state: computedState }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
        />
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
})
