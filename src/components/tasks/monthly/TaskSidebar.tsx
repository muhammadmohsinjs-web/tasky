import { useState } from 'react';
import { Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { formatSidebarDate, getTaskCounts } from './calendarHelpers';
import { TaskCard } from './TaskCard';
import type { CalendarTask } from './types';

interface TaskSidebarProps {
  selectedDateISO: string;
  tasks: CalendarTask[];
  visibleTasks: CalendarTask[];
  monthTasks?: CalendarTask[];
  visibleMonthTasks?: CalendarTask[];
  monthLabel?: string;
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
  selectionMode?: boolean;
  selectedTaskIds?: Set<string>;
  onToggleSelectTask?: (taskId: string) => void;
  panelMode?: 'view' | 'edit';
  onPanelModeChange?: (mode: 'view' | 'edit') => void;
  onOpenSelectedTask?: (taskId: string, mode: 'view' | 'edit') => void;
}

export function TaskSidebar({
  selectedDateISO,
  tasks,
  visibleTasks,
  monthTasks = [],
  visibleMonthTasks = [],
  monthLabel,
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
  selectionMode = false,
  selectedTaskIds,
  onToggleSelectTask,
  panelMode = 'view',
  onPanelModeChange,
  onOpenSelectedTask,
}: TaskSidebarProps) {
  const [scope, setScope] = useState<'day' | 'month'>('day');
  const scopeTasks = scope === 'month' ? monthTasks : tasks;
  const scopeVisibleTasks = scope === 'month' ? visibleMonthTasks : visibleTasks;
  const counts = getTaskCounts(scopeTasks);
  const selectedTask = (scopeVisibleTasks.find((task) => task.id === selectedTaskId)
    ?? scopeTasks.find((task) => task.id === selectedTaskId))
    ?? null;

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
            <span>{scope === 'month' ? (monthLabel ?? formatSidebarDate(selectedDateISO)) : formatSidebarDate(selectedDateISO)}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.total} {counts.total === 1 ? 'Task' : 'Tasks'}</span>
            <span className="px-1.5 opacity-70">&middot;</span>
            <span>{counts.completed} Completed</span>
          </p>
        </div>

        <div className="mt-2.5 rounded-xl border border-[#DDE7F7] bg-white p-1.5">
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={() => setScope('day')}
              className={`h-8 rounded-lg text-[11px] font-semibold transition ${scope === 'day' ? 'bg-[#EAF2FF] text-[#1B4A93]' : 'bg-[#F7FAFF] text-[#5B6E8C]'}`}
            >
              Selected Day
            </button>
            <button
              type="button"
              onClick={() => setScope('month')}
              className={`h-8 rounded-lg text-[11px] font-semibold transition ${scope === 'month' ? 'bg-[#EAF2FF] text-[#1B4A93]' : 'bg-[#F7FAFF] text-[#5B6E8C]'}`}
            >
              Month Agenda
            </button>
          </div>
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

        {selectedTask ? (
          <div className="mt-2.5 rounded-xl border border-[#DDE7F7] bg-white p-1.5">
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => onPanelModeChange?.('view')}
                className={`h-8 rounded-lg text-[11px] font-semibold transition ${panelMode === 'view' ? 'bg-[#EAF2FF] text-[#1B4A93]' : 'bg-[#F7FAFF] text-[#5B6E8C]'}`}
              >
                View
              </button>
              <button
                type="button"
                onClick={() => onPanelModeChange?.('edit')}
                className={`h-8 rounded-lg text-[11px] font-semibold transition ${panelMode === 'edit' ? 'bg-[#EAF2FF] text-[#1B4A93]' : 'bg-[#F7FAFF] text-[#5B6E8C]'}`}
              >
                Edit
              </button>
            </div>
            <button
              type="button"
              onClick={() => onOpenSelectedTask?.(selectedTask.id, panelMode)}
              className="mt-1.5 inline-flex h-8 w-full items-center justify-center rounded-lg border border-[#D8E3F3] bg-[#F8FBFF] text-[11px] font-semibold text-[#2E4B74] transition hover:bg-white"
            >
              Open {panelMode === 'edit' ? 'Editor' : 'Details'}
            </button>
          </div>
        ) : null}
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
        {scopeVisibleTasks.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-[#DDE5F2] bg-[#F9FBFE] px-4 py-6 text-center text-[11px] text-[#7F8FA8]">
            {scope === 'month' ? 'No tasks in this month.' : 'No tasks for this day.'}
          </div>
        ) : (
          scopeVisibleTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isSelected={selectedTaskId === task.id}
              isChecked={selectedTaskIds?.has(task.id) ?? false}
              onSelect={onSelectTask}
              onView={onViewTask}
              onEdit={onEditTask}
              onDelete={onDeleteTask}
              onToggleStatus={onToggleStatus}
              selectionMode={selectionMode}
              onToggleSelect={onToggleSelectTask}
            />
          ))
        )}
      </div>
    </aside>
  );
}
