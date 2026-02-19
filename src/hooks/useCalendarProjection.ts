import { useMemo } from 'react'
import { expandRecurrence } from '../lib/recurrence'
import type { Task } from '../types'

export function useCalendarProjection(
  tasks: Task[],
  year: number,
  month: number
): Task[] {
  return useMemo(() => {
    const monthStart = new Date(year, month, 1)
    const monthEnd = new Date(year, month + 1, 0)

    const recurringTemplates = tasks.filter((t) => t.recurrence != null && t.date != null)
    const projectedWithRealTasks = [...tasks]

    const projectedInstances: Task[] = []

    for (const task of recurringTemplates) {
      const dates = expandRecurrence(
        task.date!,
        task.recurrence!,
        monthStart,
        monthEnd
      )

      for (const dateStr of dates) {
        // Template task already represents its own start-date occurrence.
        if (dateStr === task.date) continue

        // Skip if a real task already exists for this source+date
        const realExists = tasks.some(
          (t) => t.source_task_id === task.id && t.date === dateStr
        )
        if (realExists) continue

        projectedInstances.push({
          ...task,
          id: `projected-${task.id}-${dateStr}`,
          date: dateStr,
          is_projected: true,
          source_task_id: task.id,
          status: 'todo',
        })
      }
    }

    projectedWithRealTasks.push(...projectedInstances)
    return projectedWithRealTasks
  }, [tasks, year, month])
}
