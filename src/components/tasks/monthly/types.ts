export type TaskStatus = 'in_progress' | 'pending' | 'completed';

export type CategoryColor = 'green' | 'yellow' | 'red' | 'blue';

export interface CalendarTask {
  id: string;
  title: string;
  status: TaskStatus;
  dateISO: string | null;
  categoryId: string | null;
  categoryColor: CategoryColor;
  timeLabel: string;
}

export interface CalendarDayCell {
  date: Date;
  isoDate: string;
  dayNumber: number;
  inCurrentMonth: boolean;
}
