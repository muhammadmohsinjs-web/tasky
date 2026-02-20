import { forwardRef } from 'react'
import type { FormHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export type FormWrapperProps = FormHTMLAttributes<HTMLFormElement>

export const FormWrapper = forwardRef<HTMLFormElement, FormWrapperProps>(function FormWrapper(
  { className, ...props },
  ref,
) {
  return <form ref={ref} className={cn('space-y-4', className)} {...props} />
})
