interface Props {
  message?: string
  fullHeight?: boolean
}

export function LoadingSpinner({ message = 'Loading...', fullHeight = true }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullHeight ? 'h-full min-h-[60vh]' : 'py-32'}`}>
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
        <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
      </div>
      <span className="text-xs text-slate-400">{message}</span>
    </div>
  )
}
