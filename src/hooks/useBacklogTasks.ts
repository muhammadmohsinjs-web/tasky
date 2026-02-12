import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus } from '../types'

const TASK_SELECT = 'id,title,description,notes,category_id,date,status,created_at, category:categories(id,name,slug,color,accent,short_label,created_at)'

export function useBacklogTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .is('date', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch backlog tasks:', error)
    } else {
      setTasks(data as unknown as Task[])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async (title: string, categoryId: string) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, category_id: categoryId, date: null, status: 'todo' as TaskStatus })
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add backlog task:', error)
      toast.error('Failed to add task')
      return
    }
    setTasks((prev) => [data as unknown as Task, ...prev])
    toast.success('Task added to backlog')
  }

  const addTasks = async (items: { title: string; categoryId: string }[]) => {
    const rows = items.map((t) => ({
      title: t.title,
      category_id: t.categoryId,
      date: null,
      status: 'todo' as TaskStatus,
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
    const oldStatus = task.status

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
        prev.map((t) => (t.id === id ? { ...t, status: oldStatus } : t))
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
    if (updates.date !== undefined && updates.date !== null) {
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

  return { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask, scheduleTasks, refetch: fetchTasks }
}
