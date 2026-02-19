import { EllipsisVertical } from 'lucide-react';
import { formatTaskDate } from './calendarHelpers';
import type { CalendarTask } from './types';

interface TaskCardProps {
  task: CalendarTask;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
}

const STATUS_META = {
  in_progress: {
    label: 'In Progress',
    badgeClass: 'bg-rose-100 text-rose-600',
  },
  pending: {
    label: 'Pending',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
} as const;

const CATEGORY_DOT_CLASS = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
  blue: 'bg-blue-500',
} as const;

export function TaskCard({ task, isSelected, onSelect }: TaskCardProps) {
  const meta = STATUS_META[task.status];

  return (
    <button
      type="button"
      onClick={() => onSelect(task.id)}
      className={[
        'w-full rounded-xl border bg-white p-4 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        isSelected
          ? 'border-blue-200 bg-blue-50/60 shadow-[0_3px_12px_rgba(37,99,235,0.12)]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
      ].join(' ')}
      aria-pressed={isSelected}
    >
      <div className="flex items-start gap-3">
        <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${CATEGORY_DOT_CLASS[task.categoryColor]}`} aria-hidden="true" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="truncate text-base font-semibold text-slate-800">{task.title}</p>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>{formatTaskDate(task.dateISO)}</span>
              <button
                type="button"
                aria-label="Open task actions"
                onClick={(event) => event.stopPropagation()}
                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${meta.badgeClass}`}>{meta.label}</span>
            <span className="text-sm text-slate-500">{task.timeLabel}</span>
          </div>
        </div>
      </div>
    </button>
  );
}
