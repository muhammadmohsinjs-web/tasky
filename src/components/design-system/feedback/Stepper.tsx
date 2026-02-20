import { cn } from '../utils/cn'

export interface StepperProps {
  steps: string[]
  currentStep: number
  className?: string
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <ol className={cn('flex flex-wrap items-center gap-2', className)}>
      {steps.map((step, index) => {
        const active = index === currentStep
        const complete = index < currentStep

        return (
          <li key={step} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                'inline-flex h-6 w-6 items-center justify-center rounded-full border font-semibold',
                complete ? 'border-emerald-600 bg-emerald-600 text-white' : active ? 'border-blue-600 text-blue-700' : 'border-slate-300 text-slate-500',
              )}
            >
              {index + 1}
            </span>
            <span className={active ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}>{step}</span>
          </li>
        )
      })}
    </ol>
  )
}
