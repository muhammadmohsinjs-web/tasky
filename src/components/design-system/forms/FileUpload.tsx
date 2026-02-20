import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '../utils/cn'

export interface FileUploadProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onFilesChange?: (files: FileList | null) => void
}

export const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(function FileUpload(
  { className, onFilesChange, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      type="file"
      className={cn(
        'block w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-white px-3 py-2 text-sm text-[var(--text)] file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-blue-700',
        className,
      )}
      onChange={(event) => onFilesChange?.(event.target.files)}
      {...props}
    />
  )
})
