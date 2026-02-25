import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useAllTasks } from './useAllTasks'
import { useTasks } from './useTasks'
import {
  addDays,
  buildAutoBalanceMoves,
  buildCompletionReview,
  buildWeekDays,
  getFocusQueue,
  getOverdueTasks,
  getWeekCapacity,
  toISODate,
} from '../lib/planning'
import type { Task } from '../types'

export function usePlanningCockpit() {
  const today = useMemo(() => new Date(), [])
  const todayISO = toISODate(today)
  const [anchorDate, setAnchorDate] = useState(today)
  const [dailyCapacity, setDailyCapacity] = useState(4)
  const [carryDateISO, setCarryDateISO] = useState(todayISO)

  const { tasks, loading, refetch } = useAllTasks()
  const { bulkReschedule, bulkMoveToBacklog, updateTaskStatus, addTask } = useTasks(
    anchorDate.getFullYear(),
    anchorDate.getMonth(),
  )

  const weekDays = useMemo(() => buildWeekDays(anchorDate), [anchorDate])
  const weekCapacity = useMemo(
    () => getWeekCapacity(tasks, weekDays, dailyCapacity),
    [dailyCapacity, tasks, weekDays],
  )
  const overdueTasks = useMemo(() => getOverdueTasks(tasks, todayISO), [tasks, todayISO])
  const focusQueue = useMemo(() => getFocusQueue(tasks, todayISO, 10), [tasks, todayISO])
  const completionReview = useMemo(() => buildCompletionReview(tasks, todayISO, 8), [tasks, todayISO])

  const weekRangeLabel = useMemo(() => {
    const first = weekDays[0]
    const last = weekDays[weekDays.length - 1]
    return `${first.fullLabel} - ${last.fullLabel}`
  }, [weekDays])

  const moveWeek = useCallback((offset: number) => {
    setAnchorDate((previous) => addDays(previous, offset * 7))
  }, [])

  const resetToCurrentWeek = useCallback(() => {
    setAnchorDate(today)
  }, [today])

  const carryForwardOverdue = useCallback(async (taskIds: string[], targetDateISO: string) => {
    if (taskIds.length === 0) {
      toast.message('Select at least one overdue task')
      return false
    }

    const success = await bulkReschedule(taskIds, targetDateISO)
    if (!success) return false

    toast.success(`Carried forward ${taskIds.length} overdue task${taskIds.length === 1 ? '' : 's'}`)
    return true
  }, [bulkReschedule])

  const autoBalanceWeek = useCallback(async () => {
    const moves = buildAutoBalanceMoves(tasks, weekDays, dailyCapacity)
    if (moves.length === 0) {
      toast.message('Week is already balanced for current capacity')
      return 0
    }

    const grouped = new Map<string, string[]>()
    moves.forEach((move) => {
      const list = grouped.get(move.toDate) ?? []
      list.push(move.taskId)
      grouped.set(move.toDate, list)
    })

    let movedCount = 0
    for (const [toDate, ids] of grouped.entries()) {
      const success = await bulkReschedule(ids, toDate)
      if (success) movedCount += ids.length
    }

    if (movedCount > 0) {
      toast.success(`Balanced ${movedCount} task${movedCount === 1 ? '' : 's'} across the week`)
    }

    return movedCount
  }, [bulkReschedule, dailyCapacity, tasks, weekDays])

  const setTaskInProgress = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'inprogress')
  }, [updateTaskStatus])

  const setTaskDone = useCallback(async (taskId: string) => {
    await updateTaskStatus(taskId, 'done')
  }, [updateTaskStatus])

  const moveTaskToBacklog = useCallback(async (taskId: string) => {
    await bulkMoveToBacklog([taskId])
  }, [bulkMoveToBacklog])

  const scheduleTaskForDate = useCallback(async (taskId: string, dateISO: string) => {
    await bulkReschedule([taskId], dateISO)
  }, [bulkReschedule])

  const materializeNextOccurrence = useCallback(async (item: {
    task: Task
    nextDate: string | null
    hasScheduledSuccessor: boolean
  }) => {
    if (!item.nextDate) {
      toast.message('No future occurrence available for this recurrence rule')
      return false
    }

    if (item.hasScheduledSuccessor) {
      toast.message('Next occurrence is already scheduled')
      return false
    }

    const existing = tasks.find((task) => (
      task.source_task_id === item.task.id
      && task.date === item.nextDate
      && task.status !== 'done'
      && !task.deleted_at
    ))

    if (existing) {
      toast.message('Next occurrence is already present in your queue')
      return false
    }

    const created = await addTask(
      item.task.title,
      item.task.category_id ?? '',
      item.nextDate,
      item.task.priority,
      {
        description: item.task.description ?? null,
        notes: item.task.notes ?? null,
        time: item.task.time ?? null,
        links: item.task.links ?? [],
        status: 'todo',
        source_task_id: item.task.id,
        recurrence: null,
      },
    )

    if (!created) return false

    toast.success(`Next occurrence scheduled for ${item.nextDate}`)
    return true
  }, [addTask, tasks])

  return {
    loading,
    todayISO,
    tasks,
    weekDays,
    weekRangeLabel,
    weekCapacity,
    overdueTasks,
    focusQueue,
    completionReview,
    dailyCapacity,
    carryDateISO,
    setDailyCapacity,
    setCarryDateISO,
    moveWeek,
    resetToCurrentWeek,
    carryForwardOverdue,
    autoBalanceWeek,
    setTaskInProgress,
    setTaskDone,
    moveTaskToBacklog,
    scheduleTaskForDate,
    materializeNextOccurrence,
    refetch,
  }
}
