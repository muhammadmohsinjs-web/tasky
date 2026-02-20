import { forwardRef, useState } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, IconButton } from '../atoms'

export type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  { className, ...props },
  ref,
) {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="relative">
      <Input ref={ref} type={showPassword ? 'text' : 'password'} className={`pr-11 ${className ?? ''}`} {...props} />
      <IconButton
        type="button"
        variant="ghost"
        label={showPassword ? 'Hide password' : 'Show password'}
        icon={showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        className="absolute right-1 top-1/2 -translate-y-1/2"
        onClick={() => setShowPassword((current) => !current)}
      />
    </div>
  )
})
