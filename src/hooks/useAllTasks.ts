import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TASK_SELECT } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import type { Task, RecurrenceRule } from '../types'

export function useAllTasks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['tasks', user?.id ?? 'anon', 'all']

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: taskRows, error: taskError }, { data: habitRows, error: habitError }] = await Promise.all([
        supabase
          .from('tasks')
          .select(TASK_SELECT)
          .is('deleted_at', null)
          .eq('task_type', 'task')
          .order('date', { ascending: false, nullsFirst: false }),
        supabase
          .from('habits')
          .select('id,user_id,title,category_id,date,time,end_time,recurrence,status,completed_at,deleted_at,created_at,updated_at')
          .eq('user_id', user!.id),
      ])

      if (taskError) throw taskError
      if (habitError) throw habitError

      const mappedHabits = ((habitRows as Array<Record<string, unknown>> | null) ?? [])
        .filter((habit) => habit.deleted_at == null)
        .map((habit) => ({
          ...habit,
          task_type: 'habit',
          priority: 'medium',
          status: habit.status === 'done' ? 'done' : 'todo',
          recurrence: (habit.recurrence as RecurrenceRule | null) ?? { frequency: 'daily', interval: 1, end_date: null },
          links: [],
          notes: null,
          description: null,
        })) as unknown as Task[]

      return [...((taskRows as unknown as Task[]) ?? []), ...mappedHabits]
    },
  })

  return { tasks, loading, refetch: () => queryClient.invalidateQueries({ queryKey }) }
}
