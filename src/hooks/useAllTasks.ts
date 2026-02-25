import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TASK_SELECT } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import type { Task } from '../types'

export function useAllTasks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['tasks', user?.id ?? 'anon', 'all']

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .is('deleted_at', null)
        .order('date', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data as unknown as Task[]
    },
  })

  return { tasks, loading, refetch: () => queryClient.invalidateQueries({ queryKey }) }
}
