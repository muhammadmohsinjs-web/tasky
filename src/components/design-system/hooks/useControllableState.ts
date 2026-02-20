import { useCallback, useState } from 'react'

export interface UseControllableStateParams<TValue> {
  value?: TValue
  defaultValue: TValue
  onChange?: (value: TValue) => void
}

export function useControllableState<TValue>({ value, defaultValue, onChange }: UseControllableStateParams<TValue>) {
  const [internalValue, setInternalValue] = useState(defaultValue)
  const currentValue = value ?? internalValue

  const setValue = useCallback(
    (nextValue: TValue) => {
      if (value === undefined) {
        setInternalValue(nextValue)
      }
      onChange?.(nextValue)
    },
    [onChange, value],
  )

  return [currentValue, setValue] as const
}
