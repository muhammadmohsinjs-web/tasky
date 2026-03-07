import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { formatMonthLabel, getTasksForDate, parseISODate, toISODate } from './calendarHelpers';
import { TaskCard } from './TaskCard';
import type { CalendarTask } from './types';

interface MobileCalendarAgendaProps {
  monthDate: Date;
  selectedDateISO: string;
  tasks: CalendarTask[];
  selectedTaskId: string | null;
  onSelectDate: (isoDate: string) => void;
  onQuickAddDate: (isoDate: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectTask: (taskId: string) => void;
  onViewTask: (taskId: string) => void;
  onEditTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleStatus: (taskId: string) => void;
}

const DOT_CLASS = {
  green: 'bg-emerald-500',
  yellow: 'bg-amber-400',
  red: 'bg-rose-500',
  blue: 'bg-blue-500',
} as const;

const HEAVY_DAY_THRESHOLD = 5;

export function MobileCalendarAgenda({
  monthDate,
  selectedDateISO,
  tasks,
  selectedTaskId,
  onSelectDate,
  onQuickAddDate,
  onPrevMonth,
  onNextMonth,
  onSelectTask,
  onViewTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}: MobileCalendarAgendaProps) {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  const monthDays = Array.from({ length: daysInMonth }, (_, idx) => {
    const date = new Date(year, monthIndex, idx + 1);
    const isoDate = toISODate(date);
    const dayTasks = getTasksForDate(tasks, isoDate);
    return { date, isoDate, dayTasks };
  });

  const selectedDate = parseISODate(selectedDateISO);
  const selectedLabel = selectedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  const selectedTasks = getTasksForDate(tasks, selectedDateISO);

  return (
    <div className="space-y-3">
      <section className="rounded-2xl border border-[#D9E4F2] bg-[#F7FAFF] p-3 shadow-[0_8px_20px_rgba(26,63,126,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onPrevMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CFDAEC] bg-white text-[#365174]"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <p className="text-sm font-semibold text-[#233553]">{formatMonthLabel(monthDate)}</p>
          <button
            type="button"
            onClick={onNextMonth}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#CFDAEC] bg-white text-[#365174]"
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
          {monthDays.map((day) => {
            const isSelected = day.isoDate === selectedDateISO;
            const isHeavyDay = day.dayTasks.length >= HEAVY_DAY_THRESHOLD;
            const dots = day.dayTasks.slice(0, 3);
            const hiddenCount = day.dayTasks.length - dots.length;
            return (
              <button
                key={day.isoDate}
                type="button"
                onClick={() => onSelectDate(day.isoDate)}
                className={[
                  'min-w-[64px] snap-start rounded-xl border px-2 py-2 text-left transition',
                  isSelected
                    ? 'border-[#2D7DEF] bg-[#2D7DEF] text-white shadow-[0_6px_14px_rgba(37,99,235,0.30)]'
                    : isHeavyDay
                      ? 'border-[#EDC78F] bg-[#FFF7EA] text-[#314764]'
                      : 'border-[#D7E2F1] bg-white text-[#314764]',
                ].join(' ')}
              >
                <p className={`text-[10px] font-semibold ${isSelected ? 'text-white/90' : 'text-[#6A7F9E]'}`}>
                  {day.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="mt-0.5 text-lg font-semibold leading-none">{day.date.getDate()}</p>
                <div className="mt-1.5 flex items-center gap-1">
                  {dots.map((task) => (
                    <span
                      key={task.id}
                      className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : DOT_CLASS[task.categoryColor]}`}
                      aria-hidden="true"
                    />
                  ))}
                  {hiddenCount > 0 ? (
                    <span className={`text-[9px] font-semibold ${isSelected ? 'text-white' : 'text-[#4D6487]'}`}>
                      +{hiddenCount}
                    </span>
                  ) : null}
                </div>
                {isHeavyDay ? (
                  <span className={`mt-1 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${isSelected ? 'bg-white/20 text-white' : 'bg-[#FFE6C4] text-[#965003]'}`}>
                    Heavy
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-[#DBE5F3] bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.06)]">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-[#6A7D99]">Selected day</p>
            <p className="text-sm font-semibold text-[#1E314F]">{selectedLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => onQuickAddDate(selectedDateISO)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#2D7DEF] px-3 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(37,99,235,0.3)]"
          >
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>

        {selectedTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#D7E3F5] bg-[#F8FBFF] px-3 py-4 text-center">
            <p className="text-xs font-medium text-[#67809F]">No tasks on this day.</p>
            <button
              type="button"
              onClick={() => onQuickAddDate(selectedDateISO)}
              className="mt-2 inline-flex h-8 items-center rounded-full border border-[#C5D6F2] bg-white px-3 text-xs font-semibold text-[#31527C]"
            >
              Add first task
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isSelected={selectedTaskId === task.id}
                onSelect={onSelectTask}
                onView={onViewTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                onToggleStatus={onToggleStatus}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
