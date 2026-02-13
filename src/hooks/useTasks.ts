import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus, TaskPriority } from '../types'

const TASK_SELECT = 'id,title,description,notes,category_id,date,status,priority,links,created_at, category:categories(id,name,slug,color,accent,short_label,icon,sort_order,created_at)'

export function useTasks(year: number, month: number) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const endDate =
      month === 11
        ? `${year + 1}-01-01`
        : `${year}-${String(month + 2).padStart(2, '0')}-01`

    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .gte('date', startDate)
      .lt('date', endDate)
      .order('created_at', { ascending: true })
      .abortSignal(signal)

    // Don't update state if request was aborted
    if (signal?.aborted) return

    if (error) {
      console.error('Failed to fetch tasks:', error)
    } else {
      setTasks(data as unknown as Task[])
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    const abortController = new AbortController()
    fetchTasks(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchTasks])

  const addTask = async (title: string, categoryId: string, date: string | null, priority: TaskPriority = 'medium') => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, category_id: categoryId, date, status: 'todo' as TaskStatus, priority })
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add task:', error)
      toast.error('Failed to add task')
      return
    }
    setTasks((prev) => [...prev, data as unknown as Task])
    toast.success('Task added')
  }

  const addTasks = async (items: { title: string; categoryId: string; date: string; priority?: TaskPriority }[]) => {
    const rows = items.map((t) => ({
      title: t.title,
      category_id: t.categoryId,
      date: t.date,
      status: 'todo' as TaskStatus,
      priority: t.priority ?? 'medium',
    }))

    const { data, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to add tasks:', error)
      toast.error('Failed to add tasks')
      return
    }
    setTasks((prev) => [...prev, ...(data as unknown as Task[])])
    toast.success(`${items.length} tasks added`)
  }

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    // Deep clone the entire task object for proper rollback
    const oldTask = JSON.parse(JSON.stringify(task))

    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Failed to update task status:', error)
      toast.error('Failed to update task status')
      // Rollback to the full old task state
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? oldTask : t))
      )
    }
  }

  const updateTask = async (
    id: string,
    updates: {
      title?: string
      description?: string | null
      notes?: string | null
      category_id?: string | null
      date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
    }
  ) => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to save task')
      return
    }
    toast.success('Task saved')
    if (updates.date || updates.category_id) {
      await fetchTasks()
      return
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }
    setTasks((prev) => prev.filter((t) => t.id !== id))
    toast.success('Task deleted')
  }

  const bulkUpdateStatus = async (ids: string[], status: TaskStatus) => {
    // Deep clone affected tasks for proper rollback
    const oldTasks = JSON.parse(JSON.stringify(tasks.filter((t) => ids.includes(t.id))))
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, status } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk update status:', error)
      toast.error('Failed to update tasks')
      // Rollback to the full old task states
      setTasks((prev) =>
        prev.map((t) => {
          const old = oldTasks.find((o: Task) => o.id === t.id)
          return old || t
        })
      )
      return
    }
    const label = status === 'done' ? 'Done' : status === 'inprogress' ? 'In Progress' : 'To Do'
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} marked as ${label}`)
  }

  const bulkReschedule = async (ids: string[], date: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk reschedule:', error)
      toast.error('Failed to reschedule tasks')
      return
    }
    await fetchTasks()
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} rescheduled`)
  }

  const bulkMoveToBacklog = async (ids: string[]) => {
    const { error } = await supabase
      .from('tasks')
      .update({ date: null })
      .in('id', ids)

    if (error) {
      console.error('Failed to move tasks to backlog:', error)
      toast.error('Failed to move tasks to backlog')
      return
    }
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} moved to backlog`)
  }

  const bulkDelete = async (ids: string[]) => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk delete tasks:', error)
      toast.error('Failed to delete tasks')
      return
    }
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} deleted`)
  }

  return { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask, bulkUpdateStatus, bulkReschedule, bulkMoveToBacklog, bulkDelete, refetch: fetchTasks }
}
