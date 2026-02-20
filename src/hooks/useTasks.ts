import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { enqueueTaskMutation } from '../lib/offlineQueue'
import type { Task, TaskStatus, TaskPriority, TaskLink, RecurrenceRule } from '../types'

function isOffline() {
  return typeof navigator !== 'undefined' && !navigator.onLine
}

export function useTasks(year: number, month: number) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = useMemo(() => ['tasks', year, month] as const, [year, month])

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, '0')}-01`

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .not('date', 'is', null)
        .lt('date', endDate)
        .or(`end_date.is.null,end_date.gte.${startDate}`)
        .gte('date', startDate)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
        .abortSignal(signal)

      if (error) throw error
      return data as unknown as Task[]
    },
  })

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`tasks-month-${year}-${month}-${user.id}`)
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
  }, [year, month, user?.id, queryClient])

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey])

  const addTask = async (
    title: string,
    categoryId: string,
    date: string | null,
    priority: TaskPriority = 'medium',
    extras?: {
      description?: string | null
      notes?: string | null
      time?: string | null
      status?: TaskStatus
      links?: TaskLink[]
      end_date?: string | null
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
      sort_order?: number
    }
  ) => {
    const row = {
      title,
      category_id: categoryId || null,
      date,
      status: extras?.status ?? ('todo' as TaskStatus),
      priority,
      user_id: user?.id,
      description: extras?.description ?? null,
      notes: extras?.notes ?? null,
      time: extras?.time ?? null,
      links: extras?.links ?? [],
      end_date: extras?.end_date ?? null,
      recurrence: extras?.recurrence ?? null,
      source_task_id: extras?.source_task_id ?? null,
      sort_order: extras?.sort_order ?? 0,
    }

    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'insert', payload: row })
      const optimistic: Task = {
        id: `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        ...row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        category: null,
      }
      queryClient.setQueryData<Task[]>(queryKey, (old) => [...(old ?? []), optimistic])
      toast.info('Saved offline. Will sync when you reconnect.')
      return optimistic
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(row)
      .select('id,created_at,updated_at')
      .single()

    if (error) {
      console.error('Failed to add task:', error)
      toast.error('Failed to add task')
      return null
    }
    const created = {
      ...(row as Omit<Task, 'id' | 'created_at' | 'updated_at' | 'category'>),
      id: data.id,
      created_at: data.created_at,
      updated_at: data.updated_at,
      category: null,
    } as Task
    queryClient.setQueryData<Task[]>(queryKey, (old) => [...(old ?? []), created])
    toast.success('Task added')
    return created
  }

  const addTasks = async (items: { title: string; categoryId: string; date: string; priority?: TaskPriority }[]) => {
    const rows = items.map((t) => ({
      title: t.title,
      category_id: t.categoryId || null,
      date: t.date,
      status: 'todo' as TaskStatus,
      priority: t.priority ?? 'medium',
      user_id: user?.id,
    }))

    if (isOffline()) {
      for (const row of rows) {
        await enqueueTaskMutation({ kind: 'insert', payload: row })
      }
      toast.info(`${items.length} tasks queued for sync`)
      return
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to add tasks:', error)
      toast.error('Failed to add tasks')
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) => [...(old ?? []), ...(data as unknown as Task[])])
    toast.success(`${items.length} tasks added`)
  }

  const updateTaskStatus = async (id: string, newStatus: TaskStatus) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return
    const oldTask = JSON.parse(JSON.stringify(task))

    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    )

    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'update', payload: { id, updates: { status: newStatus } } })
      toast.info('Status update queued for sync')
      return
    }

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
      time?: string | null
      category_id?: string | null
      date?: string | null
      end_date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
      links?: TaskLink[]
      sort_order?: number
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
    }
  ) => {
    if (isOffline()) {
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        (old ?? []).map((t) => (t.id === id ? { ...t, ...updates } : t))
      )
      await enqueueTaskMutation({ kind: 'update', payload: { id, updates } })
      toast.info('Task changes queued for sync')
      return
    }

    const task = tasks.find((t) => t.id === id)

    // Conflict detection: only update if updated_at matches
    let query = supabase.from('tasks').update(updates).eq('id', id)
    if (task?.updated_at) {
      query = query.eq('updated_at', task.updated_at)
    }

    const { data, error } = await query.select(TASK_SELECT)

    if (error) {
      console.error('Failed to update task:', error)
      toast.error('Failed to save task')
      return
    }

    if (!data || data.length === 0) {
      toast.error('This task was modified elsewhere. Refreshing...')
      invalidate()
      return
    }

    toast.success('Task saved')
    if (updates.date !== undefined || updates.category_id !== undefined) {
      invalidate()
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (t.id === id ? (data[0] as unknown as Task) : t))
    )
  }

  const deleteTask = async (id: string) => {
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => t.id !== id))

    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'delete', payload: { id } })
      toast.info('Task deletion queued for sync')
      return
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      invalidate()
      return
    }
    toast.success('Task deleted')
  }

  const bulkUpdateStatus = async (ids: string[], status: TaskStatus) => {
    const oldTasks = JSON.parse(JSON.stringify(tasks.filter((t) => ids.includes(t.id))))
    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (ids.includes(t.id) ? { ...t, status } : t))
    )

    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'bulk_update', payload: { ids, updates: { status } } })
      toast.info('Bulk status update queued for sync')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk update status:', error)
      toast.error('Failed to update tasks')
      queryClient.setQueryData<Task[]>(queryKey, (old) =>
        (old ?? []).map((t) => {
          const old_ = oldTasks.find((o: Task) => o.id === t.id)
          return old_ || t
        })
      )
      return
    }
    const label = status === 'done' ? 'Done' : status === 'inprogress' ? 'In Progress' : 'To Do'
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} marked as ${label}`)
  }

  const bulkReschedule = async (ids: string[], date: string) => {
    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'bulk_update', payload: { ids, updates: { date } } })
      toast.info('Reschedule queued for sync')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk reschedule:', error)
      toast.error('Failed to reschedule tasks')
      return
    }
    invalidate()
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} rescheduled`)
  }

  const bulkMoveToBacklog = async (ids: string[]) => {
    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'bulk_update', payload: { ids, updates: { date: null } } })
      queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => !ids.includes(t.id)))
      toast.info('Move to backlog queued for sync')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .update({ date: null })
      .in('id', ids)

    if (error) {
      console.error('Failed to move tasks to backlog:', error)
      toast.error('Failed to move tasks to backlog')
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => !ids.includes(t.id)))
    queryClient.invalidateQueries({ queryKey: ['tasks', 'backlog'] })
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} moved to backlog`)
  }

  const bulkDelete = async (ids: string[]) => {
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => !ids.includes(t.id)))

    if (isOffline()) {
      await enqueueTaskMutation({ kind: 'bulk_delete', payload: { ids } })
      toast.info('Bulk delete queued for sync')
      return
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk delete tasks:', error)
      toast.error('Failed to delete tasks')
      invalidate()
      return
    }
    toast.success(`${ids.length} ${ids.length === 1 ? 'task' : 'tasks'} deleted`)
  }

  const reorderTasks = async (_dateStr: string, orderedIds: string[]) => {
    queryClient.setQueryData<Task[]>(queryKey, (old) => {
      if (!old) return []
      const updated = [...old]
      orderedIds.forEach((id, index) => {
        const task = updated.find((t) => t.id === id)
        if (task) task.sort_order = index
      })
      return updated
    })

    if (isOffline()) {
      for (const [index, id] of orderedIds.entries()) {
        await enqueueTaskMutation({ kind: 'update', payload: { id, updates: { sort_order: index } } })
      }
      return
    }

    const updates = orderedIds.map((id, index) =>
      supabase.from('tasks').update({ sort_order: index }).eq('id', id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)

    if (hasError) {
      console.error('Failed to reorder tasks:', results)
      toast.error('Failed to reorder tasks')
      invalidate()
      return
    }
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
    bulkReschedule,
    bulkMoveToBacklog,
    bulkDelete,
    reorderTasks,
    refetch: invalidate,
  }
}
