import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Input } from '../atoms'

export interface ComboboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'list'> {
  options: string[]
}

export const Combobox = forwardRef<HTMLInputElement, ComboboxProps>(function Combobox(
  { options, id, ...props },
  ref,
) {
  const generatedId = useId()
  const listId = `${id ?? generatedId}-list`

  return (
    <>
      <Input ref={ref} id={id ?? generatedId} list={listId} role="combobox" aria-controls={listId} {...props} />
      <datalist id={listId}>
        {options.map((option) => (
          <option key={option} value={option} />
        ))}
      </datalist>
    </>
  )
})
