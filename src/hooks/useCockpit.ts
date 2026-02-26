import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { expandRecurrence } from '../lib/recurrence'
import type { Task, HabitStreak } from '../types'

export function useCockpit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const todayStr = new Date().toISOString().split('T')[0]

  // Query 1: All habits for the user
  const { data: allHabits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['cockpit-habits', user?.id ?? 'anon'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user!.id)
        .eq('task_type', 'habit')
        .is('deleted_at', null)
      if (error) throw error
      return data as unknown as Task[]
    },
  })

  // Filter habits client-side to only those scheduled for today via recurrence
  const habits = useMemo(() => {
    const today = new Date(todayStr)
    const tomorrow = new Date(todayStr)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return allHabits.filter((habit) => {
      if (!habit.recurrence || !habit.date) return false
      const dates = expandRecurrence(habit.date, habit.recurrence, today, tomorrow)
      return dates.includes(todayStr)
    })
  }, [allHabits, todayStr])

  // Query 2: Today's scheduled tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['cockpit-tasks', user?.id ?? 'anon', todayStr],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select(TASK_SELECT)
        .eq('user_id', user!.id)
        .eq('task_type', 'task')
        .eq('date', todayStr)
        .is('deleted_at', null)
      if (error) throw error
      return data as unknown as Task[]
    },
  })

  // Habit IDs for streak query
  const habitIds = useMemo(() => habits.map((h) => h.id), [habits])

  // Query 3: Habit streaks
  const { data: habitStreaks = [] } = useQuery({
    queryKey: ['habit-streaks', habitIds],
    enabled: habitIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_streaks')
        .select('*')
        .in('task_id', habitIds)
      if (error) throw error
      return data as HabitStreak[]
    },
  })

  // Realtime subscription for task changes
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`cockpit-tasks-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cockpit-habits', user.id] })
          queryClient.invalidateQueries({ queryKey: ['cockpit-tasks', user.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  return {
    habits,
    tasks,
    habitStreaks,
    isLoading: habitsLoading || tasksLoading,
    todayStr,
  }
}
