import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import type { Task, TaskStatus, TaskPriority, TaskLink } from '../types'

export function useBacklogTasks() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = useMemo(() => ['tasks', 'backlog'] as const, [])

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

    invalidate()
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

    invalidate()
    toast.success(`${items.length} tasks added to backlog`)
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

    invalidate()
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
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)

    if (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to save task')
      return
    }

    if ((updates.date !== undefined && updates.date !== null) || updates.category_id !== undefined) {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task saved')
      return
    }

    invalidate()
    toast.success('Task saved')
  }

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }

    invalidate()
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

    invalidate()
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

    invalidate()
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

    queryClient.invalidateQueries({ queryKey: ['tasks'] })
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} scheduled`)
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
