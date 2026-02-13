import { useEffect, useState } from 'react'
import { CalendarDays, Inbox, Trash2, X, Link as LinkIcon } from 'lucide-react'
import type { Task, TaskStatus } from '../../types'
import { categoryAccent, categoryLabel, categoryStyle } from '../../lib/categoryUtils'
import { StatusBadge, nextStatus } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'

interface Props {
  tasks: Task[]
  onStatusChange: (id: string, status: TaskStatus) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  onBulkStatusChange: (ids: string[], status: TaskStatus) => Promise<void>
  onBulkReschedule: (ids: string[], date: string) => Promise<void>
  onBulkMoveToBacklog: (ids: string[]) => Promise<void>
  onBulkDelete: (ids: string[]) => Promise<void>
}

export function TaskList({ tasks, onStatusChange, onSelect, onBulkStatusChange, onBulkReschedule, onBulkMoveToBacklog, onBulkDelete }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>('done')
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [acting, setActing] = useState(false)

  // Clean selection when tasks change
  useEffect(() => {
    setSelectedIds((prev) => {
      const taskIds = new Set(tasks.map((t) => t.id))
      const next = new Set([...prev].filter((id) => taskIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [tasks])

  const tasksByDate: Record<string, Task[]> = {}
  for (const task of tasks) {
    const key = task.date ?? 'Unscheduled'
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(task)
  }

  const dates = Object.keys(tasksByDate).sort((a, b) => {
    if (a === 'Unscheduled') return 1
    if (b === 'Unscheduled') return -1
    return a.localeCompare(b)
  })

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectGroup = (groupTaskIds: string[]) => {
    setSelectedIds((prev) => {
      const allInGroup = groupTaskIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allInGroup) {
        groupTaskIds.forEach((id) => next.delete(id))
      } else {
        groupTaskIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setRescheduleDate('')
  }

  const handleBulkStatus = async () => {
    if (selectedIds.size === 0) return
    setActing(true)
    try {
      await onBulkStatusChange([...selectedIds], bulkStatus)
      setSelectedIds(new Set())
    } finally {
      setActing(false)
    }
  }

  const handleBulkReschedule = async () => {
    if (selectedIds.size === 0 || !rescheduleDate) return
    setActing(true)
    try {
      await onBulkReschedule([...selectedIds], rescheduleDate)
      setSelectedIds(new Set())
      setRescheduleDate('')
    } finally {
      setActing(false)
    }
  }

  const handleBulkMoveToBacklog = async () => {
    if (selectedIds.size === 0) return
    setActing(true)
    try {
      await onBulkMoveToBacklog([...selectedIds])
      setSelectedIds(new Set())
    } finally {
      setActing(false)
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return
    setActing(true)
    try {
      await onBulkDelete([...selectedIds])
      setSelectedIds(new Set())
    } finally {
      setActing(false)
    }
  }

  const hasSelection = selectedIds.size > 0

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400 text-sm">
        No tasks yet. Add one from the calendar view.
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${hasSelection ? 'mb-24' : ''}`}>
      {dates.map((date) => {
        const groupTasks = tasksByDate[date]
        const groupIds = groupTasks.map((t) => t.id)
        const allGroupSelected = groupIds.every((id) => selectedIds.has(id))

        return (
          <div key={date} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
              <input
                type="checkbox"
                checked={allGroupSelected}
                onChange={() => toggleSelectGroup(groupIds)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600">{date}</span>
              <span className="text-xs text-slate-400 ml-auto">{groupTasks.length} {groupTasks.length === 1 ? 'task' : 'tasks'}</span>
            </div>
            <div className="divide-y divide-slate-100">
              {groupTasks.map((task) => {
                const isSelected = selectedIds.has(task.id)
                return (
                  <div
                    key={task.id}
                    className={`group flex items-center gap-3 px-4 py-3 ${categoryAccent(task.category)} border-l-2 hover:bg-slate-50 cursor-pointer ${
                      isSelected ? 'bg-indigo-50/50' : ''
                    }`}
                    onClick={() => onSelect(task, 'view')}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task, 'view') }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(task.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer shrink-0"
                    />
                    <div onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, nextStatus(task.status)) }}>
                      <StatusBadge status={task.status} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm truncate ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {task.title}
                      </div>
                      {task.description && (
                        <div className="text-xs text-slate-400 mt-0.5 truncate">
                          {task.description}
                        </div>
                      )}
                    </div>
                    <PriorityBadge priority={task.priority} />
                    {task.links && task.links.length > 0 && (
                      <LinkIcon className="w-3.5 h-3.5 text-indigo-400" title={`${task.links.length} link(s)`} />
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(task.category)}`}>
                      {categoryLabel(task.category)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Floating action bar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-xl border border-slate-200 px-5 py-3 flex items-center gap-3 animate-fade-in flex-wrap justify-center">
          <span className="text-sm font-semibold text-slate-700">
            {selectedIds.size} selected
          </span>

          <div className="h-5 w-px bg-slate-200" />

          {/* Status change */}
          <div className="flex items-center gap-1.5">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as TaskStatus)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            >
              <option value="todo">To Do</option>
              <option value="inprogress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button
              onClick={handleBulkStatus}
              disabled={acting}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Reschedule */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
            <button
              onClick={handleBulkReschedule}
              disabled={!rescheduleDate || acting}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Reschedule
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Move to backlog */}
          <button
            onClick={handleBulkMoveToBacklog}
            disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Inbox className="w-4 h-4" />
            Backlog
          </button>

          {/* Delete */}
          <button
            onClick={handleBulkDelete}
            disabled={acting}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>

          {/* Clear selection */}
          <button
            onClick={clearSelection}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
