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
  onToggleFilters?: () => void;
  hasActiveFilters?: boolean;
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
  onToggleFilters,
  hasActiveFilters = false,
}: TaskSidebarProps) {
  const counts = getTaskCounts(tasks);

  return (
    <aside className="flex h-full flex-col rounded-[16px] border border-[#DEE6F2] bg-[#FCFDFF]">
      {/* ── Header ── */}
      <header className="shrink-0 border-b border-[#DFE6F1] bg-[#F7FAFE] px-5 py-4">
        {/* Title row */}
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold leading-7 tracking-[-0.003em] text-[#0D1B35]">Tasks</h2>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8190A8] transition-colors hover:bg-[#ECF2FA] active:bg-[#E1EAF7] cursor-pointer"
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {/* Date + stats row */}
        <div className="mt-2 flex items-center justify-between">
          <p className="flex items-center text-[13px] font-medium text-[#55657F]">
            <span>{formatSidebarDate(selectedDateISO)}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.total} {counts.total === 1 ? 'Task' : 'Tasks'}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.completed} Completed</span>
          </p>
        </div>

        {/* Command bar: Add Task + progress */}
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#DEE7F3] bg-white p-1.5 shadow-[0_2px_10px_rgba(15,23,42,0.05)]">
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-[10px] bg-[#2663EA] text-[13px] font-semibold text-white transition-colors hover:bg-[#1E54D2] active:bg-[#1947B7] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.25]" />
            <span>Add Task</span>
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#DCE7FD] bg-[#EDF3FF] px-3 py-1.5">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#D8E4FC]">
              <div
                className="h-full rounded-full bg-[#365FD4]"
                style={{ width: `${counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100)}%` }}
              />
            </div>
            <span className="whitespace-nowrap text-[11px] font-semibold text-[#314DB4]">
              {counts.completed} / {counts.total} Done
            </span>
          </div>
        </div>
      </header>

      {/* ── Search ── */}
      <div className="shrink-0 px-4 pb-2 pt-3">
        <div className="flex h-10 items-center overflow-hidden rounded-xl border border-[#DCE4F1] bg-white transition focus-within:border-[#85ACEB] focus-within:ring-2 focus-within:ring-[#3B82F6]/12">
          <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
            <Search className="h-3.5 w-3.5 shrink-0 text-[#8190A8]" aria-hidden="true" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search tasks..."
              aria-label="Search tasks"
              className="w-full bg-transparent text-[12px] text-[#2D3D58] placeholder:text-[#9AA7BC] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onToggleFilters}
            className="inline-flex h-full w-10 shrink-0 items-center justify-center border-l border-[#E0E8F4] bg-[#F9FBFF] text-[#72849D] transition hover:bg-[#F1F6FD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/40"
            aria-label="Task filters"
            aria-pressed={hasActiveFilters}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Task list ── */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-3 pb-4 pt-1.5">
        {visibleTasks.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[#DDE5F2] bg-[#F9FBFE] px-4 py-6 text-center text-[11px] text-[#7F8FA8]">
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
