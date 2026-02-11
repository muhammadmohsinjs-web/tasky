import type { Task, Category, TaskStatus } from '../../types'
import { TaskItem } from './TaskItem'
import { AddTaskInline } from './AddTaskInline'
import { CheckCircle2 } from 'lucide-react'
import { STATUS_CONFIG } from '../../lib/constants'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

interface Props {
  year: number
  month: number
  tasks: Task[]
  categories: Category[]
  onAdd: (title: string, categoryId: string, date: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onUpdate: (id: string, updates: { title?: string; category_id?: string | null }) => void
  onDelete: (id: string) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
}

export function Calendar({
  year,
  month,
  tasks,
  categories,
  onAdd,
  onStatusChange,
  onUpdate,
  onDelete,
  onSelect,
}: Props) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const tasksByDate: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!task.date) continue
    if (!tasksByDate[task.date]) tasksByDate[task.date] = []
    tasksByDate[task.date].push(task)
  }

  const today = new Date()
  const todayFull = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  const todayStr =
    today.getFullYear() === year && today.getMonth() === month
      ? todayFull
      : null

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div className="w-full animate-fade-in">
      <div className="grid grid-cols-7 mb-3">
        {DAY_NAMES.map((d, i) => (
          <div
            key={d}
            className={`text-xs font-bold text-center py-2.5 tracking-wider uppercase ${
              i === 0 || i === 6 ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-slate-200/80 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80">
        {cells.map((day, i) => {
          const colIndex = i % 7
          const isWeekend = colIndex === 0 || colIndex === 6

          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="bg-slate-50/80 min-h-[150px]"
              />
            )
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const isToday = dateStr === todayStr
          const doneCount = dayTasks.filter((t) => t.status === 'done').length
          const hasAllDone = dayTasks.length > 0 && doneCount === dayTasks.length

          return (
            <div
              key={dateStr}
              className={`min-h-[150px] p-2.5 flex flex-col transition-colors ${
                isToday
                  ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200/50'
                  : isWeekend
                    ? 'bg-slate-50/50'
                    : 'bg-white'
              } hover:bg-slate-50/80`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`text-sm font-bold leading-none ${
                    isToday
                      ? 'bg-indigo-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md'
                      : isWeekend
                        ? 'text-slate-400'
                        : 'text-slate-600'
                  }`}
                >
                  {day}
                </span>
                <div className="flex items-center gap-1">
                  {dayTasks.length > 0 && !hasAllDone && (
                    <div className="flex gap-1">
                      {(['todo', 'inprogress', 'done'] as TaskStatus[]).map((s) => {
                        const count = dayTasks.filter((t) => t.status === s).length
                        if (count === 0) return null
                        return (
                          <div
                            key={s}
                            className={`w-2 h-2 rounded-full ${STATUS_CONFIG[s].dot}`}
                            title={`${count} ${STATUS_CONFIG[s].label}`}
                          />
                        )
                      })}
                    </div>
                  )}
                  {hasAllDone && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1 task-scroll overflow-y-auto max-h-[130px]">
                {dayTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onStatusChange={onStatusChange}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onSelect={onSelect}
                    categories={categories}
                  />
                ))}
              </div>

              {dateStr >= todayFull && (
                <AddTaskInline date={dateStr} onAdd={onAdd} categories={categories} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
