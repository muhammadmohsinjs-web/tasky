import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { GOAL_SELECT } from '../lib/constants'
import { useAuth } from '../contexts/AuthContext'
import type { Goal } from '../types'

interface GoalProgressRow {
  goal_id: string | null
  status: string
}

export function useGoals() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const queryKey = ['goals', user?.id ?? 'anon']

  const { data: goals = [], isLoading } = useQuery({
    queryKey,
    enabled: !!user?.id,
    queryFn: async () => {
      const [{ data: goalsData, error: goalsError }, { data: taskRows, error: taskError }] = await Promise.all([
        supabase
          .from('goals')
          .select(GOAL_SELECT)
          .eq('user_id', user!.id)
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true }),
        supabase
          .from('tasks')
          .select('goal_id,status')
          .eq('user_id', user!.id)
          .not('goal_id', 'is', null)
          .is('deleted_at', null),
      ])

      if (goalsError) throw goalsError
      if (taskError) throw taskError

      const progressMap = new Map<string, { total: number; done: number }>()

      for (const row of (taskRows as GoalProgressRow[] | null) ?? []) {
        if (!row.goal_id) continue
        const current = progressMap.get(row.goal_id) ?? { total: 0, done: 0 }
        current.total += 1
        if (row.status === 'done') current.done += 1
        progressMap.set(row.goal_id, current)
      }

      return ((goalsData as Goal[] | null) ?? []).map((goal) => {
        const stats = progressMap.get(goal.id) ?? { total: 0, done: 0 }
        const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

        return {
          ...goal,
          task_count: stats.total,
          completed_task_count: stats.done,
          progress,
        }
      })
    },
  })

  const createGoal = async (payload: {
    title: string
    description?: string | null
    start_date?: string | null
    end_date?: string | null
    color?: string | null
    status?: Goal['status']
  }) => {
    if (!user?.id) return null

    const { data, error } = await supabase
      .from('goals')
      .insert({
        user_id: user.id,
        title: payload.title.trim(),
        description: payload.description ?? null,
        start_date: payload.start_date ?? null,
        end_date: payload.end_date ?? null,
        color: payload.color ?? null,
        status: payload.status ?? 'active',
      })
      .select(GOAL_SELECT)
      .single()

    if (error) {
      throw error
    }

    await queryClient.invalidateQueries({ queryKey })
    return data as Goal
  }

  const updateGoal = async (
    goalId: string,
    updates: Partial<Pick<Goal, 'title' | 'description' | 'start_date' | 'end_date' | 'color' | 'status'>>,
  ) => {
    const { error } = await supabase
      .from('goals')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)

    if (error) {
      throw error
    }

    await queryClient.invalidateQueries({ queryKey })
    return true
  }

  return {
    goals,
    isLoading,
    createGoal,
    updateGoal,
    refetch: () => queryClient.invalidateQueries({ queryKey }),
  }
}
