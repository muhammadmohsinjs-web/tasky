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
import { ChevronLeft, ChevronRight, Search, CalendarDays, List, Inbox, Plus } from 'lucide-react'
import type { Task } from '../types'

export default function Tasks() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'calendar' | 'list' | 'backlog'>('calendar')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [panelMode, setPanelMode] = useState<'view' | 'edit'>('view')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [bulkAddOpen, setBulkAddOpen] = useState(false)
  const { categories, loading: categoriesLoading } = useCategories()
  const { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask, bulkUpdateStatus, bulkReschedule, bulkMoveToBacklog, bulkDelete, refetch: refetchCalendar } =
    useTasks(year, month)
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

  // Debounce search input with 300ms delay
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
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }

  const goToNextMonth = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const goToToday = () => {
    setYear(now.getFullYear())
    setMonth(now.getMonth())
  }

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const doneTasks = tasks.filter((t) => t.status === 'done').length
  const totalTasks = tasks.length

  const filterBySearchAndCategory = (list: Task[]) => {
    let result = list
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category_id === activeCategory)
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim().toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }

  const filteredTasks = useMemo(() => filterBySearchAndCategory(tasks), [tasks, activeCategory, debouncedSearch])
  const filteredBacklogTasks = useMemo(() => filterBySearchAndCategory(backlogTasks), [backlogTasks, activeCategory, debouncedSearch])

  return (
    <div className="p-6 lg:px-10 lg:py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">Tasks</h1>
              <p className="text-sm text-slate-400 mt-1">Manage and organize your tasks</p>
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

          <div className="flex items-center gap-3">
            <button
              onClick={() => setBulkAddOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Bulk Add
            </button>

            {totalTasks > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 px-3 py-1.5 rounded-lg">
                <span>{doneTasks}/{totalTasks} done</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200 shadow-sm px-1.5 py-1.5">
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
              <button onClick={goToToday} className="text-sm px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-xl hover:bg-indigo-100 cursor-pointer">
                Today
              </button>
            )}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, notes..."
              className="ml-2.5 text-sm w-48 sm:w-64 bg-transparent outline-none text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-slate-400">Filter</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveCategory('all')}
                className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer font-medium ${
                  activeCategory === 'all'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-xs px-3 py-1.5 rounded-full border cursor-pointer font-medium ${
                    activeCategory === cat.id
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-400 hover:text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setView('calendar')}
              className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-medium ${
                view === 'calendar' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-medium ${
                view === 'list' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <List className="w-4 h-4" />
              List
            </button>
            <button
              onClick={() => setView('backlog')}
              className={`text-xs px-3.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer font-medium ${
                view === 'backlog' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Inbox className="w-4 h-4" />
              Backlog
              {backlogTasks.length > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  view === 'backlog' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {backlogTasks.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {(view === 'backlog' ? backlogLoading : loading) || categoriesLoading ? (
            <LoadingSpinner message="Loading tasks..." fullHeight={false} />
          ) : view === 'backlog' ? (
            <BacklogList
              tasks={filteredBacklogTasks}
              totalCount={backlogTasks.length}
              categories={categories}
              onAdd={addBacklogTask}
              onStatusChange={updateBacklogStatus}
              onSelect={(task, mode) => { setSelectedTask(task); setPanelMode(mode) }}
              onDelete={deleteBacklogTask}
              onSchedule={async (ids, date) => {
                await scheduleBacklogTasks(ids, date)
                await refetchCalendar()
              }}
              onBulkStatusChange={bulkUpdateBacklogStatus}
              onBulkDelete={bulkDeleteBacklog}
            />
          ) : view === 'calendar' ? (
            <Calendar
              year={year}
              month={month}
              tasks={filteredTasks}
              categories={categories}
              onAdd={addTask}
              onStatusChange={updateTaskStatus}
              onUpdate={updateTask}
              onDelete={deleteTask}
              onSelect={(task, mode) => { setSelectedTask(task); setPanelMode(mode) }}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              onStatusChange={updateTaskStatus}
              onSelect={(task, mode) => { setSelectedTask(task); setPanelMode(mode) }}
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
          )}
        </div>

        <TaskDetailPanel
          task={selectedTask}
          categories={categories}
          mode={panelMode}
          onModeChange={setPanelMode}
          onClose={() => setSelectedTask(null)}
          onUpdate={async (id, updates) => {
            const isBacklogTask = selectedTask?.date === null
            if (isBacklogTask) {
              await updateBacklogTask(id, updates)
              // If a date was assigned, the task leaves backlog — also refetch calendar tasks
              if (updates.date) {
                await refetchBacklog()
              }
            } else {
              await updateTask(id, updates)
              // If date was cleared, task moves to backlog — refetch backlog
              if (updates.date === null) {
                await refetchBacklog()
              }
            }
          }}
          onDelete={(id) => {
            const isBacklogTask = selectedTask?.date === null
            if (isBacklogTask) {
              deleteBacklogTask(id)
            } else {
              deleteTask(id)
            }
            setSelectedTask(null)
          }}
        />
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
