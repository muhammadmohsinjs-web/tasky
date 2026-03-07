import { useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { TASK_SELECT } from '../lib/constants'
import { expandRecurrence, formatDateStr } from '../lib/recurrence'
import type { Task, HabitStreak, RecurrenceRule } from '../types'

export function useCockpit() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const todayStr = formatDateStr(new Date())

  // Query 1: All habits for the user
  const { data: allHabits = [], isLoading: habitsLoading } = useQuery({
    queryKey: ['cockpit-habits', user?.id ?? 'anon'],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('id,user_id,title,category_id,date,time,end_time,recurrence,status,completed_at,deleted_at,created_at,updated_at,category:categories(id,name,slug,color,accent,short_label,icon,sort_order,created_at,applies_to)')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
      if (error) throw error
      return ((data as Array<Record<string, unknown>> | null) ?? []).map((habit) => ({
        ...habit,
        task_type: 'habit',
        priority: 'medium',
        status: habit.status === 'done' ? 'done' : 'todo',
        recurrence: (habit.recurrence as RecurrenceRule | null) ?? { frequency: 'daily', interval: 1, end_date: null },
      })) as unknown as Task[]
    },
  })

  // Filter habits client-side to only those scheduled for today via recurrence
  const habits = useMemo(() => {
    const [year, month, day] = todayStr.split('-').map(Number)
    const today = new Date(year, month - 1, day)
    const tomorrow = new Date(year, month - 1, day)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return allHabits.filter((habit) => {
      const anchorDate = habit.date ?? habit.created_at?.slice(0, 10) ?? todayStr
      const fallbackVisible = anchorDate <= todayStr
      const recurrence = habit.recurrence ?? { frequency: 'daily', interval: 1, end_date: null }

      if (!recurrence || typeof recurrence !== 'object' || !('frequency' in recurrence)) {
        return fallbackVisible
      }

      try {
        const safeRule = {
          frequency: recurrence.frequency ?? 'daily',
          interval: Math.max(1, recurrence.interval ?? 1),
          end_date: recurrence.end_date ?? null,
          ...(Array.isArray(recurrence.days_of_week) ? { days_of_week: recurrence.days_of_week } : {}),
          ...(recurrence.count ? { count: recurrence.count } : {}),
        }
        const dates = expandRecurrence(anchorDate, safeRule, today, tomorrow)
        return dates.includes(todayStr) || (dates.length === 0 && fallbackVisible)
      } catch {
        return fallbackVisible
      }
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habits',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['cockpit-habits', user.id] })
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
