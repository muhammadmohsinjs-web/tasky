import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import type { Task, TaskStatus } from '../types'

const TASK_SELECT = 'id,title,description,notes,category_id,date,status,created_at, category:categories(id,name,slug,color,accent,short_label,created_at)'

export function useTasks(year: number, month: number) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
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

    if (error) {
      console.error('Failed to fetch tasks:', error)
    } else {
      setTasks(data as unknown as Task[])
    }
    setLoading(false)
  }, [year, month])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const addTask = async (title: string, categoryId: string, date: string | null) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ title, category_id: categoryId, date, status: 'todo' as TaskStatus })
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

  const addTasks = async (items: { title: string; categoryId: string; date: string }[]) => {
    const rows = items.map((t) => ({
      title: t.title,
      category_id: t.categoryId,
      date: t.date,
      status: 'todo' as TaskStatus,
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

  return { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask }
}
