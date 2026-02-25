import { describe, expect, it } from 'vitest'
import type { Task } from '../../types'
import {
  buildAutoBalanceMoves,
  buildCompletionReview,
  buildWeekDays,
  getFocusQueue,
  getWeekCapacity,
} from '../planning'

function taskFactory(partial: Partial<Task>): Task {
  return {
    id: partial.id ?? crypto.randomUUID(),
    title: partial.title ?? 'Task',
    description: partial.description ?? null,
    notes: partial.notes ?? null,
    time: partial.time ?? null,
    category_id: partial.category_id ?? null,
    date: partial.date ?? null,
    end_date: partial.end_date ?? null,
    recurrence: partial.recurrence ?? null,
    status: partial.status ?? 'todo',
    priority: partial.priority ?? 'medium',
    links: partial.links ?? [],
    created_at: partial.created_at ?? '2026-02-01T00:00:00.000Z',
    updated_at: partial.updated_at,
    completed_at: partial.completed_at ?? null,
    deleted_at: partial.deleted_at ?? null,
    source_task_id: partial.source_task_id ?? null,
  }
}

describe('buildWeekDays', () => {
  it('returns seven days anchored to week start', () => {
    const days = buildWeekDays(new Date('2026-02-25T00:00:00.000Z'))
    expect(days).toHaveLength(7)
    expect(days[0].iso).toBe('2026-02-22')
    expect(days[6].iso).toBe('2026-02-28')
  })
})

describe('getFocusQueue', () => {
  it('prioritizes overdue urgent tasks over backlog tasks', () => {
    const tasks = [
      taskFactory({ id: 'backlog', title: 'Backlog', date: null, priority: 'high' }),
      taskFactory({ id: 'overdue', title: 'Overdue', date: '2026-02-20', priority: 'urgent' }),
      taskFactory({ id: 'today', title: 'Today', date: '2026-02-25', priority: 'medium' }),
    ]

    const queue = getFocusQueue(tasks, '2026-02-25', 3)
    expect(queue[0].task.id).toBe('overdue')
    expect(queue[0].reason).toContain('Overdue')
  })
})

describe('getWeekCapacity', () => {
  it('calculates open and overflow counts per day', () => {
    const week = buildWeekDays(new Date('2026-02-25T00:00:00.000Z'))
    const tasks = [
      taskFactory({ date: week[1].iso, status: 'todo' }),
      taskFactory({ date: week[1].iso, status: 'inprogress' }),
      taskFactory({ date: week[1].iso, status: 'done' }),
    ]

    const rows = getWeekCapacity(tasks, week, 1)
    expect(rows[1].openCount).toBe(2)
    expect(rows[1].completedCount).toBe(1)
    expect(rows[1].overflow).toBe(1)
  })
})

describe('buildAutoBalanceMoves', () => {
  it('moves overflow tasks forward into available days', () => {
    const week = buildWeekDays(new Date('2026-02-25T00:00:00.000Z'))
    const tasks = [
      taskFactory({ id: 'a', date: week[0].iso, priority: 'low' }),
      taskFactory({ id: 'b', date: week[0].iso, priority: 'medium' }),
      taskFactory({ id: 'c', date: week[0].iso, priority: 'urgent' }),
    ]

    const moves = buildAutoBalanceMoves(tasks, week, 2)
    expect(moves).toHaveLength(1)
    expect(moves[0].taskId).toBe('a')
    expect(moves[0].toDate).toBe(week[1].iso)
  })
})

describe('buildCompletionReview', () => {
  it('proposes next recurrence date for completed recurring task', () => {
    const recurring = taskFactory({
      id: 'rec',
      date: '2026-02-20',
      status: 'done',
      completed_at: '2026-02-20T08:00:00.000Z',
      recurrence: {
        frequency: 'weekly',
        interval: 1,
      },
    })

    const review = buildCompletionReview([recurring], '2026-02-25')
    expect(review).toHaveLength(1)
    expect(review[0].nextDate).toBe('2026-02-27')
    expect(review[0].hasScheduledSuccessor).toBe(false)
  })
})
