import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import { Input } from '../atoms'

export type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, ...props },
  ref,
) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <Input ref={ref} type="search" className={`pl-9 ${className ?? ''}`} {...props} />
    </div>
  )
})
