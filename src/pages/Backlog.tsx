import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useBacklogTasks } from '../hooks/useBacklogTasks'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { BacklogTaskRow } from '../components/backlog/BacklogTaskRow'
import { AddTaskModal } from '../components/tasks/monthly/AddTaskModal'
import type { RecurrenceRule, Task, TaskLink, TaskPriority, TaskStatus } from '../types'

type CalendarStatus = 'pending' | 'in_progress' | 'completed'
type BacklogFilter = 'all' | 'linked' | 'unlinked'

const CALENDAR_TO_DB_STATUS: Record<CalendarStatus, TaskStatus> = {
  pending: 'todo',
  in_progress: 'inprogress',
  completed: 'done',
}

export default function Backlog() {
  const { tasks, loading, error, addTask, updateTask, deleteTask } = useBacklogTasks()
  const { categories } = useCategories()
  const { goals } = useGoals()

  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<BacklogFilter>('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [modalTask, setModalTask] = useState<Task | null>(null)

  const backlogTasks = useMemo(
    () => tasks.filter((task) => (task.task_type ?? 'task') === 'task' && task.date === null),
    [tasks],
  )

  const visibleTasks = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return backlogTasks.filter((task) => {
      const matchesQuery = !normalizedQuery || [
        task.title,
        task.description ?? '',
        task.notes ?? '',
        task.goal?.title ?? '',
      ].some((value) => value.toLowerCase().includes(normalizedQuery))

      if (!matchesQuery) return false

      if (filter === 'linked') return !!task.goal_id
      if (filter === 'unlinked') return !task.goal_id
      return true
    })
  }, [backlogTasks, query, filter])

  const activeGoals = useMemo(() => goals.filter((goal) => goal.status === 'active'), [goals])

  async function handleSchedule(taskId: string, date: string) {
    const ok = await updateTask(taskId, { date })
    if (ok) toast.success('Task scheduled')
  }

  async function handleLinkGoal(taskId: string, goalId: string | null) {
    const ok = await updateTask(taskId, { goal_id: goalId })
    if (ok) toast.success(goalId ? 'Goal linked' : 'Goal removed')
  }

  async function handleDelete(taskId: string) {
    await deleteTask(taskId)
  }

  function openCreateTask() {
    setModalTask(null)
    setModalMode('create')
    setModalOpen(true)
  }

  function openEditTask(task: Task) {
    setModalTask(task)
    setModalMode('edit')
    setModalOpen(true)
  }

  async function handleModalSubmit(payload: {
    title: string
    description: string | null
    notes: string | null
    time: string | null
    end_time: string | null
    task_type: 'task' | 'habit'
    categoryId: string
    goal_id: string | null
    status: CalendarStatus
    priority: TaskPriority
    dateISO: string | null
    links: TaskLink[]
    files: File[]
    subtasks: unknown[]
    tags: string[]
    reminderAt: string | null
    recurrence: RecurrenceRule | null
  }): Promise<boolean> {
    const dbStatus = CALENDAR_TO_DB_STATUS[payload.status]

    if (modalTask) {
      return updateTask(modalTask.id, {
        title: payload.title,
        description: payload.description,
        notes: payload.notes,
        time: payload.time,
        end_time: payload.end_time,
        task_type: payload.task_type,
        category_id: payload.categoryId || null,
        goal_id: payload.goal_id,
        date: payload.dateISO,
        status: dbStatus,
        priority: payload.priority,
        links: payload.links,
        recurrence: payload.recurrence,
      })
    }

    const created = await addTask(
      payload.title,
      payload.categoryId,
      payload.priority,
      {
        description: payload.description,
        notes: payload.notes,
        time: payload.time,
        end_time: payload.end_time,
        task_type: payload.task_type,
        goal_id: payload.goal_id,
        status: dbStatus,
        links: payload.links,
        recurrence: payload.recurrence,
      },
    )

    return !!created
  }

  return (
    <div className="content-wrap">
      <div className="page-header flex items-start justify-between gap-4 flex-wrap">
        <div>
          <span className="page-kicker">Queue</span>
          <h1>Backlog</h1>
          <p className="page-subtitle">Unscheduled tasks waiting to be planned.</p>
        </div>
        <button
          type="button"
          onClick={openCreateTask}
          className="inline-flex items-center gap-1 h-10 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          Add task
        </button>
      </div>

      <section className="panel p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
          <label className="relative block">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search backlog tasks"
              className="h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-700"
            />
          </label>

          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            {([
              { key: 'all', label: 'All' },
              { key: 'linked', label: 'Linked to goal' },
              { key: 'unlinked', label: 'No goal' },
            ] as const).map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
                  filter === item.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="panel p-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading backlog...</p>
        ) : error ? (
          <p className="text-sm text-rose-600">{error}</p>
        ) : visibleTasks.length === 0 ? (
          <p className="text-sm text-slate-500">No backlog tasks match your filters.</p>
        ) : (
          <div className="space-y-2.5">
            {visibleTasks.map((task) => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                goals={activeGoals}
                onSchedule={handleSchedule}
                onLinkGoal={handleLinkGoal}
                onEdit={openEditTask}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </section>

      <AddTaskModal
        isOpen={modalOpen}
        mode={modalMode}
        defaultDateISO=""
        defaultTaskType="task"
        task={modalTask}
        categories={categories}
        onClose={() => {
          setModalOpen(false)
          setModalTask(null)
          setModalMode('create')
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
