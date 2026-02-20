import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from '../atoms'

export type TimePickerProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(function TimePicker(props, ref) {
  return <Input ref={ref} type="time" {...props} />
})
