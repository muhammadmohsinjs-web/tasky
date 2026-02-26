import { supabase } from '../lib/supabase'
import type { RecurrenceRule, TaskStatus } from '../types'

function getYesterday(dateStr: string): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function updateHabitStreak(
  taskId: string,
  newStatus: TaskStatus,
  userId: string,
  _recurrence?: RecurrenceRule | null,
): Promise<void> {
  const today = new Date().toISOString().split('T')[0]

  const { data: existing } = await supabase
    .from('habit_streaks')
    .select('*')
    .eq('task_id', taskId)
    .maybeSingle()

  const current = existing ?? {
    task_id: taskId,
    user_id: userId,
    current_streak: 0,
    longest_streak: 0,
    last_completed_date: null,
  }

  if (newStatus === 'done') {
    const yesterday = getYesterday(today)
    let newCurrent = current.current_streak

    if (current.last_completed_date === yesterday) {
      newCurrent += 1
    } else if (current.last_completed_date === today) {
      // Already counted today.
      return
    } else {
      newCurrent = 1
    }

    const newLongest = Math.max(newCurrent, current.longest_streak)

    await supabase.from('habit_streaks').upsert({
      task_id: taskId,
      user_id: userId,
      current_streak: newCurrent,
      longest_streak: newLongest,
      last_completed_date: today,
    })
    return
  }

  // Unchecking (todo): only undo if it was completed today.
  if (current.last_completed_date !== today) return

  const newCurrent = Math.max(0, current.current_streak - 1)
  const yesterday = getYesterday(today)

  await supabase.from('habit_streaks').upsert({
    task_id: taskId,
    user_id: userId,
    current_streak: newCurrent,
    longest_streak: current.longest_streak,
    last_completed_date: newCurrent === 0 ? null : yesterday,
  })
}
