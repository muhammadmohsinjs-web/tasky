import { useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { confirmAction } from '../lib/confirm'
import type { Task, TaskStatus, TaskPriority, TaskLink, RecurrenceRule } from '../types'

export function useTasks(year: number, month: number) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = useMemo(() => ['tasks', year, month] as const, [year, month])
  const countLabel = (count: number) => `${count} ${count === 1 ? 'task' : 'tasks'}`
  const statusLabel = (status: TaskStatus) => (status === 'done' ? 'Done' : status === 'inprogress' ? 'In Progress' : 'To Do')

  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDate =
    month === 11
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 2).padStart(2, '0')}-01`

  const { data: tasks = [], isLoading: loading, error } = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .not('date', 'is', null)
        .lt('date', endDate)
        .or(`and(end_date.is.null,date.gte.${startDate}),end_date.gte.${startDate}`)
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

  const invalidateAllTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tasks'] })
  }, [queryClient])

  const getActiveGoogleConnection = useCallback(async () => {
    if (!user?.id) return null

    const { data, error } = await supabase
      .from('calendar_connections')
      .select('id,google_calendar_id,sync_enabled')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .maybeSingle()

    if (error) {
      console.error('Failed to fetch calendar connection:', error)
      return null
    }

    return data as { id: string; google_calendar_id: string; sync_enabled: boolean } | null
  }, [user?.id])

  const computeEventWindow = useCallback((task: Task) => {
    if (!task.date) return null

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
    const normalizedTime = task.time?.trim() ?? ''
    const timedMatch = normalizedTime.match(/^([01]\d|2[0-3]):([0-5]\d)$/)

    if (timedMatch) {
      const hours = Number(timedMatch[1])
      const minutes = Number(timedMatch[2])
      const start = new Date(`${task.date}T00:00:00`)
      start.setHours(hours, minutes, 0, 0)
      const end = new Date(start.getTime() + 60 * 60 * 1000)

      return {
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        is_all_day: false,
        timezone,
      }
    }

    const start = new Date(`${task.date}T00:00:00`)
    const endDateBase = task.end_date ?? task.date
    const end = new Date(`${endDateBase}T00:00:00`)
    end.setDate(end.getDate() + 1)

    return {
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      is_all_day: true,
      timezone,
    }
  }, [])

  const enqueueOutboxJob = useCallback(async (params: {
    operation: 'upsert' | 'delete'
    task: Task
    eventId: string
    calendarId: string
  }) => {
    if (!user?.id) return

    const dedupeKey = `${params.operation}:${params.task.id}:${params.eventId}:${Date.now()}:${crypto.randomUUID()}`

    const { error } = await supabase.from('calendar_sync_outbox').insert({
      user_id: user.id,
      provider: 'google',
      event_id: params.eventId,
      operation: params.operation,
      payload: {
        task_id: params.task.id,
        event_id: params.eventId,
        title: params.task.title,
        description: params.task.description ?? null,
        notes: params.task.notes ?? null,
        date: params.task.date,
        end_date: params.task.end_date ?? null,
        time: params.task.time ?? null,
        calendar_id: params.calendarId,
      },
      dedupe_key: dedupeKey,
      status: 'queued',
    })

    if (error) {
      console.error('Failed to enqueue calendar sync job:', error)
    }
  }, [user?.id])

  const upsertTaskEventAndQueue = useCallback(async (task: Task) => {
    if (!user?.id || !task.date) return

    const eventWindow = computeEventWindow(task)
    if (!eventWindow) return

    const { data: existingLink, error: linkError } = await supabase
      .from('task_event_links')
      .select('id,event_id')
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .maybeSingle()

    if (linkError) {
      console.error('Failed to fetch task event link:', linkError)
      return
    }

    const eventPayload = {
      user_id: user.id,
      title: task.title,
      description: task.notes ?? task.description ?? null,
      start_at: eventWindow.start_at,
      end_at: eventWindow.end_at,
      is_all_day: eventWindow.is_all_day,
      timezone: eventWindow.timezone,
      source: 'task',
      status: 'confirmed',
    }

    let eventId: string | null = existingLink?.event_id ?? null

    if (eventId) {
      const { error } = await supabase
        .from('events')
        .update(eventPayload)
        .eq('id', eventId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Failed to update linked event:', error)
        return
      }
    } else {
      const { data: insertedEvent, error: insertEventError } = await supabase
        .from('events')
        .insert(eventPayload)
        .select('id')
        .single()

      if (insertEventError || !insertedEvent?.id) {
        console.error('Failed to create linked event:', insertEventError)
        return
      }

      eventId = insertedEvent.id as string

      const { error: linkInsertError } = await supabase
        .from('task_event_links')
        .insert({
          user_id: user.id,
          task_id: task.id,
          event_id: eventId,
          relation_type: 'scheduled_from_task',
        })

      if (linkInsertError) {
        console.error('Failed to create task event link:', linkInsertError)
        return
      }
    }

    if (!eventId) return

    const connection = await getActiveGoogleConnection()
    if (!connection?.sync_enabled) return

    await enqueueOutboxJob({
      operation: 'upsert',
      task,
      eventId,
      calendarId: connection.google_calendar_id,
    })
  }, [computeEventWindow, enqueueOutboxJob, getActiveGoogleConnection, user?.id])

  const unlinkTaskEventAndQueueDelete = useCallback(async (task: Task) => {
    if (!user?.id) return

    const { data: existingLink, error: linkError } = await supabase
      .from('task_event_links')
      .select('id,event_id')
      .eq('user_id', user.id)
      .eq('task_id', task.id)
      .maybeSingle()

    if (linkError) {
      console.error('Failed to fetch task event link:', linkError)
      return
    }

    if (!existingLink?.event_id) return

    const eventId = existingLink.event_id as string

    const { error: cancelError } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', eventId)
      .eq('user_id', user.id)

    if (cancelError) {
      console.error('Failed to cancel linked event:', cancelError)
    }

    const { error: unlinkError } = await supabase
      .from('task_event_links')
      .delete()
      .eq('id', existingLink.id)
      .eq('user_id', user.id)

    if (unlinkError) {
      console.error('Failed to unlink task event:', unlinkError)
      return
    }

    const connection = await getActiveGoogleConnection()
    if (!connection?.sync_enabled) return

    await enqueueOutboxJob({
      operation: 'delete',
      task,
      eventId,
      calendarId: connection.google_calendar_id,
    })
  }, [enqueueOutboxJob, getActiveGoogleConnection, user?.id])

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
    const normalizedTitle = title.trim()
    if (!normalizedTitle) {
      toast.error('Title is required')
      return null
    }

    const row = {
      title: normalizedTitle,
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

    const { data, error } = await supabase
      .from('tasks')
      .insert(row)
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add task:', error)
      toast.error('Failed to add task')
      return null
    }

    invalidateAllTasks()
    await upsertTaskEventAndQueue(data as unknown as Task)
    toast.success('Task added')
    return data as unknown as Task
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

    const { data, error } = await supabase
      .from('tasks')
      .insert(rows)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to add tasks:', error)
      toast.error('Failed to add tasks')
      return
    }

    invalidateAllTasks()
    const insertedTasks = (data as unknown as Task[]) ?? []
    await Promise.all(insertedTasks.map((task) => upsertTaskEventAndQueue(task)))
    toast.success(`${countLabel(items.length)} added`)
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
      end_date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
      links?: TaskLink[]
      sort_order?: number
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
    }
  ) => {
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
      return false
    }

    if (!data || data.length === 0) {
      toast.error('This task was modified elsewhere. Refreshing...')
      invalidateAllTasks()
      return false
    }

    invalidateAllTasks()
    const updatedTask = (data as unknown as Task[])[0]
    if (updatedTask) {
      if (updatedTask.date) {
        await upsertTaskEventAndQueue(updatedTask)
      } else {
        await unlinkTaskEventAndQueueDelete(updatedTask)
      }
    }
    toast.success('Task saved')
    return true
  }

  const deleteTask = async (id: string, options?: { skipConfirm?: boolean }) => {
    if (!options?.skipConfirm) {
      const taskTitle = tasks.find((task) => task.id === id)?.title
      const confirmed = confirmAction(taskTitle ? `Delete "${taskTitle}"?` : 'Delete this task?')
      if (!confirmed) return
    }

    const taskToDelete = tasks.find((task) => task.id === id)
    if (taskToDelete) {
      await unlinkTaskEventAndQueueDelete(taskToDelete)
    }

    const { error } = await supabase.from('tasks').delete().eq('id', id)

    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }

    invalidateAllTasks()
    toast.success('Task deleted')
  }

  const bulkUpdateStatus = async (ids: string[], status: TaskStatus) => {
    if (ids.length === 0) return false

    const { error } = await supabase
      .from('tasks')
      .update({ status })
      .in('id', ids)

    if (error) {
      console.error('Failed to bulk update status:', error)
      toast.error('Failed to update tasks')
      return false
    }

    invalidateAllTasks()
    toast.success(`${countLabel(ids.length)} marked as ${statusLabel(status)}`)
    return true
  }

  const bulkReschedule = async (ids: string[], date: string) => {
    if (ids.length === 0) return false

    const { data, error } = await supabase
      .from('tasks')
      .update({ date })
      .in('id', ids)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to bulk reschedule:', error)
      toast.error('Failed to reschedule tasks')
      return false
    }

    invalidateAllTasks()
    const updatedTasks = (data as unknown as Task[]) ?? []
    await Promise.all(updatedTasks.map((task) => upsertTaskEventAndQueue(task)))
    toast.success(`${countLabel(ids.length)} rescheduled`)
    return true
  }

  const bulkMoveToBacklog = async (ids: string[]) => {
    if (ids.length === 0) return false

    const { data, error } = await supabase
      .from('tasks')
      .update({ date: null })
      .in('id', ids)
      .select(TASK_SELECT)

    if (error) {
      console.error('Failed to move tasks to backlog:', error)
      toast.error('Failed to move tasks to backlog')
      return false
    }

    invalidateAllTasks()
    const updatedTasks = (data as unknown as Task[]) ?? []
    await Promise.all(updatedTasks.map((task) => unlinkTaskEventAndQueueDelete(task)))
    toast.success(`${countLabel(ids.length)} moved to backlog`)
    return true
  }

  const bulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return false

    const confirmed = confirmAction(`Delete ${ids.length} ${ids.length === 1 ? 'task' : 'tasks'}?`)
    if (!confirmed) return false

    const { data: tasksToDelete, error: tasksToDeleteError } = await supabase
      .from('tasks')
      .select(TASK_SELECT)
      .in('id', ids)

    if (tasksToDeleteError) {
      console.error('Failed to load tasks before bulk delete:', tasksToDeleteError)
      toast.error('Failed to delete tasks')
      return false
    }

    await Promise.all(((tasksToDelete as unknown as Task[]) ?? []).map((task) => unlinkTaskEventAndQueueDelete(task)))

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

  const reorderTasks = async (_dateStr: string, orderedIds: string[]) => {
    const updates = orderedIds.map((id, index) =>
      supabase.from('tasks').update({ sort_order: index }).eq('id', id)
    )

    const results = await Promise.all(updates)
    const hasError = results.some((res) => res.error)

    if (hasError) {
      console.error('Failed to reorder tasks:', results)
      toast.error('Failed to reorder tasks')
      return
    }

    invalidateAllTasks()
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
    bulkReschedule,
    bulkMoveToBacklog,
    bulkDelete,
    reorderTasks,
    refetch: invalidate,
  }
}
