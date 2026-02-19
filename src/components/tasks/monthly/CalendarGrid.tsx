import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatMonthLabel, generateMonthGrid, getTasksForDate, WEEKDAY_LABELS } from './calendarHelpers';
import type { CalendarTask } from './types';

interface CalendarGridProps {
  monthDate: Date;
  selectedDateISO: string;
  tasks: CalendarTask[];
  onSelectDate: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  showHeader?: boolean;
}

const DOT_CLASS = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
  blue: 'bg-blue-500',
} as const;

export function CalendarGrid({ monthDate, selectedDateISO, tasks, onSelectDate, onPrevMonth, onNextMonth, showHeader = true }: CalendarGridProps) {
  const monthCells = generateMonthGrid(monthDate.getFullYear(), monthDate.getMonth());

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6" aria-label="Monthly calendar">
      {showHeader ? (
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{formatMonthLabel(monthDate)}</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrevMonth}
              aria-label="Previous month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onNextMonth}
              aria-label="Next month"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200">
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80">
          {WEEKDAY_LABELS.map((dayLabel, dayIndex) => (
            <div
              key={dayLabel}
              className={`px-2 py-3 text-center text-sm font-medium md:px-3 md:text-[15px] ${dayIndex === 0 ? 'text-rose-500' : 'text-slate-600'}`}
            >
              {dayLabel}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {monthCells.map((cell) => {
            const dayTasks = getTasksForDate(tasks, cell.isoDate);
            const visibleDayTasks = dayTasks.slice(0, 3);
            const hiddenCount = dayTasks.length - visibleDayTasks.length;
            const isSelected = selectedDateISO === cell.isoDate;

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => onSelectDate(cell.isoDate)}
                className={[
                  'group min-h-[105px] border-r border-b border-slate-200 p-2 text-left transition md:min-h-[140px] md:p-3',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                  cell.inCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50 text-slate-400',
                  isSelected ? 'bg-blue-50/60' : '',
                ].join(' ')}
                aria-label={`Select ${cell.isoDate}`}
                aria-pressed={isSelected}
              >
                <span
                  className={[
                    'inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-base font-medium md:h-8 md:min-w-8',
                    cell.inCurrentMonth ? 'text-slate-700' : 'text-slate-400',
                    isSelected ? 'border-2 border-blue-500 text-blue-600' : '',
                  ].join(' ')}
                >
                  {cell.dayNumber}
                </span>

                <div className="mt-2 space-y-1.5">
                  {visibleDayTasks.map((task) => (
                    <span
                      key={task.id}
                      className="flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-1 text-[11px] font-medium text-slate-600 md:text-xs"
                    >
                      <span className={`h-2 w-2 rounded-full ${DOT_CLASS[task.categoryColor]}`} aria-hidden="true" />
                      <span className="truncate">{task.timeLabel}</span>
                    </span>
                  ))}

                  {hiddenCount > 0 ? (
                    <span className="inline-flex rounded-full bg-blue-100 px-2 py-1 text-[11px] font-medium text-blue-700 md:text-xs">
                      +{hiddenCount} more
                    </span>
                  ) : null}

                  {dayTasks.length === 0 && cell.inCurrentMonth ? (
                    <span className="block pt-2 text-[11px] text-slate-300 md:text-sm">add task</span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
