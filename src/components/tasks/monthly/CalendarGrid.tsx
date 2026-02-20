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
    <section className="h-full rounded-[14px] border border-[#E2E6EE] bg-[#FBFCFF] p-3 md:p-4" aria-label="Monthly calendar">
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

      <div className="overflow-hidden rounded-xl border border-[#E3E7EF] bg-white">
        <div className="grid grid-cols-7 border-b border-[#E3E7EF] bg-[#FAFBFD]">
          {WEEKDAY_LABELS.map((dayLabel, dayIndex) => (
            <div
              key={dayLabel}
              className={`px-2 py-2 text-center text-xs font-semibold md:px-3 md:text-[13px] ${dayIndex === 0 ? 'text-[#DF5B59]' : 'text-[#4D576D]'}`}
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
            const isSundayInMonth = cell.inCurrentMonth && cell.date.getDay() === 0;

            return (
              <button
                key={cell.isoDate}
                type="button"
                onClick={() => onSelectDate(cell.isoDate)}
                className={[
                  'group min-h-[90px] border-r border-b border-[#E3E7EF] p-2 text-left transition md:min-h-[120px] md:p-2.5',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                  cell.inCurrentMonth ? 'bg-white hover:bg-[#F8FAFE]' : 'bg-[#F7F9FC] text-slate-400',
                  isSelected ? 'bg-[#EEF5FF]' : '',
                ].join(' ')}
                aria-label={`Select ${cell.isoDate}`}
                aria-pressed={isSelected}
              >
                <span
                  className={[
                    'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] font-medium leading-none md:h-7 md:min-w-7',
                    cell.inCurrentMonth ? 'text-[#525C71]' : 'text-slate-400',
                    isSundayInMonth ? 'text-[#D75A58]' : '',
                    isSelected ? 'border-2 border-[#2E89F6] text-[#2E89F6]' : '',
                  ].join(' ')}
                >
                  {cell.dayNumber}
                </span>

                <div className="mt-1.5 space-y-1">
                  {visibleDayTasks.map((task) => (
                    <span
                      key={task.id}
                      className="flex items-center gap-1 rounded-full bg-[#E9EEF6] px-2 py-0.5 text-[9px] font-semibold text-[#53607A] md:text-[11px]"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[task.categoryColor]}`} aria-hidden="true" />
                      <span className="truncate">{task.timeLabel}</span>
                    </span>
                  ))}

                  {hiddenCount > 0 ? (
                    <span className="inline-flex rounded-full bg-[#DCEBFF] px-2 py-0.5 text-[9px] font-semibold text-[#2B6FC5] md:text-[11px]">
                      +{hiddenCount} more
                    </span>
                  ) : null}

                  {dayTasks.length === 0 && cell.inCurrentMonth ? (
                    <span className="block pt-1 text-[10px] text-[#A2AABC] md:text-[12px]">
                      add task
                    </span>
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
