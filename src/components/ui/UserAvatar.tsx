import { User } from 'lucide-react'

interface UserAvatarProps {
  avatarUrl: string | null | undefined
  displayName: string | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
}

export function UserAvatar({ avatarUrl, displayName, size = 'md' }: UserAvatarProps) {
  const sizeClass = sizeMap[size]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={displayName ?? 'User avatar'}
        className={`${sizeClass} rounded-full object-cover`}
        referrerPolicy="no-referrer"
      />
    )
  }

  const initials = displayName
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  if (initials) {
    return (
      <div className={`${sizeClass} rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold`}>
        {initials}
      </div>
    )
  }

  return (
    <div className={`${sizeClass} rounded-full bg-slate-100 text-slate-400 flex items-center justify-center`}>
      <User className="w-4 h-4" />
    </div>
  )
}
