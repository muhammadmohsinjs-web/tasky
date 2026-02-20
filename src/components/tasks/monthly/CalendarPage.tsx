import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, Calendar as CalendarIcon, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Inbox, List, Loader2, Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useTasks } from '../../../hooks/useTasks';
import { useBacklogTasks } from '../../../hooks/useBacklogTasks';
import { useCategories } from '../../../hooks/useCategories';
import { uploadFilesForTask } from '../../../lib/uploadAttachment';
import type { Task, TaskStatus as DbTaskStatus } from '../../../types';
import { AddTaskModal } from './AddTaskModal';
import { BulkAddModal } from '../BulkAddModal';
import { CalendarGrid } from './CalendarGrid';
import { filterTasksByQuery, formatMonthLabel, getTasksForDate, parseISODate, shiftMonth, startOfMonth, toISODate } from './calendarHelpers';
import { TaskCard } from './TaskCard';
import { TaskSidebar } from './TaskSidebar';
import type { CalendarTask, CategoryColor, TaskStatus } from './types';

const now = new Date();
const initialMonth = startOfMonth(now.getFullYear(), now.getMonth());
const todayISO = toISODate(now);

type ViewMode = 'calendar' | 'list' | 'backlog';
const ALL_CATEGORY_FILTER = 'all';
const UNCATEGORIZED_FILTER = '__uncategorized__';
const STATUS_FILTER_LABELS: Record<'all' | TaskStatus, string> = {
  all: 'All Status',
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

/* ── Status mapping between DB and Calendar UI ── */
const DB_TO_CALENDAR_STATUS: Record<DbTaskStatus, TaskStatus> = {
  todo: 'pending',
  inprogress: 'in_progress',
  done: 'completed',
};

const CALENDAR_TO_DB_STATUS: Record<TaskStatus, DbTaskStatus> = {
  pending: 'todo',
  in_progress: 'inprogress',
  completed: 'done',
};

const NEXT_CALENDAR_STATUS: Record<TaskStatus, TaskStatus> = {
  pending: 'in_progress',
  in_progress: 'completed',
  completed: 'pending',
};

function toCategoryColor(color: string | undefined | null): CategoryColor {
  if (color === 'green' || color === 'yellow' || color === 'red' || color === 'blue') return color;
  return 'blue';
}

function taskToCalendarTask(task: Task): CalendarTask {
  return {
    id: task.id,
    title: task.title,
    status: DB_TO_CALENDAR_STATUS[task.status as DbTaskStatus] ?? 'pending',
    dateISO: task.date,
    categoryId: task.category_id,
    categoryColor: toCategoryColor(task.category?.color),
    timeLabel: formatTimeLabel(task.time),
  };
}

function formatTimeLabel(value: string | null | undefined): string {
  if (!value) return '';
  if (value.includes('AM') || value.includes('PM')) return value;
  const [hoursRaw, minutesRaw] = value.split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return value;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const [monthDate, setMonthDate] = useState(initialMonth);
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORY_FILTER);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    tasks: scheduledDbTasks,
    loading: scheduledLoading,
    error: scheduledError,
    deleteTask: deleteScheduledTask,
    updateTaskStatus: updateScheduledStatus,
    addTask: addScheduledTask,
    addTasks: addScheduledTasks,
    updateTask: updateScheduledTask,
    refetch: refetchScheduledTasks,
  } = useTasks(monthDate.getFullYear(), monthDate.getMonth());
  const {
    tasks: backlogDbTasks,
    loading: backlogLoading,
    error: backlogError,
    deleteTask: deleteBacklogTask,
    updateTaskStatus: updateBacklogStatus,
    addTask: addBacklogTask,
    addTasks: addBacklogTasks,
    updateTask: updateBacklogTask,
    refetch: refetchBacklogTasks,
  } = useBacklogTasks();
  const { categories } = useCategories();
  const allDbTasks = useMemo(() => [...scheduledDbTasks, ...backlogDbTasks], [scheduledDbTasks, backlogDbTasks]);
  const editingTask = useMemo(() => allDbTasks.find((task) => task.id === editingTaskId) ?? null, [allDbTasks, editingTaskId]);

  const allCalendarTasks = useMemo(() => {
    const scheduled = scheduledDbTasks.map(taskToCalendarTask);
    const backlog = backlogDbTasks.map(taskToCalendarTask);
    return [...scheduled, ...backlog];
  }, [scheduledDbTasks, backlogDbTasks]);

  const loading = scheduledLoading || backlogLoading;
  const loadError = scheduledError || backlogError;

  const handleDeleteTask = useCallback((taskId: string) => {
    const isBacklog = backlogDbTasks.some(t => t.id === taskId);
    if (isBacklog) {
      deleteBacklogTask(taskId);
    } else {
      deleteScheduledTask(taskId);
    }
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  }, [backlogDbTasks, deleteBacklogTask, deleteScheduledTask, selectedTaskId]);

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setEditingTaskId(taskId);
    setModalMode('view');
    setIsAddModalOpen(true);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setEditingTaskId(taskId);
    setModalMode('edit');
    setIsAddModalOpen(true);
  };

  const handleToggleStatus = useCallback((taskId: string) => {
    const calTask = allCalendarTasks.find(t => t.id === taskId);
    if (!calTask) return;
    const nextCalStatus = NEXT_CALENDAR_STATUS[calTask.status];
    const nextDbStatus = CALENDAR_TO_DB_STATUS[nextCalStatus];
    const isBacklog = backlogDbTasks.some(t => t.id === taskId);
    if (isBacklog) {
      updateBacklogStatus(taskId, nextDbStatus);
    } else {
      updateScheduledStatus(taskId, nextDbStatus);
    }
  }, [allCalendarTasks, backlogDbTasks, updateBacklogStatus, updateScheduledStatus]);

  const filteredTasks = useMemo(() => {
    const bySearch = filterTasksByQuery(allCalendarTasks, searchQuery);
    const byStatus = bySearch.filter(task => (statusFilter === 'all' ? true : task.status === statusFilter));
    return byStatus.filter(task => {
      if (categoryFilter === ALL_CATEGORY_FILTER) return true;
      if (categoryFilter === UNCATEGORIZED_FILTER) return task.categoryId === null;
      return task.categoryId === categoryFilter;
    });
  }, [allCalendarTasks, searchQuery, statusFilter, categoryFilter]);

  const scheduledTasks = useMemo(() => filteredTasks.filter(task => task.dateISO !== null), [filteredTasks]);
  const backlogTasks = useMemo(() => filteredTasks.filter(task => task.dateISO === null), [filteredTasks]);
  const tasksForSelectedDate = useMemo(() => getTasksForDate(scheduledTasks, selectedDateISO), [scheduledTasks, selectedDateISO]);
  const visibleSidebarTasks = useMemo(() => filterTasksByQuery(tasksForSelectedDate, searchQuery), [tasksForSelectedDate, searchQuery]);

  const monthTasks = useMemo(() => {
    return scheduledTasks.filter(task => {
      if (!task.dateISO) return false;
      const date = parseISODate(task.dateISO);
      return date.getFullYear() === monthDate.getFullYear() && date.getMonth() === monthDate.getMonth();
    });
  }, [scheduledTasks, monthDate]);

  const groupedMonthTasks = useMemo(() => {
    const dateKeys = Array.from(new Set(monthTasks.map(task => task.dateISO).filter((date): date is string => Boolean(date)))).sort();
    return dateKeys.map(dateKey => ({ dateKey, items: getTasksForDate(monthTasks, dateKey) }));
  }, [monthTasks]);

  const progressCompleted = useMemo(() => monthTasks.filter(task => task.status === 'completed').length, [monthTasks]);
  const progressTotal = monthTasks.length;
  const progressPercent = progressTotal === 0 ? 0 : Math.round((progressCompleted / progressTotal) * 100);
  const selectedCategoryLabel = useMemo(() => {
    if (categoryFilter === ALL_CATEGORY_FILTER) return 'All Categories';
    if (categoryFilter === UNCATEGORIZED_FILTER) return 'Uncategorized';
    return categories.find(category => category.id === categoryFilter)?.name ?? 'All Categories';
  }, [categories, categoryFilter]);
  const hasActiveFilters = categoryFilter !== ALL_CATEGORY_FILTER || statusFilter !== 'all' || searchQuery.trim().length > 0;

  const setMonthAndYear = (year: number, monthIndex: number) => {
    const currentSelectedDay = parseISODate(selectedDateISO).getDate();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const nextDate = new Date(year, monthIndex, Math.min(currentSelectedDay, daysInMonth));

    setMonthDate(startOfMonth(year, monthIndex));
    setSelectedDateISO(toISODate(nextDate));
    setSelectedTaskId(null);
  };

  const handleMonthChange = (offset: number) => {
    const nextMonth = shiftMonth(monthDate, offset);
    setMonthAndYear(nextMonth.getFullYear(), nextMonth.getMonth());
  };

  const handleSelectDate = (isoDate: string) => {
    if (!isoDate) return;

    setSelectedDateISO(isoDate);
    setSelectedTaskId(null);

    const nextDate = parseISODate(isoDate);
    setMonthDate(startOfMonth(nextDate.getFullYear(), nextDate.getMonth()));

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileSidebarOpen(true);
    }
  };

  const handleGoToToday = () => {
    setMonthDate(initialMonth);
    setSelectedDateISO(todayISO);
    setSelectedTaskId(null);
  };

  const handleQuickAddDate = (isoDate: string) => {
    if (!isoDate) return;
    setSelectedDateISO(isoDate);
    setEditingTaskId(null);
    setModalMode('create');
    setIsAddModalOpen(true);
  };

  const handleRetryLoad = async () => {
    await Promise.all([refetchScheduledTasks(), refetchBacklogTasks()]);
  };

  return (
    <main className="min-h-screen bg-[#EEF3FA] px-3 py-4 md:px-5 md:py-5">
      <div className="mx-auto max-w-[1880px]">
        <h1 className="sr-only">Tasks</h1>

        <section className="mb-3 rounded-[14px] border border-[#DEE6F2] bg-[#FCFDFF] px-4 py-3 shadow-[0_6px_20px_rgba(40,56,90,0.07)] md:px-6">
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 xl:grid-cols-[auto_1fr_auto] xl:items-center">
              <div className="flex items-center gap-0.5 rounded-xl border border-[#D9E3F2] bg-[#F5F9FF] p-0.5">
              <ViewTab label="Calendar" value="calendar" activeView={activeView} onChange={setActiveView} icon={<CalendarDays className="h-4 w-4" />} />
              <ViewTab label="List" value="list" activeView={activeView} onChange={setActiveView} icon={<List className="h-4 w-4" />} />
              <ViewTab label="Backlog" value="backlog" activeView={activeView} onChange={setActiveView} icon={<Inbox className="h-4 w-4" />} />
              </div>

              <div className="flex items-center gap-2 xl:justify-center">
                <div className="inline-flex h-[32px] items-center overflow-hidden rounded-lg border border-[#C9D2E3] bg-[#F6F8FC]">
                  <button
                    type="button"
                    onClick={() => handleMonthChange(-1)}
                    className="inline-flex h-full w-[32px] items-center justify-center border-r border-[#CFD7E4] text-[#364562] hover:bg-white"
                    aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <div className="inline-flex h-full min-w-[150px] items-center justify-center gap-1.5 px-2.5 text-[#2A3650]">
                    <CalendarIcon className="h-3.5 w-3.5 text-[#2A7CF2]" />
                    <span className="text-[11px] font-semibold">{formatMonthLabel(monthDate)}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleMonthChange(1)}
                    className="inline-flex h-full w-8 items-center justify-center border-l border-[#CFD7E4] text-[#364562] hover:bg-white"
                    aria-label="Next month">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <button type="button" onClick={handleGoToToday} className="h-8 rounded-lg border border-[#CFD7E4] bg-white px-3 text-[11px] font-medium text-[#3C4A65] hover:bg-[#F8FAFD]">
                  Today
                </button>
              </div>

              <div className="flex items-center gap-2 xl:justify-self-end">
                <button
                  type="button"
                  onClick={() => setIsBulkAddOpen(true)}
                  className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[#CBD4E3] bg-white px-3.5 text-[#2A3650] transition hover:bg-[#F8FAFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <span className="text-[11px] font-semibold">Bulk Add</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTaskId(null);
                    setModalMode('create');
                    setIsAddModalOpen(true);
                  }}
                  className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2A2DEB] to-[#0A6CE8] px-4 text-white shadow-[0_6px_16px_rgba(25,68,220,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                  <Plus className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold">Add Task</span>
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[#DEE7F4] bg-[#F8FBFF] p-2.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={() => setShowFilters(prev => !prev)}
                    aria-expanded={showFilters}
                    aria-controls="task-filters-panel"
                    className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg border border-[#CBD4E3] bg-[#F7F9FC] px-3 text-[#2A3650] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
                    <span className="text-[11px] font-semibold">Filters</span>
                    <ChevronDown className={`h-3.5 w-3.5 transition ${showFilters ? 'rotate-180' : ''}`} />
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex h-8 items-center rounded-md px-2.5 text-[12px] font-medium ${
                      categoryFilter === ALL_CATEGORY_FILTER
                        ? 'border border-[#D4DEEE] bg-white text-[#4C5C77]'
                        : 'border border-[#AFC7F4] bg-[#EAF2FF] text-[#184593]'
                    }`}>
                      {selectedCategoryLabel}
                    </span>
                    <span className={`inline-flex h-8 items-center rounded-md px-2.5 text-[12px] font-medium ${
                      statusFilter === 'all'
                        ? 'border border-[#D4DEEE] bg-white text-[#4C5C77]'
                        : 'border border-[#AFC7F4] bg-[#EAF2FF] text-[#184593]'
                    }`}>
                      {STATUS_FILTER_LABELS[statusFilter]}
                    </span>
                    <span className="inline-flex h-8 items-center rounded-md border border-[#DFE6F2] bg-[#F4F8FF] px-2.5 text-[12px] font-medium text-[#5A6780]">
                      This month: {progressTotal}
                    </span>
                    <span className="inline-flex h-8 items-center rounded-md border border-[#DFE6F2] bg-[#F4F8FF] px-2.5 text-[12px] font-medium text-[#5A6780]">
                      Backlog: {backlogTasks.length}
                    </span>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={() => {
                          setCategoryFilter(ALL_CATEGORY_FILTER);
                          setStatusFilter('all');
                          setSearchQuery('');
                        }}
                        className="inline-flex h-8 items-center rounded-md border border-[#C7D4EA] bg-[#F4F8FF] px-2.5 text-[12px] font-semibold text-[#314563] transition hover:bg-white">
                        Clear
                      </button>
                    ) : null}
                  </div>

                  {activeView !== 'calendar' ? (
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={event => setSearchQuery(event.target.value)}
                      placeholder="Search tasks..."
                      aria-label="Search tasks"
                      className="h-9 w-full min-w-[220px] rounded-md border border-[#CCD7EA] bg-white px-3 text-[12px] text-[#2E3F5D] placeholder:text-[#74849E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:w-[260px]"
                    />
                  ) : null}
                </div>

                <div className="flex items-center gap-3 rounded-xl border border-[#DCE6F5] bg-[#F3F8FF] px-3 py-2">
                  <CircularProgress value={progressPercent} />
                  <div>
                    <p className="text-[12px] font-semibold text-[#233553]">Tasks Progress</p>
                    <p className="text-[11px] text-[#526380]">
                      {progressCompleted} of {progressTotal} completed
                    </p>
                  </div>
                </div>
              </div>

              {showFilters ? (
                <div id="task-filters-panel" className="mt-2 grid gap-2 rounded-lg border border-[#DEE7F4] bg-white p-2 sm:grid-cols-2 lg:max-w-[420px]">
                  <label className="flex flex-col gap-1 text-[11px] font-medium text-[#52637F]">
                    Category
                    <select
                      value={categoryFilter}
                      onChange={event => setCategoryFilter(event.target.value)}
                      className="h-9 rounded-md border border-[#CAD5E8] bg-white px-2 text-[12px] text-[#344663]"
                      aria-label="Filter category">
                      <option value={ALL_CATEGORY_FILTER}>All Categories</option>
                      <option value={UNCATEGORIZED_FILTER}>Uncategorized</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 text-[11px] font-medium text-[#52637F]">
                    Status
                    <select
                      value={statusFilter}
                      onChange={event => setStatusFilter(event.target.value as 'all' | TaskStatus)}
                      className="h-9 rounded-md border border-[#CAD5E8] bg-white px-2 text-[12px] text-[#344663]"
                      aria-label="Filter status">
                      <option value="all">All</option>
                      <option value="in_progress">In Progress</option>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </label>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {activeView === 'calendar' ? (
          <section className="rounded-[20px] border border-[#DFE4ED] bg-[#F6F8FC] shadow-[0_10px_28px_rgba(40,56,90,0.08)]">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading calendar tasks...
              </div>
            ) : loadError ? (
              <div className="px-4 py-8 md:px-6 md:py-10">
                <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-5 text-center">
                  <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-100 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-semibold text-red-700">Couldn&apos;t load calendar tasks</p>
                  <p className="mt-1 text-xs text-red-600">{loadError}</p>
                  <button
                    type="button"
                    onClick={handleRetryLoad}
                    className="mt-4 inline-flex h-8 items-center rounded-md border border-red-300 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-[inherit]">
                {monthTasks.length === 0 ? (
                  <div className="border-b border-[#DFE4ED] bg-[#F4F8FF] px-4 py-3 text-sm text-[#526380] md:px-6">
                    {hasActiveFilters
                      ? 'No calendar tasks match current filters. Clear filters to see all tasks.'
                      : 'No scheduled tasks in this month yet. Use Add Task or quick-add on a date to begin.'}
                  </div>
                ) : null}
                <div className="grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
                  <div className="p-4 md:p-5">
                    <CalendarGrid
                      monthDate={monthDate}
                      selectedDateISO={selectedDateISO}
                      tasks={scheduledTasks}
                      onSelectDate={handleSelectDate}
                      onQuickAddDate={handleQuickAddDate}
                      onPrevMonth={() => handleMonthChange(-1)}
                      onNextMonth={() => handleMonthChange(1)}
                      showHeader={false}
                    />
                  </div>

                  <div className="hidden border-l border-[#DFE4ED] bg-[#F9FBFF] p-4 md:block md:p-5">
                    <TaskSidebar
                      selectedDateISO={selectedDateISO}
                      tasks={tasksForSelectedDate}
                      visibleTasks={visibleSidebarTasks}
                      selectedTaskId={selectedTaskId}
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      onSelectTask={setSelectedTaskId}
                      onOpenAddTask={() => {
                        setEditingTaskId(null);
                        setModalMode('create');
                        setIsAddModalOpen(true);
                      }}
                      onViewTask={handleViewTask}
                      onEditTask={handleEditTask}
                      onDeleteTask={handleDeleteTask}
                      onToggleStatus={handleToggleStatus}
                      onToggleFilters={() => setShowFilters((prev) => !prev)}
                      hasActiveFilters={hasActiveFilters}
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        ) : null}

        {activeView === 'list' ? (
          <section className="rounded-2xl border border-[#DEE6F2] bg-[#FCFDFF] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                <p className="font-semibold">Couldn&apos;t load tasks list</p>
                <p className="mt-1 text-xs">{loadError}</p>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  className="mt-3 inline-flex h-8 items-center rounded-md border border-red-300 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : groupedMonthTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No scheduled tasks match current filters for this month.</div>
            ) : (
              <div className="space-y-5">
                {groupedMonthTasks.map(group => (
                  <div key={group.dateKey}>
                    <p className="mb-2 text-[12px] font-semibold text-[#5A6780]">{parseISODate(group.dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
                    <div className="space-y-2.5">
                      {group.items.map(task => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          isSelected={selectedTaskId === task.id}
                          onSelect={setSelectedTaskId}
                          onView={handleViewTask}
                          onEdit={handleEditTask}
                          onDelete={handleDeleteTask}
                          onToggleStatus={handleToggleStatus}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : null}

        {activeView === 'backlog' ? (
          <section className="rounded-2xl border border-[#DEE6F2] bg-[#FCFDFF] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Loading tasks…</div>
            ) : loadError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
                <p className="font-semibold">Couldn&apos;t load backlog tasks</p>
                <p className="mt-1 text-xs">{loadError}</p>
                <button
                  type="button"
                  onClick={handleRetryLoad}
                  className="mt-3 inline-flex h-8 items-center rounded-md border border-red-300 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-100"
                >
                  Retry
                </button>
              </div>
            ) : backlogTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No backlog tasks match current filters.</div>
            ) : (
              <div className="space-y-2.5">
                {backlogTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isSelected={selectedTaskId === task.id}
                    onSelect={setSelectedTaskId}
                    onView={handleViewTask}
                    onEdit={handleEditTask}
                    onDelete={handleDeleteTask}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </div>

      {activeView === 'calendar' ? (
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(true)}
          className="fixed bottom-5 right-5 inline-flex h-12 items-center gap-2 rounded-full bg-blue-600 px-4 text-sm font-medium text-white shadow-lg hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:hidden">
          <CalendarDays className="h-4 w-4" />
          Tasks
        </button>
      ) : null}

      {activeView === 'calendar' && isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-30 bg-slate-900/45 md:hidden" role="presentation" onClick={() => setIsMobileSidebarOpen(false)}>
          <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-2xl" onClick={event => event.stopPropagation()}>
            <TaskSidebar
              selectedDateISO={selectedDateISO}
              tasks={tasksForSelectedDate}
              visibleTasks={visibleSidebarTasks}
              selectedTaskId={selectedTaskId}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSelectTask={setSelectedTaskId}
              onOpenAddTask={() => {
                setEditingTaskId(null);
                setModalMode('create');
                setIsAddModalOpen(true);
              }}
              onClose={() => setIsMobileSidebarOpen(false)}
              onViewTask={handleViewTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleStatus={handleToggleStatus}
              onToggleFilters={() => setShowFilters((prev) => !prev)}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        </div>
      ) : null}

      <AddTaskModal
        isOpen={isAddModalOpen}
        mode={modalMode}
        defaultDateISO={selectedDateISO}
        task={editingTask}
        categories={categories}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTaskId(null);
          setModalMode('create');
        }}
        onSubmit={async payload => {
          const dbStatus = CALENDAR_TO_DB_STATUS[payload.status];
          const baseUpdate = {
            title: payload.title,
            description: payload.description,
            notes: payload.notes,
            time: payload.time,
            category_id: payload.categoryId || null,
            date: payload.dateISO,
            status: dbStatus,
            priority: payload.priority,
            links: payload.links,
          };

          if (editingTask) {
            const isBacklogTask = backlogDbTasks.some((task) => task.id === editingTask.id);
            let updated = false;
            if (isBacklogTask) {
              updated = await updateBacklogTask(editingTask.id, baseUpdate);
            } else {
              updated = await updateScheduledTask(editingTask.id, baseUpdate);
            }
            if (!updated) return false;

            if (payload.files.length > 0) {
              await uploadFilesForTask(editingTask.id, payload.files);
              await queryClient.invalidateQueries({ queryKey: ['tasks'] });
            }

            if (payload.dateISO) {
              handleSelectDate(payload.dateISO);
              setActiveView('calendar');
            }
            setSelectedTaskId(editingTask.id);
            return true;
          }

          const created = payload.dateISO
            ? await addScheduledTask(
                payload.title,
                payload.categoryId,
                payload.dateISO,
                payload.priority,
                {
                  description: payload.description,
                  notes: payload.notes,
                  time: payload.time,
                  status: dbStatus,
                  links: payload.links,
                }
              )
            : await addBacklogTask(
                payload.title,
                payload.categoryId,
                payload.priority,
                {
                  description: payload.description,
                  notes: payload.notes,
                  time: payload.time,
                  status: dbStatus,
                  links: payload.links,
                }
              );

          if (!created) return false;

          if (payload.files.length > 0) {
            await uploadFilesForTask(created.id, payload.files);
            await queryClient.invalidateQueries({ queryKey: ['tasks'] });
          }

          if (payload.dateISO) {
            handleSelectDate(payload.dateISO);
            setActiveView('calendar');
          }
          setSelectedTaskId(created.id);
          return true;
        }}
      />
      <BulkAddModal
        open={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
        categories={categories}
        onAddToDate={async (items) => {
          await addScheduledTasks(items);
        }}
        onAddToBacklog={async (items) => {
          await addBacklogTasks(items);
        }}
      />
    </main>
  );
}

function CircularProgress({ value }: { value: number }) {
  const normalized = Math.max(0, Math.min(100, value));
  const size = 42;
  const stroke = 4;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalized / 100) * circumference;

  return (
    <div className="relative h-[44px] w-[44px]" role="img" aria-label={`Task progress ${normalized}%`}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#D2DEEF" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#task-progress-gradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="task-progress-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#145BE7" />
            <stop offset="100%" stopColor="#2A7CF2" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-[#223756]">{normalized}%</span>
    </div>
  );
}

function ViewTab({ label, value, activeView, onChange, icon }: { label: string; value: ViewMode; activeView: ViewMode; onChange: (view: ViewMode) => void; icon: ReactNode }) {
  const active = activeView === value;

  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={[
        'group relative inline-flex h-[32px] min-w-[84px] items-center justify-center gap-1 rounded-[9px] px-2.5 transition',
        active
          ? 'bg-white text-[#1F3F77] shadow-[0_1px_4px_rgba(15,23,42,0.08)]'
          : 'text-[#3E4F6B] hover:bg-white/80',
      ].join(' ')}
      aria-pressed={active}
    >
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
      <span className={`absolute bottom-0.5 h-[2px] w-[48px] rounded-full bg-[#2A7CF2] transition ${active ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
}
