import { useEffect, useMemo, useState } from 'react'
import { Calendar } from '../components/Calendar'
import { TaskDetailPanel } from '../components/TaskDetailPanel'
import { TaskList } from '../components/TaskList'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import { categoryDot } from '../components/categoryUtils'
import { MONTH_NAMES } from '../lib/constants'
import { ChevronLeft, ChevronRight, Search, CalendarDays, List } from 'lucide-react'
import type { Task } from '../types'

export default function Tasks() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const { categories, loading: categoriesLoading } = useCategories()
  const { tasks, loading, addTask, updateTaskStatus, updateTask, deleteTask } =
    useTasks(year, month)

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

  const filteredTasks = useMemo(() => {
    let result = tasks
    if (activeCategory !== 'all') {
      result = result.filter((t) => t.category_id === activeCategory)
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      result = result.filter((t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q)
      )
    }
    return result
  }, [tasks, activeCategory, search])

  return (
    <div className="p-6 lg:pl-8">
      <header className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-5">
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-slate-800">Tasks</h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage your learning tasks</p>
            </div>
            <div className="hidden sm:flex items-center gap-3 ml-2 pl-5 border-l border-slate-200">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${categoryDot(cat)}`} />
                  <span className="text-[11px] text-slate-500">{cat.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {totalTasks > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400">
                <span>{doneTasks}/{totalTasks} done</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-white rounded-xl border border-slate-200 shadow-sm px-1 py-1">
              <button onClick={goToPrevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-medium text-slate-700 min-w-[130px] text-center select-none">
                {MONTH_NAMES[month]} {year}
              </span>
              <button onClick={goToNextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {!isCurrentMonth && (
              <button onClick={goToToday} className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 cursor-pointer">
                Today
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1.5 shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, notes..."
              className="ml-2 text-xs w-44 sm:w-60 bg-transparent outline-none text-slate-600 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400">Filter</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory('all')}
                className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer ${
                  activeCategory === 'all'
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                    : 'border-slate-200 text-slate-400 hover:text-slate-600'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`text-[10px] px-2 py-1 rounded-full border cursor-pointer ${
                    activeCategory === cat.id
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-600'
                      : 'border-slate-200 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setView('calendar')}
              className={`text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer ${
                view === 'calendar' ? 'bg-indigo-500 text-white' : 'text-slate-500'
              }`}
            >
              <CalendarDays className="w-3 h-3" />
              Calendar
            </button>
            <button
              onClick={() => setView('list')}
              className={`text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1.5 cursor-pointer ${
                view === 'list' ? 'bg-indigo-500 text-white' : 'text-slate-500'
              }`}
            >
              <List className="w-3 h-3" />
              List
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          {loading || categoriesLoading ? (
            <div className="flex flex-col items-center justify-center py-32 gap-3">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse-soft" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-soft" style={{ animationDelay: '200ms' }} />
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse-soft" style={{ animationDelay: '400ms' }} />
              </div>
              <span className="text-xs text-slate-400">Loading tasks...</span>
            </div>
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
              onSelect={setSelectedTask}
            />
          ) : (
            <TaskList
              tasks={filteredTasks}
              onStatusChange={updateTaskStatus}
              onSelect={setSelectedTask}
            />
          )}
        </div>

        <TaskDetailPanel
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onUpdate={updateTask}
          onDelete={(id) => { deleteTask(id); setSelectedTask(null) }}
        />
      </div>
    </div>
  )
}
