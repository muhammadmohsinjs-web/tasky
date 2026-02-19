import { useCallback, useRef } from 'react'
import type { Task, Category, TaskStatus, TaskPriority, TaskLink } from '../../types'
import { TaskItem } from './TaskItem'
import { AddTaskInline } from './AddTaskInline'
import { CheckCircle2 } from 'lucide-react'
import { STATUS_CONFIG, MONTH_NAMES } from '../../lib/constants'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_TASKS = 3

interface Props {
  year: number
  month: number
  tasks: Task[]
  categories: Category[]
  onAdd: (title: string, categoryId: string, date: string, priority?: TaskPriority, extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => Promise<Task | null> | void
  onStatusChange: (id: string, status: TaskStatus) => void
  onUpdate: (id: string, updates: { title?: string; category_id?: string | null }) => void
  onDelete: (id: string) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  selectedDate?: string | null
  onDateSelect?: (date: string) => void
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
  selectedDate,
  onDateSelect,
}: Props) {
  const gridRef = useRef<HTMLDivElement>(null)
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

  const handleCellKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>, day: number, cellIndex: number) => {
    const totalCells = cells.length
    let targetIndex: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        e.preventDefault()
        targetIndex = cellIndex + 1 < totalCells ? cellIndex + 1 : null
        break
      case 'ArrowLeft':
        e.preventDefault()
        targetIndex = cellIndex - 1 >= 0 ? cellIndex - 1 : null
        break
      case 'ArrowDown':
        e.preventDefault()
        targetIndex = cellIndex + 7 < totalCells ? cellIndex + 7 : null
        break
      case 'ArrowUp':
        e.preventDefault()
        targetIndex = cellIndex - 7 >= 0 ? cellIndex - 7 : null
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          onDateSelect?.(dateStr)
        }
        return
    }

    if (targetIndex !== null && gridRef.current) {
      const targetCell = gridRef.current.querySelector(`[data-cell-index="${targetIndex}"]`) as HTMLElement | null
      targetCell?.focus()
    }
  }, [cells.length, year, month, onDateSelect])

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

      <div
        ref={gridRef}
        role="grid"
        aria-label={`Task calendar for ${MONTH_NAMES[month]} ${year}`}
        className="grid grid-cols-7 gap-px bg-slate-200/80 rounded-2xl overflow-hidden shadow-sm border border-slate-200/80"
      >
        {cells.map((day, i) => {
          const colIndex = i % 7
          const isWeekend = colIndex === 0 || colIndex === 6

          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="bg-slate-50/80 min-h-[150px]"
                role="gridcell"
                aria-disabled="true"
              />
            )
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const dayTasks = tasksByDate[dateStr] || []
          const isToday = dateStr === todayStr
          const isSelected = dateStr === selectedDate
          const doneCount = dayTasks.filter((t) => t.status === 'done').length
          const hasAllDone = dayTasks.length > 0 && doneCount === dayTasks.length
          const isOverdue = dateStr < todayFull && dayTasks.some(t => t.status !== 'done') && dayTasks.length > 0

          const visibleTasks = dayTasks.slice(0, MAX_VISIBLE_TASKS)
          const overflowCount = dayTasks.length - MAX_VISIBLE_TASKS

          const taskSummary = dayTasks.length > 0
            ? `${dayTasks.length} task${dayTasks.length !== 1 ? 's' : ''}${isOverdue ? ', has overdue' : ''}${hasAllDone ? ', all completed' : ''}`
            : 'no tasks'

          const cellLabel = `${MONTH_NAMES[month]} ${day}, ${taskSummary}`

          return (
            <div
              key={dateStr}
              role="gridcell"
              tabIndex={isToday ? 0 : -1}
              data-cell-index={i}
              aria-label={cellLabel}
              onClick={() => onDateSelect?.(dateStr)}
              onKeyDown={(e) => handleCellKeyDown(e, day, i)}
              className={`min-h-[150px] p-2.5 flex flex-col transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/80 ring-2 ring-inset ring-blue-400/40'
                  : isToday
                    ? 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-200/50'
                    : isOverdue
                      ? 'bg-red-50/40'
                      : isWeekend
                        ? 'bg-slate-50/50'
                        : 'bg-white'
              } hover:bg-slate-50/80 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 focus-visible:outline-none`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-sm font-bold leading-none ${
                      isToday
                        ? 'bg-indigo-500 text-white w-7 h-7 rounded-full flex items-center justify-center shadow-md'
                        : isOverdue
                          ? 'text-red-500'
                          : isWeekend
                            ? 'text-slate-400'
                            : 'text-slate-600'
                    }`}
                  >
                    {day}
                  </span>
                  {isOverdue && !isToday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" aria-hidden="true" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {dayTasks.length > 0 && !hasAllDone && (
                    <div className="flex gap-1" aria-hidden="true">
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
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-label="All tasks completed" />
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                {visibleTasks.map((task) => (
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
                {overflowCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onDateSelect?.(dateStr)
                    }}
                    className="w-full text-left text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md px-2 py-1 transition-colors cursor-pointer"
                    aria-label={`Show ${overflowCount} more task${overflowCount !== 1 ? 's' : ''} for ${MONTH_NAMES[month]} ${day}`}
                  >
                    +{overflowCount} more
                  </button>
                )}
              </div>

              <AddTaskInline date={dateStr} onAdd={onAdd} categories={categories} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
