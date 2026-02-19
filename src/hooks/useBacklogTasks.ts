import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import type { Task, TaskStatus, TaskPriority, TaskLink } from '../types'

export function useBacklogTasks() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = ['tasks', 'backlog']

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .is('date', null)
        .order('created_at', { ascending: false })
        .abortSignal(signal)

      if (error) throw error
      return data as unknown as Task[]
    },
  })

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient])

  const addTask = async (
    title: string,
    categoryId: string,
    priority: TaskPriority = 'medium',
    extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }
  ) => {
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
    queryClient.setQueryData<Task[]>(queryKey, (old) => [created, ...(old ?? [])])
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
    queryClient.setQueryData<Task[]>(queryKey, (old) => [...(data as unknown as Task[]), ...(old ?? [])])
    toast.success(`${items.length} tasks added to backlog`)
  }

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const oldTask = JSON.parse(JSON.stringify(task))

    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Failed to update task status:', error)
      toast.error('Failed to update task status')
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? oldTask : t))
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
    if ((updates.date !== undefined && updates.date !== null) || updates.category_id !== undefined) {
      invalidate()
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => t.id !== id))
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
    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (ids.includes(t.id) ? { ...t, status: newStatus } : t))
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
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => !ids.includes(t.id)))
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
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => !ids.includes(t.id)))
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} scheduled`)
  }

  return { tasks, loading, addTask, addTasks, updateTaskStatus, updateTask, deleteTask, bulkUpdateStatus, bulkDelete, scheduleTasks, refetch: invalidate }
}
