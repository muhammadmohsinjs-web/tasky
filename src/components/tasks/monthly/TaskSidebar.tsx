import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
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
  onViewTask?: (taskId: string) => void;
  onEditTask?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
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
  onViewTask,
  onEditTask,
  onDeleteTask,
  onToggleStatus,
}: TaskSidebarProps) {
  const counts = getTaskCounts(tasks);

  return (
    <aside className="flex h-full flex-col rounded-[14px] border border-[#E4E8F0] bg-[#FBFCFF]">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.003em] text-[#0F172A]">Tasks</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#94A3B8] transition-colors hover:bg-[#F1F5F9] active:bg-[#E2E8F0] cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Date + stats row */}
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center text-[13px] font-medium text-[#64748B]">
            <span>{formatSidebarDate(selectedDateISO)}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.total} {counts.total === 1 ? 'Task' : 'Tasks'}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.completed} Completed</span>
          </p>
        </div>

        {/* Command bar: Add Task + progress */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#2563EB] text-[13px] font-semibold text-white transition-colors hover:bg-[#1D4ED8] active:bg-[#1E40AF] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.25]" />
            <span>Add Task</span>
          </button>

          <div className="flex items-center gap-1.5 rounded-full bg-[#EEF2FF] px-3 py-1.5">
            <div className="h-1 w-12 overflow-hidden rounded-full bg-[#E0E7FF]">
              <div
                className="h-full rounded-full bg-[#4338CA]"
                style={{ width: `${counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 48)}px` }}
              />
            </div>
            <span className="whitespace-nowrap text-[11px] font-medium text-[#4338CA]">
              {counts.completed} / {counts.total} Done
            </span>
          </div>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="flex h-9 items-center overflow-hidden rounded-lg border border-[#E2E7EF] bg-white transition focus-within:border-[#93B4F0] focus-within:ring-2 focus-within:ring-[#3B82F6]/10">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#94A3B8]" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full bg-transparent text-[12px] text-[#334155] placeholder:text-[#B0B8C9] focus:outline-none"
            />
          </div>
          <button
            type="button"
            className="inline-flex h-full w-9 shrink-0 items-center justify-center border-l border-[#E2E7EF] text-[#8994A7] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/40"
            aria-label="Task filters"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Task list ── */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 pb-4 pt-1">
        {visibleTasks.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[#E2E7EF] bg-[#FAFBFD] px-4 py-6 text-center text-[11px] text-[#94A3B8]">
            No tasks for this day.
          </div>
        ) : (
          visibleTasks.map((task) => (
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
          ))
        )}
      </div>
    </aside>
  );
}
