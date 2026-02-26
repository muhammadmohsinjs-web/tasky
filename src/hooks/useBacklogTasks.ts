import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { confirmAction } from '../lib/confirm'
import { countLabel, statusLabel } from './taskShared'
import type { Task, TaskStatus, TaskPriority, TaskLink, RecurrenceRule, TaskType } from '../types'

export function useBacklogTasks() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = useMemo(() => ['tasks', user?.id ?? 'anon', 'backlog'] as const, [user?.id])

  const { data: tasks = [], isLoading: loading, error } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .is('date', null)
        .is('deleted_at', null)
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
          queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
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
    if (!user?.id) return
    queryClient.invalidateQueries({ queryKey: ['tasks', user.id] })
  }, [queryClient, user?.id])

  const logTaskActivity = useCallback(async (params: {
    actionType: 'soft_delete' | 'bulk_soft_delete' | 'restore'
    taskId?: string | null
    payload: Record<string, unknown>
    expiresAt?: string | null
  }) => {
    if (!user?.id) return

    const { error } = await supabase.from('task_activity_log').insert({
      user_id: user.id,
      task_id: params.taskId ?? null,
      action_type: params.actionType,
      action_payload: params.payload,
      expires_at: params.expiresAt ?? null,
    })

    if (error) {
      console.error('Failed to write task activity log:', error)
    }
  }, [user?.id])

  const addTask = async (
    title: string,
    categoryId: string,
    priority: TaskPriority = 'medium',
    extras?: {
      description?: string | null
      notes?: string | null
      time?: string | null
      end_time?: string | null
      task_type?: TaskType
      goal_id?: string | null
      status?: TaskStatus
      links?: TaskLink[]
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
    }
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
      end_time: extras?.end_time ?? null,
      task_type: extras?.task_type ?? 'task',
      goal_id: extras?.goal_id ?? null,
      links: extras?.links ?? [],
      recurrence: extras?.recurrence ?? null,
      source_task_id: extras?.source_task_id ?? null,
      completed_at: null,
      deleted_at: null,
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
      .update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null })
      .eq('id', id)
      .is('deleted_at', null)

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
      end_time?: string | null
      task_type?: TaskType
      goal_id?: string | null
      category_id?: string | null
      date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
      links?: TaskLink[]
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
    }
  ) => {
    const task = tasks.find((t) => t.id === id)

    let query = supabase.from('tasks').update(updates).eq('id', id)
    query = query.is('deleted_at', null)
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

  const restoreTasks = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: null, updated_at: new Date().toISOString() })
      .in('id', ids)

    if (error) {
      console.error('Failed to restore tasks:', error)
      toast.error('Failed to undo delete')
      return false
    }

    await logTaskActivity({
      actionType: 'restore',
      payload: { task_ids: ids },
    })
    invalidateAllTasks()
    toast.success(`${countLabel(ids.length)} restored`)
    return true
  }, [invalidateAllTasks, logTaskActivity])

  const deleteTask = async (id: string, options?: { skipConfirm?: boolean }) => {
    if (!options?.skipConfirm) {
      const taskTitle = tasks.find((task) => task.id === id)?.title
      const confirmed = confirmAction(taskTitle ? `Delete "${taskTitle}"?` : 'Delete this task?')
      if (!confirmed) return
    }

    const deletedAt = new Date().toISOString()
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: deletedAt })
      .eq('id', id)
      .is('deleted_at', null)

    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }

    await logTaskActivity({
      actionType: 'soft_delete',
      taskId: id,
      payload: { task_id: id, deleted_at: deletedAt },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    invalidateAllTasks()
    toast('Task deleted', {
      action: {
        label: 'Undo',
        onClick: () => {
          void restoreTasks([id])
        },
      },
    })
  }

  const bulkUpdateStatus = async (ids: string[], newStatus: TaskStatus) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .in('id', ids)
      .is('deleted_at', null)

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

    const deletedAt = new Date().toISOString()
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: deletedAt })
      .in('id', ids)
      .is('deleted_at', null)

    if (error) {
      console.error('Failed to bulk delete tasks:', error)
      toast.error('Failed to delete tasks')
      return false
    }

    await logTaskActivity({
      actionType: 'bulk_soft_delete',
      payload: { task_ids: ids, deleted_at: deletedAt },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    })
    invalidateAllTasks()
    toast(`${countLabel(ids.length)} deleted`, {
      action: {
        label: 'Undo',
        onClick: () => {
          void restoreTasks(ids)
        },
      },
    })
    return true
  }

  const scheduleTasks = async (ids: string[], date: string) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)
      .is('deleted_at', null)

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
    error: error ? (error as Error).message : null,
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
