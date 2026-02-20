import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch({ className, label, id, ...props }, ref) {
  const generatedId = useId()
  const controlId = id ?? generatedId

  return (
    <label className="inline-flex items-center gap-2">
      <span className="relative inline-flex h-6 w-11 items-center">
        <input ref={ref} id={controlId} type="checkbox" className="peer sr-only" role="switch" {...props} />
        <span
          className={cn(
            'h-6 w-11 rounded-full bg-slate-300 transition peer-focus-visible:ring-2 peer-focus-visible:ring-blue-300 peer-checked:bg-blue-600 peer-disabled:cursor-not-allowed peer-disabled:opacity-60',
            className,
          )}
        />
        <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white transition peer-checked:translate-x-5" />
      </span>
      {label ? <span className="text-sm text-[var(--text)]">{label}</span> : null}
    </label>
  )
})
