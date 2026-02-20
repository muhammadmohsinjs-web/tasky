import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { confirmAction } from '../lib/confirm'
import type { Task, TaskStatus, TaskPriority, TaskLink } from '../types'

export function useBacklogTasks() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = useMemo(() => ['tasks', 'backlog'] as const, [])
  const countLabel = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`
  const statusLabel = (status: TaskStatus) => (status === 'done' ? 'Done' : status === 'inprogress' ? 'In Progress' : 'To Do')

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

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`tasks-backlog-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['tasks'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const invalidateAllTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [queryClient])

  const addTask = async (
    title: string,
    categoryId: string,
    priority: TaskPriority = 'medium',
    extras?: { description?: string | null; notes?: string | null; time?: string | null; status?: TaskStatus; links?: TaskLink[] }
  ) => {
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      toast.error('Title is required')
      return null
    }

    const row = {
      title: normalizedTitle,
      category_id: categoryId || null,
      date: null,
      status: extras?.status ?? ('todo' as TaskStatus),
      priority,
      user_id: user?.id,
      description: extras?.description ?? null,
      notes: extras?.notes ?? null,
      time: extras?.time ?? null,
      links: extras?.links ?? [],
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(row)
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add backlog task:', error)
      toast.error('Failed to add task')
      return null
    }

    invalidateAllTasks()
    toast.success('Task added to backlog')
    return data as unknown as Task
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

    const { error } = await supabase
      .from('tasks')
      .insert(rows)

    if (error) {
      console.error('Failed to add backlog tasks:', error)
      toast.error('Failed to add tasks')
      return
    }

    invalidateAllTasks()
    toast.success(`${countLabel(items.length)} added to backlog`)
  }

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) {
      console.error('Failed to update task status:', error)
      toast.error('Failed to update task status')
      return
    }

    invalidateAllTasks()
    toast.success(`Task marked as ${statusLabel(newStatus)}`)
  }

  const updateTask = async (
    id: string,
    updates: {
      title?: string
      description?: string | null
      notes?: string | null
      time?: string | null
      category_id?: string | null
      date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
      links?: TaskLink[]
    }
  ) => {
    const task = tasks.find((t) => t.id === id)

    let query = supabase.from('tasks').update(updates).eq('id', id)
    if (task?.updated_at) {
      query = query.eq('updated_at', task.updated_at)
    }

    const { data, error } = await query.select(TASK_SELECT)

    if (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to save task')
      return false
    }

    if (!data || data.length === 0) {
      toast.error('This task was modified elsewhere. Refreshing...')
      invalidateAllTasks()
      return false
    }

    invalidateAllTasks()
    toast.success('Task saved')
    return true
  }

  const deleteTask = async (id: string) => {
    const taskTitle = tasks.find((task) => task.id === id)?.title
    const confirmed = confirmAction(taskTitle ? `Delete "${taskTitle}"?` : 'Delete this task?')
    if (!confirmed) return

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }

    invalidateAllTasks()
    toast.success('Task deleted')
  }

  const bulkUpdateStatus = async (ids: string[], newStatus: TaskStatus) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk update status:', error)
      toast.error('Failed to update tasks')
      return false
    }

    invalidateAllTasks()
    toast.success(`${countLabel(ids.length)} marked as ${statusLabel(newStatus)}`)
    return true
  }

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return false

    const confirmed = confirmAction(`Delete ${ids.length} ${ids.length === 1 ? 'task' : 'tasks'}?`)
    if (!confirmed) return false

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk delete tasks:', error)
      toast.error('Failed to delete tasks')
      return false
    }

    invalidateAllTasks()
    toast.success(`${countLabel(ids.length)} deleted`)
    return true
  }

  const scheduleTasks = async (ids: string[], date: string) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)

    if (error) {
      console.error('Failed to schedule tasks:', error)
      toast.error('Failed to schedule tasks')
      return false
    }

    invalidateAllTasks()
    toast.success(`${countLabel(ids.length)} rescheduled`)
    return true
  }

  return {
    tasks,
    loading,
    addTask,
    addTasks,
    updateTaskStatus,
    updateTask,
    deleteTask,
    bulkUpdateStatus,
    bulkDelete,
    scheduleTasks,
    refetch: invalidate,
  }
}
