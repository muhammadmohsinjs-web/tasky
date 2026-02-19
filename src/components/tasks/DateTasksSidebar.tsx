import { useMemo, useState } from 'react';
import { CheckCircle2, Circle, ClipboardCheck, Code2, Ellipsis, FileText, MessageSquareText, Plus, Search, SlidersHorizontal, Wrench, X } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';

interface DateTasksSidebarProps {
  selectedDate: string;
  tasks: Task[];
  totalCount?: number;
  completedCount?: number;
  onClose: () => void;
  onTaskSelect?: (task: Task, mode: 'view' | 'edit') => void;
  onStatusChange?: (id: string, status: TaskStatus) => void;
  onRowTouchStart?: (e: React.TouchEvent, taskId: string) => void;
  onRowTouchEnd?: (e: React.TouchEvent, task: Task) => void;
}

export function DateTasksSidebar({ selectedDate, tasks, totalCount, completedCount, onClose, onTaskSelect, onStatusChange, onRowTouchStart, onRowTouchEnd }: DateTasksSidebarProps) {
  const [query, setQuery] = useState('');

  const visibleTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(task => {
      return task.title.toLowerCase().includes(q) || (task.description ?? '').toLowerCase().includes(q) || (task.notes ?? '').toLowerCase().includes(q);
    });
  }, [tasks, query]);

  const titleDate = formatDateTitle(selectedDate);
  const count = totalCount ?? tasks.length;
  const doneCount = completedCount ?? tasks.filter(task => task.status === 'done').length;

  return (
    <aside className="relative w-full lg:w-[390px] shrink-0 border-l border-[#DDE3EC] bg-[#F2F4F8] animate-slide-in-right">
      <header className="border-b border-[#E2E8F0] bg-white px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[40px] font-semibold leading-none tracking-[-0.02em] text-[#1E293B]">Tasks</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded bg-[#3B82F6] px-4 text-[15px] font-medium text-white shadow-[0_4px_10px_rgba(59,130,246,0.32)] transition-colors hover:bg-[#3176e6] cursor-pointer">
              <Plus className="h-4 w-4" />
              <span>Add Task</span>
            </button>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-[#F8FAFC] cursor-pointer"
              aria-label="Close tasks sidebar">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[13px] text-slate-500">
          <span>{titleDate}</span>
          <span>
            {count} task{count === 1 ? '' : 's'}
            {doneCount > 0 ? ` · ${doneCount} completed` : ''}
          </span>
        </div>
      </header>

      <section className="px-5 py-4">
        <div className="flex h-[46px] items-center overflow-hidden rounded-xl border border-[#D2DAE6] bg-white">
          <div className="flex flex-1 items-center gap-2 px-4">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full bg-transparent text-[16px] text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="flex h-full w-12 items-center justify-center border-l border-[#D2DAE6] text-slate-500 transition-colors hover:bg-[#F8FAFC] cursor-pointer"
            aria-label="Filter tasks">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </section>

      <section className="space-y-3 px-5 pb-4">
        {visibleTasks.map(task => (
          <TaskCard
            key={task.id}
            task={task}
            onSelect={() => onTaskSelect?.(task, 'view')}
            onMenu={() => onTaskSelect?.(task, 'edit')}
            onToggleStatus={() => onStatusChange?.(task.id, nextStatus(task.status))}
            onTouchStart={onRowTouchStart ? e => onRowTouchStart(e, task.id) : undefined}
            onTouchEnd={onRowTouchEnd ? e => onRowTouchEnd(e, task) : undefined}
          />
        ))}
      </section>

      {visibleTasks.length === 0 && (
        <section className="mx-5 border-t border-[#E2E8F0] pb-8 pt-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#EDF2F8] text-[#8EA0B7]">
            <ClipboardCheck className="h-10 w-10" />
          </div>
          <p className="mt-4 text-[34px] font-semibold text-[#334155]">No tasks found.</p>
          <p className="mt-1 text-[24px] text-[#64748B]">You&apos;re all caught up!</p>
        </section>
      )}
    </aside>
  );
}

interface TaskCardProps {
  task: Task;
  onSelect: () => void;
  onToggleStatus: () => void;
  onMenu: () => void;
  onTouchStart?: (e: React.TouchEvent<HTMLDivElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLDivElement>) => void;
}

function TaskCard({ task, onSelect, onToggleStatus, onMenu, onTouchStart, onTouchEnd }: TaskCardProps) {
  const statusMeta = STATUS_UI[task.status];
  const dateLabel = task.date ? formatShortDate(task.date) : 'No date';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className="rounded-[20px] border border-[#D6DEEA] bg-white px-3 py-3 shadow-[0_1px_2px_rgba(15,23,42,0.03)] transition-colors hover:bg-[#F8FAFC]">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleStatus();
          }}
          className="mt-1 flex h-6 w-6 items-center justify-center rounded-full cursor-pointer"
          aria-label="Toggle task status">
          {task.status === 'done' ? <CheckCircle2 className="h-5 w-5 text-[#69BE87]" /> : <Circle className={`h-5 w-5 ${statusMeta.iconClass}`} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate text-[18px] font-semibold text-[#1F2937] ${task.status === 'done' ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-[12px] font-medium ${statusMeta.badgeClass}`}>{statusMeta.label}</span>
          </div>

          <div className="mt-1 flex items-center gap-2 text-[12px] text-[#64748B]">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-md bg-[#EEF2F7] text-[#516784]">
              <CategoryMetaIcon label={task.category?.name ?? ''} />
            </span>
            <span className="truncate">{task.category?.name ?? 'General'}</span>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <div className="text-right">
            <p className="text-[15px] font-medium text-[#334155]">{dateLabel}</p>
            <p className="mt-1 text-[13px] text-[#64748B]">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onMenu();
            }}
            className="mt-0.5 h-7 w-7 rounded-md text-slate-400 transition-colors hover:bg-[#F1F5F9] hover:text-slate-600 cursor-pointer"
            aria-label="Open task menu">
            <Ellipsis className="mx-auto h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryMetaIcon({ label }: { label: string }) {
  const normalized = label.toLowerCase();
  if (normalized.includes('dev') || normalized.includes('code')) return <Code2 className="h-3 w-3" />;
  if (normalized.includes('docs') || normalized.includes('doc')) return <FileText className="h-3 w-3" />;
  if (normalized.includes('review') || normalized.includes('client')) return <MessageSquareText className="h-3 w-3" />;
  return <Wrench className="h-3 w-3" />;
}

const STATUS_UI: Record<TaskStatus, { label: string; badgeClass: string; iconClass: string }> = {
  todo: {
    label: 'Pending',
    badgeClass: 'bg-[#F6DD8A] text-[#374151]',
    iconClass: 'text-[#E4AE34]',
  },
  inprogress: {
    label: 'In Progress',
    badgeClass: 'bg-[#E16155] text-white',
    iconClass: 'text-[#E24B40]',
  },
  done: {
    label: 'Completed',
    badgeClass: 'bg-[#4FAF78] text-white',
    iconClass: 'text-[#5FB87E]',
  },
};

function formatDateTitle(selectedDate: string): string {
  const [yearPart, monthPart, dayPart] = selectedDate.split('-');
  const yearValue = Number(yearPart);
  const monthValue = Number(monthPart);
  const dayValue = Number(dayPart);
  if (!yearValue || !monthValue || !dayValue) {
    return selectedDate;
  }
  return new Date(yearValue, monthValue - 1, dayValue).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

function formatShortDate(value: string): string {
  const [yearPart, monthPart, dayPart] = value.split('-');
  const yearValue = Number(yearPart);
  const monthValue = Number(monthPart);
  const dayValue = Number(dayPart);
  if (!yearValue || !monthValue || !dayValue) {
    return value;
  }
  return new Date(yearValue, monthValue - 1, dayValue).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function nextStatus(status: TaskStatus): TaskStatus {
  if (status === 'todo') return 'inprogress';
  if (status === 'inprogress') return 'done';
  return 'todo';
}
