import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface RangeSliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const RangeSlider = forwardRef<HTMLInputElement, RangeSliderProps>(function RangeSlider(
  { className, label, ...props },
  ref,
) {
  return (
    <div className="space-y-2">
      {label ? <span className="text-xs text-[var(--text-muted)]">{label}</span> : null}
      <input
        ref={ref}
        type="range"
        className={cn('h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-blue-600', className)}
        {...props}
      />
    </div>
  )
})
