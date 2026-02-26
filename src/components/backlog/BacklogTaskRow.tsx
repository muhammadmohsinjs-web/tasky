import { useState } from 'react'
import { CalendarDays, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import type { Goal, Task } from '../../types'

interface BacklogTaskRowProps {
  task: Task
  goals: Goal[]
  onSchedule: (taskId: string, date: string) => Promise<void>
  onLinkGoal: (taskId: string, goalId: string | null) => Promise<void>
  onEdit: (task: Task) => void
  onDelete: (taskId: string) => Promise<void>
}

export function BacklogTaskRow({ task, goals, onSchedule, onLinkGoal, onEdit, onDelete }: BacklogTaskRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)

  const linkedGoalTitle = task.goal?.title ?? null

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{task.title}</p>
          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
            {linkedGoalTitle ? (
              <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                {linkedGoalTitle}
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-medium">No goal</span>
            )}
            {task.priority ? <span className="uppercase tracking-wide">{task.priority}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setScheduleOpen((prev) => !prev)}
            className="inline-flex items-center gap-1 h-8 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            Schedule
          </button>

          <select
            value={task.goal_id ?? ''}
            onChange={(event) => {
              const nextValue = event.target.value
              void onLinkGoal(task.id, nextValue || null)
            }}
            className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs text-slate-700"
          >
            <option value="">No goal</option>
            {goals.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.title}
              </option>
            ))}
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50"
              aria-label="More actions"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {menuOpen ? (
              <div className="absolute right-0 mt-1 w-32 rounded-lg border border-slate-200 bg-white shadow-md z-10">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onEdit(task)
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    void onDelete(task.id)
                  }}
                  className="w-full px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 inline-flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {scheduleOpen ? (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
          <input
            type="date"
            className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm text-slate-700"
            onChange={(event) => {
              const date = event.target.value
              if (!date) return
              void onSchedule(task.id, date)
              setScheduleOpen(false)
            }}
          />
          <button
            type="button"
            onClick={() => setScheduleOpen(false)}
            className="h-9 rounded-lg border border-slate-300 px-2.5 text-xs font-semibold text-slate-600"
          >
            Cancel
          </button>
        </div>
      ) : null}
    </div>
  )
}
