import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import type { Task, TaskStatus, TaskPriority, TaskLink } from '../types'

export function useBacklogTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchTasks = useCallback(async (signal?: AbortSignal) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .is('date', null)
      .order('created_at', { ascending: false })
      
      .abortSignal(signal as AbortSignal)

    if (signal?.aborted) return

    if (error) {
      console.error('Failed to fetch backlog tasks:', error)
    } else {
      setTasks(data as unknown as Task[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    const abortController = new AbortController()
    fetchTasks(abortController.signal)

    return () => {
      abortController.abort()
    }
  }, [fetchTasks])

  const addTask = async (title: string, categoryId: string, priority: TaskPriority = 'medium', extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        category_id: categoryId || null,
        date: null,
        status: extras?.status ?? ('todo' as TaskStatus),
        priority,
        user_id: user?.id,
        description: extras?.description ?? null,
        notes: extras?.notes ?? null,
        links: extras?.links ?? [],
      })
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add backlog task:', error)
      toast.error('Failed to add task')
      return null
    }
    const created = data as unknown as Task
    setTasks((prev) => [created, ...prev])
    toast.success('Task added to backlog')
    return created
  }

  const addTasks = async (items: { title: string; categoryId: string; priority?: TaskPriority }[]) => {
    const rows = items.map((t) => ({
      title: t.title,
      category_id: t.categoryId || null,
      date: null,
      status: 'todo' as TaskStatus,
      priority: t.priority ?? 'medium',
      user_id: user?.id,
    }))

    const { data, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to add backlog tasks:', error)
      toast.error('Failed to add tasks')
      return
    }
    setTasks((prev) => [...(data as unknown as Task[]), ...prev])
    toast.success(`${items.length} tasks added to backlog`)
  }

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
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
    // If date was assigned, task leaves backlog — refetch to remove it
    // Also refetch on category changes to get the joined category object
    if ((updates.date !== undefined && updates.date !== null) || updates.category_id !== undefined) {
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

  const bulkUpdateStatus = async (ids: string[], newStatus: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk update status:', error)
      toast.error('Failed to update tasks')
      return
    }
    setTasks((prev) =>
      prev.map((t) => (ids.includes(t.id) ? { ...t, status: newStatus } : t))
    )
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} updated`)
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

  const scheduleTasks = async (ids: string[], date: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)

    if (error) {
      console.error('Failed to schedule tasks:', error)
      toast.error('Failed to schedule tasks')
      return
    }
    setTasks((prev) => prev.filter((t) => !ids.includes(t.id)))
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} scheduled`)
  }

  return { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask, bulkUpdateStatus, bulkDelete, scheduleTasks, refetch: fetchTasks }
}
