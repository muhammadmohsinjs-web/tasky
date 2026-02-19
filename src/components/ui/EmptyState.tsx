import { CalendarDays, SearchX, FilterX, WifiOff } from 'lucide-react'

type EmptyType = 'no-tasks-day' | 'no-tasks-month' | 'no-search-results' | 'no-filter-results' | 'offline'

interface Props {
  type: EmptyType
  searchQuery?: string
  categoryName?: string
  onClearSearch?: () => void
  onShowAll?: () => void
}

const CONFIG: Record<EmptyType, { icon: typeof CalendarDays; title: string; subtitle: string }> = {
  'no-tasks-day': {
    icon: CalendarDays,
    title: 'No tasks today',
    subtitle: 'Click the + button in any cell to add a task.',
  },
  'no-tasks-month': {
    icon: CalendarDays,
    title: 'No tasks this month',
    subtitle: 'Add your first task to get started.',
  },
  'no-search-results': {
    icon: SearchX,
    title: 'No tasks found',
    subtitle: 'Try a different search term.',
  },
  'no-filter-results': {
    icon: FilterX,
    title: 'No tasks match this filter',
    subtitle: 'Try selecting a different category.',
  },
  offline: {
    icon: WifiOff,
    title: "You're offline",
    subtitle: 'Changes will sync when you reconnect.',
  },
}

export function EmptyState({ type, searchQuery, categoryName, onClearSearch, onShowAll }: Props) {
  const config = CONFIG[type]
  const Icon = config.icon

  const subtitle =
    type === 'no-search-results' && searchQuery
      ? `No tasks match "${searchQuery}".`
      : type === 'no-filter-results' && categoryName
        ? `No ${categoryName} tasks found.`
        : config.subtitle

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-600 mb-1">{config.title}</h3>
      <p className="text-sm text-slate-400 mb-5 text-center max-w-xs">{subtitle}</p>
      <div className="flex items-center gap-2">
        {onClearSearch && (
          <button
            onClick={onClearSearch}
            className="btn btn-secondary text-xs"
          >
            Clear search
          </button>
        )}
        {onShowAll && (
          <button
            onClick={onShowAll}
            className="btn btn-secondary text-xs"
          >
            Show all
          </button>
        )}
      </div>
    </div>
  )
}
