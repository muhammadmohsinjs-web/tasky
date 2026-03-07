import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatMonthLabel, generateMonthGrid, getTasksForDate, WEEKDAY_LABELS } from './calendarHelpers';
import type { CalendarTask } from './types';

interface CalendarGridProps {
  monthDate: Date;
  selectedDateISO: string;
  tasks: CalendarTask[];
  onSelectDate: (isoDate: string) => void;
  onQuickAddDate: (isoDate: string) => void;
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

const STATUS_TILE_CLASS = {
  pending: 'border-[#F2DEAE] bg-[#FFF5D9] text-[#7E641E]',
  in_progress: 'border-[#F2C7C3] bg-[#FDEBE8] text-[#A53B34]',
  completed: 'border-[#BFE7CD] bg-[#E6F6ED] text-[#245E3E]',
} as const;

const STATUS_OVERFLOW_CLASS = {
  pending: 'bg-[#F5E6BB] text-[#6C5215]',
  in_progress: 'bg-[#F7D9D5] text-[#8E2F29]',
  completed: 'bg-[#D3EEDC] text-[#1E5034]',
} as const;

const HEAVY_DAY_THRESHOLD = 5;
const VERY_HEAVY_DAY_THRESHOLD = 8;

export function CalendarGrid({ monthDate, selectedDateISO, tasks, onSelectDate, onQuickAddDate, onPrevMonth, onNextMonth, showHeader = true }: CalendarGridProps) {
  const monthCells = generateMonthGrid(monthDate.getFullYear(), monthDate.getMonth());
  const todayISO = new Date().toISOString().slice(0, 10);

  return (
    <section className="h-full" aria-label="Monthly calendar">
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

      <div className="grid grid-cols-7 border-b border-[#E5EBF5] bg-[#F8FAFD]">
        {WEEKDAY_LABELS.map((dayLabel, dayIndex) => (
          <div
            key={dayLabel}
            className={`px-1.5 py-2 text-center text-[12px] font-semibold md:px-3 md:py-2.5 md:text-[13px] ${dayIndex === 0 ? 'text-[#D65250]' : 'text-[#44536D]'}`}
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
          const isHeavyDay = dayTasks.length >= HEAVY_DAY_THRESHOLD;
          const isVeryHeavyDay = dayTasks.length >= VERY_HEAVY_DAY_THRESHOLD;
          const isSelected = selectedDateISO === cell.isoDate;
          const isSundayInMonth = cell.inCurrentMonth && cell.date.getDay() === 0;
          const isToday = cell.isoDate === todayISO;
          const isPastDate = cell.isoDate < todayISO;
          const showQuickAdd = cell.inCurrentMonth && dayTasks.length === 0 && !isPastDate;

          return (
            <div
              key={cell.isoDate}
              onClick={() => onSelectDate(cell.isoDate)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectDate(cell.isoDate);
                }
              }}
              className={[
                'group relative min-h-[94px] border-r border-b border-[#E5EBF5] p-2 text-left transition-colors md:min-h-[124px] md:p-2.5',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                cell.inCurrentMonth ? 'bg-white hover:bg-[#F8FAFF]' : 'bg-[#F7F9FC] text-slate-400',
                isHeavyDay && cell.inCurrentMonth ? 'ring-1 ring-inset ring-[#F3C17C]' : '',
                isVeryHeavyDay && cell.inCurrentMonth ? 'bg-[#FFF9F1]' : '',
                isSelected ? 'bg-[#EEF4FF] shadow-[inset_0_0_0_1px_#C5D8F7]' : '',
              ].join(' ')}
              role="button"
              tabIndex={0}
              aria-label={`Select ${cell.isoDate}${dayTasks.length > 0 ? `, ${dayTasks.length} tasks` : ''}${isHeavyDay ? ', heavy day' : ''}`}
              aria-pressed={isSelected}
            >
              {showQuickAdd ? (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onQuickAddDate(cell.isoDate);
                  }}
                  onKeyDown={(event) => event.stopPropagation()}
                  aria-label={`Add task on ${cell.isoDate}`}
                  className={[
                    'absolute right-1.5 top-1.5 h-5 w-5 items-center justify-center rounded-full border border-[#D1DEF3] bg-[#EEF4FF] text-[#2A6ED3] transition hover:bg-[#E0ECFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:right-2 md:top-2',
                    isSelected ? 'inline-flex' : 'hidden md:inline-flex',
                  ].join(' ')}
                >
                  <Plus className="h-3 w-3" />
                </button>
              ) : null}

              <span
                className={[
                  'inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[13px] font-semibold leading-none md:h-7 md:min-w-7',
                  cell.inCurrentMonth ? 'text-[#3F4F68]' : 'text-[#9AA8BF]',
                  isSundayInMonth ? 'text-[#D75A58]' : '',
                  isToday && !isSelected ? 'bg-[#1F3C70] text-white' : '',
                  isSelected ? 'border-2 border-[#2E89F6] text-[#2E89F6]' : '',
                  isToday && isSelected ? 'border-[#256EDF] bg-[#DDEBFF] text-[#1857BE]' : '',
                ].join(' ')}
              >
                {cell.dayNumber}
              </span>
              {isHeavyDay ? (
                <span
                  className={`absolute left-10 top-2 inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold md:left-12 ${
                    isVeryHeavyDay
                      ? 'bg-[#FDE3C2] text-[#9A4A00]'
                      : 'bg-[#FFF0DA] text-[#A45C0B]'
                  }`}
                >
                  Heavy
                </span>
              ) : null}

              <div className="mt-2 space-y-1">
                {visibleDayTasks.map((task) => (
                  <span
                    key={task.id}
                    className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[9px] font-semibold md:text-[11px] ${STATUS_TILE_CLASS[task.status]}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASS[task.categoryColor]}`} aria-hidden="true" />
                    <span className="truncate">{task.timeLabel || 'Task'}</span>
                  </span>
                ))}

                {hiddenCount > 0 ? (
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-semibold md:text-[11px] ${STATUS_OVERFLOW_CLASS[visibleDayTasks[0]?.status ?? 'pending']}`}>
                    +{hiddenCount} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
