import { forwardRef } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface SelectOption {
  label: string
  value: string
  disabled?: boolean
}

export interface SelectDropdownProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  placeholder?: string
}

export const SelectDropdown = forwardRef<HTMLSelectElement, SelectDropdownProps>(function SelectDropdown(
  { className, options, placeholder, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3 text-sm text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-[var(--disabled-bg)]',
        className,
      )}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
})
