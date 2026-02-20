import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Calendar as CalendarIcon, CalendarDays, ChevronLeft, ChevronRight, Inbox, List, Plus } from 'lucide-react';
import { AddTaskModal } from './AddTaskModal';
import { CalendarGrid } from './CalendarGrid';
import { filterTasksByQuery, formatMonthLabel, getTasksForDate, parseISODate, shiftMonth, startOfMonth, toISODate } from './calendarHelpers';
import { TaskCard } from './TaskCard';
import { TaskSidebar } from './TaskSidebar';
import type { CalendarTask, CategoryColor, TaskStatus } from './types';

const now = new Date();
const initialMonth = startOfMonth(now.getFullYear(), now.getMonth());
const todayISO = toISODate(now);

type ViewMode = 'calendar' | 'list' | 'backlog';
type DomainFilter = 'all' | 'backend' | 'frontend' | 'devops';

const INITIAL_TASKS: CalendarTask[] = [
  { id: 'task-1', title: 'API Integration', status: 'in_progress', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 12)), categoryColor: 'red', timeLabel: '09:00 AM' },
  { id: 'task-2', title: 'Fix Login Bug', status: 'pending', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 12)), categoryColor: 'yellow', timeLabel: '04:00 PM' },
  { id: 'task-3', title: 'Code Review', status: 'completed', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 15)), categoryColor: 'green', timeLabel: '09:00 AM' },
  { id: 'task-4', title: 'Database Update', status: 'in_progress', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 18)), categoryColor: 'red', timeLabel: '11:30 PM' },
  { id: 'task-5', title: 'Design QA', status: 'pending', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 18)), categoryColor: 'blue', timeLabel: '01:00 PM' },
  { id: 'task-6', title: 'Write Unit Tests', status: 'completed', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 18)), categoryColor: 'green', timeLabel: '03:30 PM' },
  { id: 'task-7', title: 'Sprint Planning', status: 'pending', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 18)), categoryColor: 'yellow', timeLabel: '05:00 PM' },
  { id: 'task-8', title: 'Ops Handoff', status: 'in_progress', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 25)), categoryColor: 'green', timeLabel: '04:34 PM' },
  { id: 'task-9', title: 'Client Sync', status: 'completed', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 26)), categoryColor: 'blue', timeLabel: '08:45 AM' },
  { id: 'task-10', title: 'Accessibility Audit', status: 'pending', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 26)), categoryColor: 'yellow', timeLabel: '10:15 AM' },
  { id: 'task-11', title: 'Release Prep', status: 'in_progress', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 26)), categoryColor: 'red', timeLabel: '11:30 AM' },
  { id: 'task-12', title: 'Inbox Cleanup', status: 'completed', dateISO: toISODate(new Date(now.getFullYear(), now.getMonth(), 26)), categoryColor: 'green', timeLabel: '02:20 PM' },
  { id: 'task-13', title: 'Research SSO Provider', status: 'pending', dateISO: null, categoryColor: 'blue', timeLabel: '10:00 AM' },
  { id: 'task-14', title: 'Draft onboarding flow copy', status: 'in_progress', dateISO: null, categoryColor: 'yellow', timeLabel: '11:15 AM' },
  { id: 'task-15', title: 'Backfill analytics events', status: 'pending', dateISO: null, categoryColor: 'red', timeLabel: '02:00 PM' },
];

export default function CalendarPage() {
  const [monthDate, setMonthDate] = useState(initialMonth);
  const [selectedDateISO, setSelectedDateISO] = useState(todayISO);
  const [tasks, setTasks] = useState<CalendarTask[]>(INITIAL_TASKS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [activeView, setActiveView] = useState<ViewMode>('list');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleDeleteTask = (taskId: string) => {
    setTasks(currentTasks => currentTasks.filter(t => t.id !== taskId));
    if (selectedTaskId === taskId) setSelectedTaskId(null);
  };

  const handleViewTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
  };

  const handleToggleStatus = (taskId: string) => {
    setTasks(currentTasks =>
      currentTasks.map(t => {
        if (t.id !== taskId) return t;
        const next = t.status === 'pending' ? 'in_progress' : t.status === 'in_progress' ? 'completed' : 'pending';
        return { ...t, status: next };
      }),
    );
  };

  const filteredTasks = useMemo(() => {
    const bySearch = filterTasksByQuery(tasks, searchQuery);
    const byStatus = bySearch.filter(task => (statusFilter === 'all' ? true : task.status === statusFilter));
    return byStatus.filter(task => (domainFilter === 'all' ? true : mapDomain(task.categoryColor) === domainFilter));
  }, [tasks, searchQuery, statusFilter, domainFilter]);

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

  return (
    <main className="min-h-screen bg-[#f2f4fa] px-3 py-3 md:px-5 md:py-4">
      <div className="mx-auto max-w-[1880px]">
        <section className="mb-2 rounded-[14px] border border-[#E4E8F0] bg-[#FCFDFF] px-4 py-3 shadow-[0_4px_16px_rgba(40,56,90,0.06)] md:px-6 md:py-3.5">
          <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#74809A]">Execution</p>
          <h1 className="mt-1 text-[20px] font-semibold leading-none tracking-[-0.02em] text-[#151C2E]">Tasks</h1>
          <p className="mt-1.5 text-[11px] text-[#5E6A80]">Manage your calendar, list view, and backlog in one workflow.</p>
        </section>

        <section className="mb-2 rounded-[14px] border border-[#E4E8F0] bg-[#FCFDFF] px-4 py-2.5 shadow-[0_4px_16px_rgba(40,56,90,0.06)] md:px-6">
          <div className="flex flex-col gap-2.5 xl:flex-row xl:items-center xl:justify-between">
            <div className="inline-flex h-[34px] items-center overflow-hidden rounded-lg border border-[#CBD4E3] bg-[#EFF2F7] shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <DomainTab label="All" value="all" active={domainFilter === 'all'} onClick={() => setDomainFilter('all')} />
              <DomainTab label="Backend" value="backend" active={domainFilter === 'backend'} onClick={() => setDomainFilter('backend')} showDot />
              <DomainTab label="Frontend" value="frontend" active={domainFilter === 'frontend'} onClick={() => setDomainFilter('frontend')} withDivider />
              <DomainTab label="DevOps" value="devops" active={domainFilter === 'devops'} onClick={() => setDomainFilter('devops')} />
            </div>

            <div className="min-w-[260px] flex-1 xl:max-w-[460px]">
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <p className="text-[11px] font-semibold text-[#2A3650]">Tasks Progress</p>
                <label className="text-[10px] text-[#5D6880]">
                  Status
                  <select
                    value={statusFilter}
                    onChange={event => setStatusFilter(event.target.value as 'all' | TaskStatus)}
                    className="ml-1 h-5 rounded-md border border-[#CFD7E4] bg-white px-1 text-[9px] text-[#40506A]"
                    aria-label="Filter status">
                    <option value="all">All</option>
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-[6px] flex-1 rounded-full bg-[#D8E0EE]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#145BE7] to-[#2A7CF2]" style={{ width: `${progressPercent}%` }} />
                </div>
                <span className="text-[9px] text-[#5D6880]">
                  {progressCompleted} of {progressTotal} completed
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex h-[34px] items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#2A2DEB] to-[#0A6CE8] px-4 text-white shadow-[0_6px_16px_rgba(25,68,220,0.3)] transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
              <Plus className="h-3.5 w-3.5" />
              <span className="text-[11px] font-semibold">Bulk Add</span>
              <span className="inline-flex h-5 items-center rounded px-1.5 text-[9px] font-semibold border border-white/20 bg-white/16">⌘ B</span>
            </button>
          </div>
        </section>

        <section className="mb-2 rounded-xl border border-[#E4E8F0] bg-[#FCFDFF] px-3 py-1 shadow-[0_4px_16px_rgba(40,56,90,0.06)] md:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-0.5">
              <ViewTab label="Calendar" value="calendar" activeView={activeView} onChange={setActiveView} icon={<CalendarDays className="h-4 w-4" />} />
              <ViewTab label="List" value="list" activeView={activeView} onChange={setActiveView} icon={<List className="h-4 w-4" />} />
              <ViewTab label="Backlog" value="backlog" activeView={activeView} onChange={setActiveView} icon={<Inbox className="h-4 w-4" />} />
            </div>

            <div className="flex items-center gap-2">
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
          </div>
        </section>

        <div className="mb-2 rounded-lg border border-[#E0E6F0] bg-white px-3 py-1.5 shadow-[0_4px_12px_rgba(40,56,90,0.05)] md:px-4">
          <input
            type="search"
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
            placeholder="Search tasks..."
            aria-label="Search tasks"
            className="h-7 w-full rounded-md border border-[#D4DDEB] bg-[#F7F9FD] px-2.5 text-[11px] text-[#344257] placeholder:text-[#7D879A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
        </div>

        {activeView === 'calendar' ? (
          <section className="overflow-hidden rounded-[20px] border border-[#DFE4ED] bg-[#F6F8FC] shadow-[0_10px_28px_rgba(40,56,90,0.08)]">
            <div className="grid grid-cols-1 items-stretch xl:grid-cols-[minmax(0,3fr)_minmax(360px,1fr)]">
              <div className="p-4 md:p-5">
                <CalendarGrid
                  monthDate={monthDate}
                  selectedDateISO={selectedDateISO}
                  tasks={scheduledTasks}
                  onSelectDate={handleSelectDate}
                  onPrevMonth={() => handleMonthChange(-1)}
                  onNextMonth={() => handleMonthChange(1)}
                  showHeader={false}
                />
              </div>

              <div className="hidden border-l border-[#DFE4ED] bg-[#F9FBFF] p-4 md:block md:p-5 overflow-hidden">
                <TaskSidebar
                  selectedDateISO={selectedDateISO}
                  tasks={tasksForSelectedDate}
                  visibleTasks={visibleSidebarTasks}
                  selectedTaskId={selectedTaskId}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSelectTask={setSelectedTaskId}
                  onOpenAddTask={() => setIsAddModalOpen(true)}
                  onViewTask={handleViewTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onToggleStatus={handleToggleStatus}
                />
              </div>
            </div>
          </section>
        ) : null}

        {activeView === 'list' ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
            {groupedMonthTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">No scheduled tasks match current filters for this month.</div>
            ) : (
              <div className="space-y-5">
                {groupedMonthTasks.map(group => (
                  <div key={group.dateKey}>
                    <p className="mb-1.5 text-[11px] font-medium text-slate-500">{parseISODate(group.dateKey).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
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
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:p-6">
            {backlogTasks.length === 0 ? (
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
              onOpenAddTask={() => setIsAddModalOpen(true)}
              onClose={() => setIsMobileSidebarOpen(false)}
              onViewTask={handleViewTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        </div>
      ) : null}

      <AddTaskModal
        isOpen={isAddModalOpen}
        defaultDateISO={selectedDateISO}
        onClose={() => setIsAddModalOpen(false)}
        onAddTask={payload => {
          const generatedId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `task-${Date.now()}`;

          setTasks(currentTasks => [
            {
              id: generatedId,
              title: payload.title,
              status: payload.status,
              dateISO: payload.dateISO,
              categoryColor: payload.categoryColor,
              timeLabel: payload.timeLabel,
            },
            ...currentTasks,
          ]);

          handleSelectDate(payload.dateISO);
          setSelectedTaskId(generatedId);
          setActiveView('calendar');
        }}
      />
    </main>
  );
}

function DomainTab({ label, value, active, onClick, showDot, withDivider }: { label: string; value: DomainFilter; active: boolean; onClick: () => void; showDot?: boolean; withDivider?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={`Filter by ${value}`}
      className={[
        'relative inline-flex h-full min-w-[64px] items-center justify-center gap-1 px-2.5 text-[10px] font-semibold transition',
        withDivider ? 'before:absolute before:left-0 before:top-1/2 before:h-6 before:w-px before:-translate-y-1/2 before:bg-[#C9D2E3]' : '',
        active ? 'rounded-[8px] border border-[#C9D2E3] bg-white text-[#222E46] shadow-[0_3px_10px_rgba(37,55,89,0.14)]' : 'text-[#36455F] hover:bg-white/60',
      ].join(' ')}>
      {label}
      {showDot ? <span className="h-2 w-2 rounded-full bg-[#F2C145]" aria-hidden="true" /> : null}
    </button>
  );
}

function ViewTab({ label, value, activeView, onChange, icon }: { label: string; value: ViewMode; activeView: ViewMode; onChange: (view: ViewMode) => void; icon: ReactNode }) {
  const active = activeView === value;

  return (
    <button type="button" onClick={() => onChange(value)} className="group relative inline-flex h-[32px] min-w-[80px] items-center justify-center gap-1 px-2.5 text-[#2E3A52]" aria-pressed={active}>
      {icon}
      <span className="text-[11px] font-semibold">{label}</span>
      <span className={`absolute bottom-0 h-[2px] w-[48px] rounded-full bg-[#2A7CF2] transition ${active ? 'opacity-100' : 'opacity-0'}`} />
    </button>
  );
}

function mapDomain(color: CategoryColor): DomainFilter {
  if (color === 'blue') return 'frontend';
  if (color === 'green') return 'devops';
  return 'backend';
}
