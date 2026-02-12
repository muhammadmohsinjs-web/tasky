import { useEffect, useState } from 'react'
import { Plus, Inbox, Trash2, CalendarDays, X, CheckCircle } from 'lucide-react'
import type { Task, Category, TaskStatus } from '../../types'
import { categoryAccent, categoryLabel, categoryStyle } from '../../lib/categoryUtils'
import { StatusBadge, nextStatus } from '../ui/StatusBadge'

interface Props {
  tasks: Task[]
  totalCount?: number
  categories: Category[]
  onAdd: (title: string, categoryId: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  onDelete: (id: string) => void
  onSchedule: (ids: string[], date: string) => Promise<void>
  onBulkStatusChange: (ids: string[], status: TaskStatus) => Promise<void>
  onBulkDelete: (ids: string[]) => Promise<void>
}

export function BacklogList({ tasks, totalCount, categories, onAdd, onStatusChange, onSelect, onDelete, onSchedule, onBulkStatusChange, onBulkDelete }: Props) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<TaskStatus>('done')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  // Clear selection when tasks change (e.g. after scheduling removes them)
  useEffect(() => {
    setSelectedIds((prev) => {
      const taskIds = new Set(tasks.map((t) => t.id))
      const next = new Set([...prev].filter((id) => taskIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [tasks])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed || !categoryId) return
    onAdd(trimmed, categoryId)
    setTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === tasks.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(tasks.map((t) => t.id)))
    }
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
    setScheduleDate('')
  }

  const handleSchedule = async () => {
    if (selectedIds.size === 0 || !scheduleDate) return
    setScheduling(true)
    try {
      await onSchedule([...selectedIds], scheduleDate)
      setSelectedIds(new Set())
      setScheduleDate('')
    } finally {
      setScheduling(false)
    }
  }

  const hasSelection = selectedIds.size > 0
  const allSelected = tasks.length > 0 && selectedIds.size === tasks.length

  return (
    <div className="animate-fade-in">
      {/* Add to backlog input */}
      {categories.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-6">
          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Add a task to backlog..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-slate-300"
            />
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>
      )}

      {/* Backlog tasks */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <Inbox className="w-10 h-10 text-slate-300" />
          <div>
            <p className="text-sm text-slate-400">No backlog tasks</p>
            <p className="text-xs text-slate-300 mt-1">Add tasks without a date to build your backlog.</p>
          </div>
        </div>
      ) : (
        <div className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${hasSelection ? 'mb-20' : ''}`}>
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-slate-300 text-indigo-500 focus:ring-indigo-400 cursor-pointer"
              />
              <span className="text-xs font-semibold text-slate-600">Unscheduled</span>
            </div>
            <span className="text-xs text-slate-400">
              {totalCount !== undefined && totalCount !== tasks.length
                ? `${tasks.length} of ${totalCount} tasks`
                : `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`
              }
            </span>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => {
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
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(task.category)}`}>
                    {categoryLabel(task.category)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task.id) }}
                    className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

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
              onClick={async () => {
                if (selectedIds.size === 0) return
                setActing(true)
                try {
                  await onBulkStatusChange([...selectedIds], bulkStatus)
                  setSelectedIds(new Set())
                } finally {
                  setActing(false)
                }
              }}
              disabled={acting}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Schedule */}
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-slate-400" />
            <input
              type="date"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
            />
            <button
              onClick={handleSchedule}
              disabled={!scheduleDate || scheduling}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {scheduling ? 'Scheduling...' : 'Schedule'}
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Delete */}
          <button
            onClick={async () => {
              if (selectedIds.size === 0) return
              setActing(true)
              try {
                await onBulkDelete([...selectedIds])
                setSelectedIds(new Set())
              } finally {
                setActing(false)
              }
            }}
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
