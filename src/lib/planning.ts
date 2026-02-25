import { expandRecurrence } from './recurrence'
import type { Task, TaskPriority } from '../types'

export interface WeekDay {
  date: Date
  iso: string
  shortLabel: string
  fullLabel: string
}

export interface WeekCapacityRow {
  dateISO: string
  dayLabel: string
  openCount: number
  completedCount: number
  capacity: number
  overflow: number
}

export interface FocusQueueItem {
  task: Task
  score: number
  reason: string
}

export interface CompletionReviewItem {
  task: Task
  completedDate: string
  nextDate: string | null
  hasScheduledSuccessor: boolean
  summary: string
}

export interface WeekMove {
  taskId: string
  fromDate: string
  toDate: string
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  urgent: 4,
}

export function toISODate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function startOfWeek(date: Date): Date {
  const local = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  local.setDate(local.getDate() - local.getDay())
  return local
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export function buildWeekDays(anchorDate: Date): WeekDay[] {
  const weekStart = startOfWeek(anchorDate)
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(weekStart, index)
    return {
      date,
      iso: toISODate(date),
      shortLabel: date.toLocaleDateString('en-US', { weekday: 'short' }),
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
    }
  })
}

function focusScore(task: Task, todayISO: string): number {
  if (task.status === 'done' || task.deleted_at) return Number.NEGATIVE_INFINITY

  let score = PRIORITY_WEIGHT[task.priority] * 25

  if (task.status === 'inprogress') score += 35
  if (!task.date) score += 20

  if (task.date) {
    if (task.date < todayISO) score += 140
    else if (task.date === todayISO) score += 100
    else {
      const daysAway = Math.round((parseISODate(task.date).getTime() - parseISODate(todayISO).getTime()) / (24 * 60 * 60 * 1000))
      if (daysAway <= 2) score += 45
      else if (daysAway <= 7) score += 20
    }
  }

  if (task.recurrence) score += 10
  if (task.source_task_id) score += 5

  return score
}

function focusReason(task: Task, todayISO: string): string {
  if (task.date && task.date < todayISO) return 'Overdue priority work'
  if (task.status === 'inprogress') return 'Already in progress'
  if (task.priority === 'urgent' || task.priority === 'high') return 'High-impact priority'
  if (!task.date) return 'Backlog candidate for scheduling'
  if (task.date === todayISO) return 'Scheduled for today'
  return 'Best next execution candidate'
}

export function getOverdueTasks(tasks: Task[], todayISO: string): Task[] {
  return tasks
    .filter((task) => task.date && task.date < todayISO && task.status !== 'done' && !task.deleted_at)
    .sort((a, b) => {
      if ((a.date ?? '') !== (b.date ?? '')) return (a.date ?? '').localeCompare(b.date ?? '')
      return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]
    })
}

export function getFocusQueue(tasks: Task[], todayISO: string, limit = 8): FocusQueueItem[] {
  return tasks
    .filter((task) => task.status !== 'done' && !task.deleted_at)
    .map((task) => ({ task, score: focusScore(task, todayISO), reason: focusReason(task, todayISO) }))
    .filter((item) => Number.isFinite(item.score))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return a.task.created_at.localeCompare(b.task.created_at)
    })
    .slice(0, limit)
}

export function getWeekCapacity(tasks: Task[], weekDays: WeekDay[], dailyCapacity: number): WeekCapacityRow[] {
  return weekDays.map((day) => {
    const openCount = tasks.filter((task) => task.date === day.iso && task.status !== 'done' && !task.deleted_at).length
    const completedCount = tasks.filter((task) => task.date === day.iso && task.status === 'done' && !task.deleted_at).length
    return {
      dateISO: day.iso,
      dayLabel: day.shortLabel,
      openCount,
      completedCount,
      capacity: dailyCapacity,
      overflow: Math.max(0, openCount - dailyCapacity),
    }
  })
}

export function buildAutoBalanceMoves(tasks: Task[], weekDays: WeekDay[], dailyCapacity: number): WeekMove[] {
  const weekSet = new Set(weekDays.map((day) => day.iso))
  const openByDay = new Map<string, Task[]>()
  const capacityLeft = new Map<string, number>()

  weekDays.forEach((day) => {
    const open = tasks
      .filter((task) => task.date === day.iso && task.status !== 'done' && !task.deleted_at)
      .sort((a, b) => {
        const aWeight = PRIORITY_WEIGHT[a.priority] + (a.status === 'inprogress' ? 3 : 0)
        const bWeight = PRIORITY_WEIGHT[b.priority] + (b.status === 'inprogress' ? 3 : 0)
        if (aWeight !== bWeight) return aWeight - bWeight
        return b.created_at.localeCompare(a.created_at)
      })

    openByDay.set(day.iso, open)
    capacityLeft.set(day.iso, Math.max(0, dailyCapacity - open.length))
  })

  const moves: WeekMove[] = []

  for (let index = 0; index < weekDays.length; index += 1) {
    const fromDate = weekDays[index].iso
    const open = openByDay.get(fromDate) ?? []
    const overflow = Math.max(0, open.length - dailyCapacity)
    if (overflow === 0) continue

    const movable = open.slice(0, overflow)
    for (const task of movable) {
      let destination: string | null = null

      for (let nextIndex = index + 1; nextIndex < weekDays.length; nextIndex += 1) {
        const candidateDate = weekDays[nextIndex].iso
        if (!weekSet.has(candidateDate)) continue
        const free = capacityLeft.get(candidateDate) ?? 0
        if (free > 0) {
          destination = candidateDate
          capacityLeft.set(candidateDate, free - 1)
          break
        }
      }

      if (!destination) break

      moves.push({
        taskId: task.id,
        fromDate,
        toDate: destination,
      })
    }
  }

  return moves
}

function nextRecurringDateAfter(task: Task, afterISO: string): string | null {
  if (!task.date || !task.recurrence) return null

  const rangeStart = parseISODate(afterISO)
  const rangeEnd = addDays(rangeStart, 365)
  const expanded = expandRecurrence(task.date, task.recurrence, rangeStart, rangeEnd)
  return expanded.find((dateISO) => dateISO > afterISO) ?? null
}

export function buildCompletionReview(tasks: Task[], todayISO: string, limit = 6): CompletionReviewItem[] {
  const threshold = addDays(parseISODate(todayISO), -21)

  return tasks
    .filter((task) => task.status === 'done' && task.recurrence && task.date && !task.deleted_at)
    .map((task) => {
      const completedDate = task.completed_at?.slice(0, 10) ?? task.date!
      const nextDate = nextRecurringDateAfter(task, completedDate)
      const hasScheduledSuccessor = Boolean(
        nextDate
        && tasks.some((candidate) => (
          candidate.source_task_id === task.id
          && candidate.date === nextDate
          && candidate.status !== 'done'
          && !candidate.deleted_at
        ))
      )

      const summary = nextDate
        ? hasScheduledSuccessor
          ? `Next occurrence already scheduled for ${nextDate}`
          : `Next occurrence can be scheduled for ${nextDate}`
        : 'Recurrence rule has no future occurrence'

      return {
        task,
        completedDate,
        nextDate,
        hasScheduledSuccessor,
        summary,
      }
    })
    .filter((item) => parseISODate(item.completedDate) >= threshold)
    .sort((a, b) => b.completedDate.localeCompare(a.completedDate))
    .slice(0, limit)
}
