import { Menu, Search, SlidersHorizontal, X } from 'lucide-react';
import { formatSidebarDate, getTaskCounts } from './calendarHelpers';
import { TaskCard } from './TaskCard';
import type { CalendarTask } from './types';

interface TaskSidebarProps {
  selectedDateISO: string;
  tasks: CalendarTask[];
  visibleTasks: CalendarTask[];
  selectedTaskId: string | null;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSelectTask: (taskId: string) => void;
  onOpenAddTask: () => void;
  onClose?: () => void;
}

export function TaskSidebar({
  selectedDateISO,
  tasks,
  visibleTasks,
  selectedTaskId,
  searchQuery,
  onSearchChange,
  onSelectTask,
  onOpenAddTask,
  onClose,
}: TaskSidebarProps) {
  const counts = getTaskCounts(tasks);

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <header className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">Tasks</h2>
          <div className="flex items-center gap-2 text-slate-500">
            <button
              type="button"
              className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-label="Open tasks menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-md p-2 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Close tasks sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <p className="text-base font-medium text-slate-700 md:text-lg">{formatSidebarDate(selectedDateISO)}</p>
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex h-11 items-center rounded-xl bg-blue-600 px-4 text-base font-medium text-white shadow-[0_4px_12px_rgba(37,99,235,0.35)] hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            + Add Task
          </button>
        </div>

        <p className="pt-4 text-base text-slate-500">
          {counts.total} tasks &middot; {counts.completed} completed
        </p>
      </header>

      <div className="border-b border-slate-200 px-6 py-4">
        <div className="flex h-12 items-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full bg-transparent text-base text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-full w-12 items-center justify-center border-l border-slate-200 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Task filters"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3 px-6 py-4">
        {visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">No tasks found.</div>
        ) : (
          visibleTasks.map((task) => (
            <TaskCard key={task.id} task={task} isSelected={selectedTaskId === task.id} onSelect={onSelectTask} />
          ))
        )}
      </div>
    </aside>
  );
}
