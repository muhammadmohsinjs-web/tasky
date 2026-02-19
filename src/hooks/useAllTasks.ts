import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { TASK_SELECT } from '../lib/constants'
import type { Task } from '../types'

export function useAllTasks() {
  const queryClient = useQueryClient()
  const queryKey = ['tasks', 'all']

  const { data: tasks = [], isLoading: loading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .order('date', { ascending: false, nullsFirst: false })

      if (error) throw error
      return data as unknown as Task[]
    },
  })

  return { tasks, loading, refetch: () => queryClient.invalidateQueries({ queryKey }) }
}
