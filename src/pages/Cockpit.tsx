import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCockpit } from '../hooks/useCockpit'
import { useProfile } from '../hooks/useProfile'
import { useCategories } from '../hooks/useCategories'
import { updateHabitStreak } from '../hooks/useHabitStreak'
import { CockpitHeader } from '../components/cockpit/CockpitHeader'
import { HabitRow } from '../components/cockpit/HabitRow'
import { TaskRow } from '../components/cockpit/TaskRow'
import { AddTaskModal } from '../components/tasks/monthly/AddTaskModal'
import type { Task, TaskStatus, TaskLink, RecurrenceRule, TaskPriority, TaskType } from '../types'

type CalendarStatus = 'pending' | 'in_progress' | 'completed'

const CALENDAR_TO_DB_STATUS: Record<CalendarStatus, TaskStatus> = {
  pending: 'todo',
  in_progress: 'inprogress',
  completed: 'done',
}

function sortByTime(a: Task, b: Task): number {
  if (!a.time && !b.time) return 0
  if (!a.time) return 1
  if (!b.time) return -1
  return a.time.localeCompare(b.time)
}

export default function Cockpit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { habits, tasks, habitStreaks, isLoading, todayStr } = useCockpit()
  const { profile, updateStreak } = useProfile()
  const { categories } = useCategories()

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTask, setModalTask] = useState<Task | null>(null)
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create')
  const [defaultModalTaskType, setDefaultModalTaskType] = useState<TaskType>('task')
  const [nudgeVersion, setNudgeVersion] = useState(0)

  // Sorted lists
  const sortedHabits = [...habits].sort(sortByTime)
  const sortedTasks = [...tasks].sort((a, b) => {
    // inprogress first, then by time
    if (a.status === 'inprogress' && b.status !== 'inprogress') return -1
    if (b.status === 'inprogress' && a.status !== 'inprogress') return 1
    return sortByTime(a, b)
  })

  // Daily streak from profile
  const dailyStreak = profile?.streak?.current ?? 0

  // Habit counts for header
  const habitsDone = habits.filter((h) => h.status === 'done').length
  const habitsTotal = habits.length

  const getStreak = (habitId: string) =>
    habitStreaks.find((s) => s.task_id === habitId) ?? null

  const atRiskHabit = (() => {
    void nudgeVersion
    const currentHour = new Date().getHours()
    if (currentHour < 17) return null

    for (const habit of sortedHabits) {
      const streak = getStreak(habit.id)
      const currentStreak = streak?.current_streak ?? 0
      if (currentStreak < 7) continue
      if (habit.status === 'done') continue

      const dismissedKey = `dismissed_${habit.id}_${todayStr}`
      if (localStorage.getItem(dismissedKey) === '1') continue

      return { habit, currentStreak, dismissedKey }
    }

    return null
  })()

  // Toggle a habit done/todo
  async function toggleHabit(habitId: string, currentStatus: TaskStatus) {
    if (!user?.id) return
    const newStatus: TaskStatus = currentStatus === 'done' ? 'todo' : 'done'

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', habitId)

    if (error) {
      toast.error('Failed to update habit')
      return
    }

    await updateHabitStreak(habitId, newStatus, user.id)

    // Check 80% threshold for global daily streak
    const updatedDone = newStatus === 'done' ? habitsDone + 1 : habitsDone - 1
    if (habitsTotal > 0 && updatedDone / habitsTotal >= 0.8) {
      await updateStreak(todayStr)
    }

    queryClient.invalidateQueries({ queryKey: ['cockpit-habits', user.id] })
    queryClient.invalidateQueries({ queryKey: ['habit-streaks'] })
  }

  // Toggle a task done/todo
  async function toggleTask(taskId: string, currentStatus: TaskStatus) {
    if (!user?.id) return
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

    queryClient.invalidateQueries({ queryKey: ['cockpit-tasks', user.id] })
  }

  // Open modal to view/edit existing task
  function openTask(task: Task) {
    setModalTask(task)
    setModalMode('edit')
    setDefaultModalTaskType(task.task_type ?? 'task')
    setModalOpen(true)
  }

  // Open modal to create new task
  function openCreateTask() {
    setModalTask(null)
    setModalMode('create')
    setDefaultModalTaskType('task')
    setModalOpen(true)
  }

  function openCreateHabit() {
    setModalTask(null)
    setModalMode('create')
    setDefaultModalTaskType('habit')
    setModalOpen(true)
  }

  // Submit from AddTaskModal
  async function handleModalSubmit(payload: {
    title: string
    description: string | null
    notes: string | null
    time: string | null
    end_time: string | null
    task_type: TaskType
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
    if (!user?.id) return false
    const dbStatus = CALENDAR_TO_DB_STATUS[payload.status]

    if (modalTask) {
      // Edit existing task
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
          goal_id: payload.goal_id,
          date: payload.dateISO,
          status: dbStatus,
          priority: payload.priority,
          links: payload.links,
          recurrence: payload.recurrence,
          updated_at: new Date().toISOString(),
        })
        .eq('id', modalTask.id)

      if (error) {
        toast.error('Failed to save task')
        return false
      }

      toast.success('Task saved')
      queryClient.invalidateQueries({ queryKey: ['cockpit-tasks', user.id] })
      return true
    }

    // Create new task
    const { error } = await supabase.from('tasks').insert({
      title: payload.title,
      description: payload.description,
      notes: payload.notes,
      time: payload.time,
      end_time: payload.end_time,
      task_type: payload.task_type,
      category_id: payload.categoryId || null,
      goal_id: payload.goal_id,
      date: payload.dateISO ?? todayStr,
      status: dbStatus,
      priority: payload.priority,
      links: payload.links,
      recurrence: payload.recurrence,
      user_id: user.id,
    })

    if (error) {
      toast.error('Failed to add task')
      return false
    }

    toast.success('Task added')
    queryClient.invalidateQueries({ queryKey: ['cockpit-tasks', user.id] })
    return true
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <CockpitHeader
        dailyStreak={dailyStreak}
        habitsTotal={habitsTotal}
        habitsDone={habitsDone}
      />

      <div className="flex-1 px-6 py-6 space-y-8 max-w-2xl">
        {/* ── Habits ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Habits
            </h2>
            <button
              onClick={openCreateHabit}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add habit
            </button>
          </div>

          {atRiskHabit ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-semibold text-amber-800">
                ⚡ {atRiskHabit.habit.title} streak at risk - {atRiskHabit.currentStreak} days.
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                You haven&apos;t logged it yet today.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void toggleHabit(atRiskHabit.habit.id, atRiskHabit.habit.status)}
                  className="h-8 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-white hover:bg-amber-600"
                >
                  Mark done
                </button>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem(atRiskHabit.dismissedKey, '1')
                    setNudgeVersion((prev) => prev + 1)
                  }}
                  className="h-8 rounded-lg border border-amber-300 px-3 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                >
                  Dismiss
                </button>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            {sortedHabits.map((habit) => (
              <HabitRow
                key={habit.id}
                habit={habit}
                streak={getStreak(habit.id)}
                onToggle={toggleHabit}
              />
            ))}
            {sortedHabits.length === 0 && (
              <p className="text-sm text-slate-400 px-4 py-3">
                No habits scheduled for today. Add a recurring habit to get started.
              </p>
            )}
          </div>
        </section>

        {/* ── Today's Tasks ── */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Today
            </h2>
            <button
              onClick={openCreateTask}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add task
            </button>
          </div>
          <div className="space-y-2">
            {sortedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onOpen={openTask}
              />
            ))}
            {sortedTasks.length === 0 && (
              <p className="text-sm text-slate-400 px-4 py-3">
                Nothing scheduled for today.
              </p>
            )}
          </div>
        </section>
      </div>

      <AddTaskModal
        isOpen={modalOpen}
        mode={modalMode}
        defaultDateISO={todayStr}
        defaultTaskType={defaultModalTaskType}
        task={modalTask}
        categories={categories}
        onClose={() => {
          setModalOpen(false)
          setModalTask(null)
          setModalMode('create')
          setDefaultModalTaskType('task')
        }}
        onSubmit={handleModalSubmit}
      />
    </div>
  )
}
