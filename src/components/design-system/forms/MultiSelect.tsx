import type { HTMLAttributes } from 'react'
import { Checkbox } from '../atoms'
import { cn } from '../utils/cn'

export interface MultiSelectOption {
  label: string
  value: string
}

export interface MultiSelectProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  options: MultiSelectOption[]
  selectedValues: string[]
  onChange: (values: string[]) => void
}

export function MultiSelect({ options, selectedValues, onChange, className, ...props }: MultiSelectProps) {
  const toggle = (value: string) => {
    onChange(selectedValues.includes(value) ? selectedValues.filter((item) => item !== value) : [...selectedValues, value])
  }

  return (
    <div className={cn('space-y-2 rounded-[var(--radius-md)] border border-[var(--border)] p-3', className)} {...props}>
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-[var(--text)]">
          <Checkbox checked={selectedValues.includes(option.value)} onChange={() => toggle(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  )
}
