import type { CalendarDayCell, CalendarTask, TaskStatus } from './types';

export const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

const STATUS_ORDER: Record<TaskStatus, number> = {
  in_progress: 0,
  pending: 1,
  completed: 2,
};

const TIME_ORDER = /^(?<hour>\d{1,2}):(?<minute>\d{2})\s?(?<ampm>AM|PM)$/i;

export function toISODate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function startOfMonth(year: number, monthIndex: number): Date {
  return new Date(year, monthIndex, 1);
}

export function shiftMonth(value: Date, offset: number): Date {
  return new Date(value.getFullYear(), value.getMonth() + offset, 1);
}

export function generateMonthGrid(year: number, monthIndex: number): CalendarDayCell[] {
  const monthStart = startOfMonth(year, monthIndex);
  const monthEnd = new Date(year, monthIndex + 1, 0);
  const leadingDays = monthStart.getDay();
  const trailingDays = 6 - monthEnd.getDay();

  const firstGridDate = new Date(year, monthIndex, 1 - leadingDays);
  const totalCells = monthEnd.getDate() + leadingDays + trailingDays;
  const normalizedCellCount = totalCells <= 35 ? 35 : 42;

  return Array.from({ length: normalizedCellCount }, (_, index) => {
    const date = new Date(firstGridDate);
    date.setDate(firstGridDate.getDate() + index);

    return {
      date,
      isoDate: toISODate(date),
      dayNumber: date.getDate(),
      inCurrentMonth: date.getMonth() === monthIndex,
    };
  });
}

export function formatMonthLabel(value: Date): string {
  return value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatSidebarDate(isoDate: string): string {
  const value = parseISODate(isoDate);
  return value.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export function formatTaskDate(isoDate: string | null): string {
  if (!isoDate) return 'Backlog';
  const value = parseISODate(isoDate);
  return value.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function parseISODate(isoDate: string): Date {
  const [yearPart, monthPart, dayPart] = isoDate.split('-').map(Number);
  return new Date(yearPart, monthPart - 1, dayPart);
}

export function getTasksForDate(tasks: CalendarTask[], isoDate: string): CalendarTask[] {
  return tasks
    .filter((task) => task.dateISO === isoDate)
    .sort((first, second) => {
      const timeDelta = compareTimeLabel(first.timeLabel, second.timeLabel);
      if (timeDelta !== 0) return timeDelta;
      return STATUS_ORDER[first.status] - STATUS_ORDER[second.status];
    });
}

export function filterTasksByQuery(tasks: CalendarTask[], query: string): CalendarTask[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return tasks;
  return tasks.filter((task) => task.title.toLowerCase().includes(normalized));
}

export function getTaskCounts(tasks: CalendarTask[]): { total: number; completed: number } {
  const completed = tasks.filter((task) => task.status === 'completed').length;
  return { total: tasks.length, completed };
}

function compareTimeLabel(left: string, right: string): number {
  return toMinuteIndex(left) - toMinuteIndex(right);
}

function toMinuteIndex(value: string): number {
  const match = TIME_ORDER.exec(value.trim());
  if (!match || !match.groups) return Number.MAX_SAFE_INTEGER;

  const hourRaw = Number(match.groups.hour);
  const minute = Number(match.groups.minute);
  const ampm = match.groups.ampm.toUpperCase();

  let hour = hourRaw % 12;
  if (ampm === 'PM') hour += 12;

  return hour * 60 + minute;
}
