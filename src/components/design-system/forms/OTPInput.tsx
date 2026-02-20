import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { cn } from '../utils/cn'

export interface OTPInputProps {
  length?: number
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  className?: string
}

export function OTPInput({ length = 6, value, onChange, disabled, className }: OTPInputProps) {
  const [internalValue, setInternalValue] = useState(value ?? '')
  const values = useMemo(() => (value ?? internalValue).padEnd(length, ' ').slice(0, length).split(''), [internalValue, length, value])
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(value)
    }
  }, [value])

  const emit = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue)
    }
    onChange?.(nextValue)
  }

  const updateAt = (index: number, char: string) => {
    const current = (value ?? internalValue).padEnd(length, ' ').slice(0, length).split('')
    current[index] = char
    const nextValue = current.join('').trimEnd()
    emit(nextValue)
    if (char && index < length - 1) {
      refs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !values[index].trim() && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {values.map((char, index) => (
        <input
          key={index}
          ref={(element) => {
            refs.current[index] = element
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={char.trim()}
          disabled={disabled}
          aria-label={`OTP digit ${index + 1}`}
          onChange={(event) => updateAt(index, event.target.value.replace(/[^0-9A-Za-z]/g, ''))}
          onKeyDown={(event) => handleKeyDown(index, event)}
          className="h-10 w-10 rounded-[var(--radius-sm)] border border-[var(--border-strong)] text-center text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        />
      ))}
    </div>
  )
}
