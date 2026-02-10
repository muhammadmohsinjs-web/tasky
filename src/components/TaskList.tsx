import type { Task, TaskStatus } from '../types'
import { categoryAccent, categoryLabel, categoryStyle } from './categoryUtils'
import { StatusBadge, nextStatus } from './ui/StatusBadge'

interface Props {
  tasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
}

export function TaskList({ tasks, onStatusChange, onSelect }: Props) {
  const tasksByDate: Record<string, Task[]> = {}
  for (const task of tasks) {
    if (!tasksByDate[task.date]) tasksByDate[task.date] = []
    tasksByDate[task.date].push(task)
  }

  const dates = Object.keys(tasksByDate).sort()

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        No tasks yet. Add one from the calendar view.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {dates.map((date) => (
        <div key={date} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
            {date}
          </div>
          <div className="divide-y divide-slate-100">
            {tasksByDate[date].map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 px-4 py-3 ${categoryAccent(task.category)} border-l-2 hover:bg-slate-50 cursor-pointer`}
                onClick={() => onSelect(task, 'view')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task, 'view') }}
              >
                <div onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }}>
                  <StatusBadge status={task.status} />
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                    {task.title}
                  </div>
                  {task.description && (
                    <div className="text-xs text-slate-400 mt-0.5 truncate">
                      {task.description}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(task.category)}`}>
                  {categoryLabel(task.category)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
