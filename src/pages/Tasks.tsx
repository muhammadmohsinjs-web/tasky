import { useEffect, useMemo, useState } from 'react'
import { Calendar } from '../components/tasks/Calendar'
import { TaskDetailPanel } from '../components/tasks/TaskDetailPanel'
import { TaskList } from '../components/tasks/TaskList'
import { BacklogList } from '../components/tasks/BacklogList'
import { BulkAddModal } from '../components/tasks/BulkAddModal'
import { useTasks } from '../hooks/useTasks'
import { useBacklogTasks } from '../hooks/useBacklogTasks'
import { useCategories } from '../hooks/useCategories'
import { categoryDot } from '../lib/categoryUtils'
import { MONTH_NAMES } from '../lib/constants'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { EmptyState } from '../components/ui/EmptyState'
import { ChevronLeft, ChevronRight, Search, CalendarDays, List, Inbox, Plus } from 'lucide-react'
import type { Task } from '../types'

export default function Tasks() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'calendar' | 'list' | 'backlog'>('calendar')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories()
  const {
    tasks,
    loading,
    addTask,
    addTasks,
    updateTaskStatus,
    updateTask,
    deleteTask,
    bulkUpdateStatus,
    bulkReschedule,
    bulkMoveToBacklog,
    bulkDelete,
    refetch: refetchCalendar,
  } = useTasks(year, month)
  const {
    tasks: backlogTasks,
    loading: backlogLoading,
    addTask: addBacklogTask,
    addTasks: addBacklogTasks,
    updateTaskStatus: updateBacklogStatus,
    updateTask: updateBacklogTask,
    deleteTask: deleteBacklogTask,
    bulkUpdateStatus: bulkUpdateBacklogStatus,
    bulkDelete: bulkDeleteBacklog,
    scheduleTasks: scheduleBacklogTasks,
    refetch: refetchBacklog,
  } = useBacklogTasks()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!selectedTask) return
    const next = tasks.find((t) => t.id === selectedTask.id)
    if (next) setSelectedTask(next)
    else setSelectedTask(null)
  }, [tasks, selectedTask])

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }

  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const goToToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category_id === activeCategory)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q))
    }
    return result
  }, [tasks, activeCategory, debouncedSearch])

  const filteredBacklogTasks = useMemo(() => {
    let result = backlogTasks
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category_id === activeCategory)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      result = result.filter((t) => t.title.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q) || (t.notes ?? '').toLowerCase().includes(q))
    }
    return result
  }, [backlogTasks, activeCategory, debouncedSearch])

  // Tasks for the selected date (used by the drawer in date-list mode)
  const selectedDateTasks = useMemo(() => {
    if (!selectedDate) return []
    return filteredTasks.filter((t) => t.date === selectedDate)
  }, [filteredTasks, selectedDate])

  const handleDateSelect = (date: string) => {
    if (selectedDate === date) {
      // Deselect if clicking the same date
      setSelectedDate(null)
      setSelectedTask(null)
    } else {
      setSelectedDate(date)
      setSelectedTask(null)
    }
  }

  const handleTaskSelect = (task: Task, mode: 'view' | 'edit') => {
    setSelectedTask(task)
    setPanelMode(mode)
    setSelectedDate(null)
  }

  // Determine whether to show the panel
  const showDrawer = selectedTask !== null || selectedDate !== null

  // Compute empty state conditions
  const hasSearch = debouncedSearch.trim().length > 0
  const hasFilter = activeCategory !== 'all'
  const isFiltered = hasSearch || hasFilter

  return (
    <div className="content-wrap">
      <header className="page-header">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div>
              <span className="page-kicker">Execution</span>
              <h1>Tasks</h1>
              <p className="page-subtitle">Manage your calendar, list view, and backlog in one workflow.</p>
            </div>
            <div className="hidden sm:flex items-center gap-4 ml-2 pl-5 border-l border-slate-200">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${categoryDot(cat)}`} />
                  <span className="text-xs font-medium text-slate-500">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end">
            <button onClick={() => setBulkAddOpen(true)} className="btn btn-primary">
              <Plus className="w-4 h-4" />
              Bulk Add
            </button>

            {totalTasks > 0 && <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold bg-white border border-slate-200 px-3 py-1.5 rounded-lg">{doneTasks}/{totalTasks} done</div>}

            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 shadow-sm px-1.5 py-1.5">
              <button onClick={goToPrevMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-base font-semibold text-slate-700 min-w-[150px] text-center select-none">
                {MONTH_NAMES[month]} {year}
              </span>
              <button onClick={goToNextMonth} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button onClick={goToToday} className="btn btn-secondary">
                Today
              </button>
            )}
          </div>
        </div>

        {/* Month progress bar */}
        {view === 'calendar' && totalTasks > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Monthly progress</span>
              <span className="text-[11px] font-bold text-slate-500">{Math.round((doneTasks / totalTasks) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, notes..." className="ml-2.5 text-sm w-48 sm:w-64 bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Filter</span>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setActiveCategory('all')} className={`tag-filter ${activeCategory === 'all' ? 'active' : ''}`}>
                All
              </button>
              {categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`tag-filter ${activeCategory === cat.id ? 'active' : ''}`}>
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button onClick={() => setView('calendar')} className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-semibold ${view === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
            <button onClick={() => setView('list')} className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-semibold ${view === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <List className="w-4 h-4" />
              List
            </button>
            <button onClick={() => setView('backlog')} className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-semibold ${view === 'backlog' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}>
              <Inbox className="w-4 h-4" />
              Backlog
              {backlogTasks.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${view === 'backlog' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {backlogTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0">
          {(view === 'backlog' ? backlogLoading : loading) || categoriesLoading ? (
            <LoadingSpinner message="Loading tasks..." fullHeight={false} />
          ) : view === 'backlog' ? (
            filteredBacklogTasks.length === 0 ? (
              <EmptyState
                type={isFiltered ? (hasSearch ? 'no-search-results' : 'no-filter-results') : 'no-tasks-month'}
                searchQuery={hasSearch ? debouncedSearch : undefined}
                categoryName={hasFilter ? categories.find(c => c.id === activeCategory)?.name : undefined}
                onClearSearch={hasSearch ? () => setSearch('') : undefined}
                onShowAll={hasFilter ? () => setActiveCategory('all') : undefined}
              />
            ) : (
              <BacklogList
                tasks={filteredBacklogTasks}
                totalCount={backlogTasks.length}
                categories={categories}
                onAdd={addBacklogTask}
                onStatusChange={updateBacklogStatus}
                onSelect={(task, mode) => handleTaskSelect(task, mode)}
                onDelete={deleteBacklogTask}
                onSchedule={async (ids, date) => {
                  await scheduleBacklogTasks(ids, date)
                  await refetchCalendar()
                }}
                onBulkStatusChange={bulkUpdateBacklogStatus}
                onBulkDelete={bulkDeleteBacklog}
              />
            )
          ) : view === 'calendar' ? (
            isFiltered && filteredTasks.length === 0 ? (
              <EmptyState
                type={hasSearch ? 'no-search-results' : 'no-filter-results'}
                searchQuery={hasSearch ? debouncedSearch : undefined}
                categoryName={hasFilter ? categories.find(c => c.id === activeCategory)?.name : undefined}
                onClearSearch={hasSearch ? () => setSearch('') : undefined}
                onShowAll={hasFilter ? () => setActiveCategory('all') : undefined}
              />
            ) : (
              <Calendar
                year={year}
                month={month}
                tasks={filteredTasks}
                categories={categories}
                onAdd={addTask}
                onStatusChange={updateTaskStatus}
                onUpdate={updateTask}
                onDelete={deleteTask}
                onSelect={(task, mode) => handleTaskSelect(task, mode)}
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
              />
            )
          ) : (
            filteredTasks.length === 0 ? (
              <EmptyState
                type={isFiltered ? (hasSearch ? 'no-search-results' : 'no-filter-results') : 'no-tasks-month'}
                searchQuery={hasSearch ? debouncedSearch : undefined}
                categoryName={hasFilter ? categories.find(c => c.id === activeCategory)?.name : undefined}
                onClearSearch={hasSearch ? () => setSearch('') : undefined}
                onShowAll={hasFilter ? () => setActiveCategory('all') : undefined}
              />
            ) : (
              <TaskList
                tasks={filteredTasks}
                onStatusChange={updateTaskStatus}
                onSelect={(task, mode) => handleTaskSelect(task, mode)}
                onBulkStatusChange={bulkUpdateStatus}
                onBulkReschedule={async (ids, date) => {
                  await bulkReschedule(ids, date)
                  await refetchCalendar()
                }}
                onBulkMoveToBacklog={async (ids) => {
                  await bulkMoveToBacklog(ids)
                  await refetchBacklog()
                }}
                onBulkDelete={bulkDelete}
              />
            )
          )}
        </div>

        {showDrawer && (
          <TaskDetailPanel
            task={selectedTask}
            categories={categories}
            mode={panelMode}
            onModeChange={setPanelMode}
            onClose={() => { setSelectedTask(null); setSelectedDate(null) }}
            onUpdate={async (id, updates) => {
              const isBacklogTask = selectedTask?.date === null
              if (isBacklogTask) {
                await updateBacklogTask(id, updates)
                if (updates.date) {
                  await refetchBacklog()
                }
              } else {
                await updateTask(id, updates)
                if (updates.date === null) {
                  await refetchBacklog()
                }
              }

              if (selectedTask) {
                const updatedTask = { ...selectedTask, ...updates }
                setSelectedTask(updatedTask)
              }
            }}
            onDelete={async (id) => {
              const isBacklogTask = selectedTask?.date === null
              if (isBacklogTask) {
                await deleteBacklogTask(id)
              } else {
                await deleteTask(id)
              }
              setSelectedTask(null)
            }}
            selectedDate={selectedDate}
            selectedDateTasks={selectedDateTasks}
            onTaskSelect={(task, mode) => handleTaskSelect(task, mode)}
            onStatusChange={updateTaskStatus}
            onTaskDelete={deleteTask}
          />
        )}
      </div>

      <BulkAddModal
        open={bulkAddOpen}
        onClose={() => setBulkAddOpen(false)}
        categories={categories}
        onAddToDate={addTasks}
        onAddToBacklog={addBacklogTasks}
      />
    </div>
  )
}
