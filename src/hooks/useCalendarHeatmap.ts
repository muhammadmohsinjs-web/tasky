import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { expandRecurrence, formatDateStr } from '../lib/recurrence'
import type { Task } from '../types'

export interface HeatmapDay {
  total: number
  done: number
  pct: number | null
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)
  return { start, end }
}

function toMonthDayKeys(year: number, month: number): string[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => {
    const date = new Date(year, month, index + 1)
    return formatDateStr(date)
  })
}

export function useCalendarHeatmap(year: number, month: number) {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data = {}, isLoading } = useQuery({
    queryKey: ['calendar-heatmap', user?.id ?? 'anon', year, month],
    enabled: !!user?.id,
    queryFn: async () => {
      const { start, end } = monthRange(year, month)
      const nextMonthStart = new Date(year, month + 1, 1)
      const monthStartKey = formatDateStr(start)
      const nextMonthStartKey = formatDateStr(nextMonthStart)

      const [{ data: monthTasks, error: monthTaskError }, { data: habitTasks, error: habitError }] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user!.id)
          .eq('task_type', 'task')
          .is('deleted_at', null)
          .gte('date', monthStartKey)
          .lt('date', nextMonthStartKey),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user!.id)
          .eq('task_type', 'habit')
          .is('deleted_at', null),
      ])

      if (monthTaskError) throw monthTaskError
      if (habitError) throw habitError

      const dayMap: Record<string, HeatmapDay> = {}
      for (const dayKey of toMonthDayKeys(year, month)) {
        dayMap[dayKey] = { total: 0, done: 0, pct: null }
      }

      for (const task of (monthTasks as Task[] | null) ?? []) {
        if (!task.date || !dayMap[task.date]) continue
        dayMap[task.date].total += 1
        if (task.status === 'done') {
          dayMap[task.date].done += 1
        }
      }

      for (const habit of (habitTasks as Task[] | null) ?? []) {
        if (!habit.date || !habit.recurrence) continue
        const occurrences = expandRecurrence(habit.date, habit.recurrence, start, end)

        for (const dayKey of occurrences) {
          if (!dayMap[dayKey]) continue
          dayMap[dayKey].total += 1
          if (habit.status === 'done') {
            dayMap[dayKey].done += 1
          }
        }
      }

      for (const key of Object.keys(dayMap)) {
        const entry = dayMap[key]
        entry.pct = entry.total > 0 ? entry.done / entry.total : null
      }

      return dayMap
    },
  })

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`calendar-heatmap-${user.id}-${year}-${month}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['calendar-heatmap', user.id, year, month] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [month, queryClient, user?.id, year])

  return {
    data,
    isLoading,
  }
}
