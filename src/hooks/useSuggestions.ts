import { useMemo } from 'react'
import type { Task } from '../types'

export interface SmartSuggestion {
  id: string
  title: string
  description: string
  action: 'open_backlog' | 'focus_today' | 'focus_overdue'
}

export function useSuggestions(tasks: Task[], backlogTasks: Task[]): SmartSuggestion[] {
  return useMemo(() => {
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const overdue = tasks.filter((task) => task.date && task.date < todayKey && task.status !== 'done')
    const dueTodayOpen = tasks.filter((task) => task.date === todayKey && task.status !== 'done')
    const urgentBacklog = backlogTasks.filter((task) => task.status !== 'done' && (task.priority === 'high' || task.priority === 'urgent'))

    const suggestions: SmartSuggestion[] = []

    if (overdue.length >= 3) {
      suggestions.push({
        id: 'overdue-batch',
        title: 'You have overdue carry-over',
        description: `${overdue.length} tasks are overdue. Triage them first to reduce context switching.`,
        action: 'focus_overdue',
      })
    }

    if (dueTodayOpen.length >= 5) {
      suggestions.push({
        id: 'today-focus',
        title: 'Today is overloaded',
        description: `${dueTodayOpen.length} open tasks are scheduled for today. Move low-priority items to backlog.`,
        action: 'focus_today',
      })
    }

    if (urgentBacklog.length > 0) {
      suggestions.push({
        id: 'urgent-backlog',
        title: 'High-priority backlog items waiting',
        description: `${urgentBacklog.length} high-priority backlog task${urgentBacklog.length === 1 ? '' : 's'} should be scheduled.`,
        action: 'open_backlog',
      })
    }

    return suggestions.slice(0, 3)
  }, [tasks, backlogTasks])
}
