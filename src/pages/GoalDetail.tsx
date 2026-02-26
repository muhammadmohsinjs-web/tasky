import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useGoalDetail } from '../hooks/useGoalDetail'
import { useCategories } from '../hooks/useCategories'
import { useGoals } from '../hooks/useGoals'
import { useAuth } from '../contexts/AuthContext'
import { TaskRow } from '../components/cockpit/TaskRow'
import { AddTaskModal } from '../components/tasks/monthly/AddTaskModal'
import { GoalFormModal } from '../components/goals/GoalFormModal'
import type { Goal, RecurrenceRule, Task, TaskLink, TaskPriority, TaskStatus } from '../types'

type CalendarStatus = 'pending' | 'in_progress' | 'completed'

const CALENDAR_TO_DB_STATUS: Record<CalendarStatus, TaskStatus> = {
  pending: 'todo',
  in_progress: 'inprogress',
  completed: 'done',
}

function formatDateRange(startDate?: string | null, endDate?: string | null): string {
  if (!startDate && !endDate) return 'No timeline'
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' })
  const start = startDate ? formatter.format(new Date(`${startDate}T00:00:00`)) : 'Any time'
  const end = endDate ? formatter.format(new Date(`${endDate}T00:00:00`)) : 'No end'
  return `${start} - ${end}`
}

function statusBadgeClass(status: Goal['status']): string {
  if (status === 'completed') return 'bg-emerald-100 text-emerald-700'
  if (status === 'abandoned') return 'bg-rose-100 text-rose-700'
  return 'bg-blue-100 text-blue-700'
}

function statusLabel(status: Goal['status']): string {
  if (status === 'completed') return 'Completed'
  if (status === 'abandoned') return 'Abandoned'
  return 'Active'
}

function formatTaskDate(date: string | null): string {
  if (!date) return 'No date'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export default function GoalDetail() {
  const { id: goalId } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const { goal, tasks, isLoading } = useGoalDetail(goalId)
  const { updateGoal } = useGoals()
  const { categories } = useCategories()

  const [editingGoal, setEditingGoal] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [taskModalTask, setTaskModalTask] = useState<Task | null>(null)

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], [])

  if (!goalId) {
    return <div className="content-wrap text-sm text-slate-500">Goal not found.</div>
  }

  async function invalidateGoalViews() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['goals'] }),
      queryClient.invalidateQueries({ queryKey: ['goal-detail', goalId] }),
    ])
  }

  async function toggleTask(taskId: string, currentStatus: TaskStatus) {
    const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done'

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', taskId)

    if (error) {
      toast.error('Failed to update task')
      return
    }

    await invalidateGoalViews()
  }

  function openCreateTask() {
    setTaskModalTask(null)
    setTaskModalMode('create')
    setTaskModalOpen(true)
  }

  function openEditTask(task: Task) {
    setTaskModalTask(task)
    setTaskModalMode('edit')
    setTaskModalOpen(true)
  }

  async function handleTaskSubmit(payload: {
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

    if (taskModalTask) {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: payload.title,
          description: payload.description,
          notes: payload.notes,
          time: payload.time,
          end_time: payload.end_time,
          task_type: payload.task_type,
          category_id: payload.categoryId || null,
          goal_id: goalId,
          date: payload.dateISO,
          status: dbStatus,
          priority: payload.priority,
          links: payload.links,
          recurrence: payload.recurrence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskModalTask.id)

      if (error) {
        toast.error('Failed to save task')
        return false
      }

      toast.success('Task saved')
      await invalidateGoalViews()
      return true
    }

    const { error } = await supabase.from('tasks').insert({
      title: payload.title,
      description: payload.description,
      notes: payload.notes,
      time: payload.time,
      end_time: payload.end_time,
      task_type: payload.task_type,
      category_id: payload.categoryId || null,
      goal_id: goalId,
      date: payload.dateISO,
      status: dbStatus,
      priority: payload.priority,
      links: payload.links,
      recurrence: payload.recurrence,
      user_id: user?.id,
    })

    if (error) {
      toast.error('Failed to add task')
      return false
    }

    toast.success('Task added')
    await invalidateGoalViews()
    return true
  }

  async function handleGoalUpdate(values: {
    title: string
    description: string | null
    start_date: string | null
    end_date: string | null
    color: string | null
    status?: Goal['status']
  }) {
    if (!goal) return false

    try {
      await updateGoal(goal.id, {
        title: values.title,
        description: values.description,
        start_date: values.start_date,
        end_date: values.end_date,
        color: values.color,
        status: values.status,
      })
      await invalidateGoalViews()
      toast.success('Goal updated')
      return true
    } catch {
      toast.error('Failed to update goal')
      return false
    }
  }

  return (
    <div className="content-wrap">
      <div className="mb-5">
        <Link to="/goals" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Goals
        </Link>
      </div>

      {isLoading ? (
        <div className="panel p-6 text-sm text-slate-500">Loading goal...</div>
      ) : !goal ? (
        <div className="panel p-6 text-sm text-slate-500">Goal not found.</div>
      ) : (
        <>
          <section className="panel p-6 mb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold text-slate-800 truncate">{goal.title}</h1>
                <p className="text-sm text-slate-500 mt-1">{formatDateRange(goal.start_date, goal.end_date)}</p>
                <span className={`inline-flex mt-3 text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(goal.status)}`}>
                  {statusLabel(goal.status)}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEditingGoal(true)}
                className="inline-flex items-center gap-1 h-10 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-1">
                <span>{goal.completed_task_count ?? 0} / {goal.task_count ?? 0} tasks complete</span>
                <span>{goal.progress ?? 0}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, Math.max(0, goal.progress ?? 0))}%` }}
                />
              </div>
            </div>
          </section>

          <section className="panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Tasks</h2>
              <button
                type="button"
                onClick={openCreateTask}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-3.5 h-3.5" />
                Add task to this goal
              </button>
            </div>

            {tasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks linked to this goal yet.</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-slate-100 bg-white">
                    <TaskRow task={task} onToggle={toggleTask} onOpen={openEditTask} />
                    <div className="px-4 pb-3 text-xs text-slate-500">{formatTaskDate(task.date)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <AddTaskModal
            isOpen={taskModalOpen}
            mode={taskModalMode}
            defaultDateISO={todayStr}
            defaultTaskType="task"
            defaultGoalId={goal.id}
            lockGoalId
            task={taskModalTask}
            categories={categories}
            onClose={() => {
              setTaskModalOpen(false)
              setTaskModalTask(null)
              setTaskModalMode('create')
            }}
            onSubmit={handleTaskSubmit}
          />

          <GoalFormModal
            isOpen={editingGoal}
            mode="edit"
            initialGoal={goal}
            onClose={() => setEditingGoal(false)}
            onSubmit={handleGoalUpdate}
          />
        </>
      )}
    </div>
  )
}
