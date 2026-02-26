import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { GOAL_SELECT, TASK_SELECT } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import type { Goal, Task } from '../types'

export function useGoalDetail(goalId: string | undefined) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['goal-detail', goalId ?? 'none']

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!user?.id && !!goalId,
    queryFn: async () => {
      const [{ data: goalData, error: goalError }, { data: tasksData, error: tasksError }] = await Promise.all([
        supabase
          .from('goals')
          .select(GOAL_SELECT)
          .eq('id', goalId)
          .eq('user_id', user!.id)
          .single(),
        supabase
          .from('tasks')
          .select(TASK_SELECT)
          .eq('goal_id', goalId)
          .is('deleted_at', null)
          .order('date', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true }),
      ])

      if (goalError) throw goalError
      if (tasksError) throw tasksError

      const tasks = (tasksData as unknown as Task[] | null) ?? []
      const taskCount = tasks.length
      const completedTaskCount = tasks.filter((task) => task.status === 'done').length
      const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0

      const goal: Goal = {
        ...(goalData as Goal),
        task_count: taskCount,
        completed_task_count: completedTaskCount,
        progress,
      }

      return { goal, tasks }
    },
  })

  return {
    goal: data?.goal ?? null,
    tasks: data?.tasks ?? [],
    isLoading,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  }
}
