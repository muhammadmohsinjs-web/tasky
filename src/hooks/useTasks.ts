import { useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import type { Task, TaskStatus, TaskPriority, TaskLink, RecurrenceRule } from '../types'

export function useTasks(year: number, month: number) {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const queryKey = ['tasks', year, month]

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

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey })
  }, [queryClient, queryKey[0], year, month])

  const addTask = async (
    title: string,
    categoryId: string,
    date: string | null,
    priority: TaskPriority = 'medium',
    extras?: {
      description?: string | null
      notes?: string | null
      status?: TaskStatus
      links?: TaskLink[]
      end_date?: string | null
      recurrence?: RecurrenceRule | null
      source_task_id?: string | null
      sort_order?: number
    }
  ) => {
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title,
        category_id: categoryId || null,
        date,
        status: extras?.status ?? ('todo' as TaskStatus),
        priority,
        user_id: user?.id,
        description: extras?.description ?? null,
        notes: extras?.notes ?? null,
        links: extras?.links ?? [],
        end_date: extras?.end_date ?? null,
        recurrence: extras?.recurrence ?? null,
        source_task_id: extras?.source_task_id ?? null,
        sort_order: extras?.sort_order ?? 0,
      })
      .select(TASK_SELECT)
      .single()

    if (error) {
      console.error('Failed to add task:', error)
      toast.error('Failed to add task')
      return null
    }
    const created = data as unknown as Task
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
      end_date?: string | null
      status?: TaskStatus
      priority?: TaskPriority
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
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) {
      console.error('Failed to delete task:', error)
      toast.error('Failed to delete task')
      return
    }
    queryClient.setQueryData<Task[]>(queryKey, (old) => (old ?? []).filter((t) => t.id !== id))
    toast.success('Task deleted')
  }

  const bulkUpdateStatus = async (ids: string[], status: TaskStatus) => {
    const oldTasks = JSON.parse(JSON.stringify(tasks.filter((t) => ids.includes(t.id))))
    queryClient.setQueryData<Task[]>(queryKey, (old) =>
      (old ?? []).map((t) => (ids.includes(t.id) ? { ...t, status } : t))
    )

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

    const updates = orderedIds.map((id, index) =>
      supabase.from('tasks').update({ sort_order: index }).eq('id', id)
    )
    await Promise.all(updates)
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
