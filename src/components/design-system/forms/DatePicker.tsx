import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from '../atoms'

export type DatePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(function DatePicker(props, ref) {
  return <Input ref={ref} type="date" {...props} />
})
