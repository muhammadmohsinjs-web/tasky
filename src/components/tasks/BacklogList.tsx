import { useEffect, useState } from 'react'
import { Plus, Inbox, Trash2 } from 'lucide-react'
import type { Task, Category, TaskStatus } from '../../types'
import { categoryAccent, categoryLabel, categoryStyle } from '../../lib/categoryUtils'
import { StatusBadge, nextStatus } from '../ui/StatusBadge'

interface Props {
  tasks: Task[]
  categories: Category[]
  onAdd: (title: string, categoryId: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  onDelete: (id: string) => void
}

export function BacklogList({ tasks, categories, onAdd, onStatusChange, onSelect, onDelete }: Props) {
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

  const handleSubmit = () => {
    const trimmed = title.trim()
    if (!trimmed || !categoryId) return
    onAdd(trimmed, categoryId)
    setTitle('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit()
  }

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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Unscheduled</span>
            <span className="text-xs text-slate-400">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`group flex items-center gap-3 px-4 py-3 ${categoryAccent(task.category)} border-l-2 hover:bg-slate-50 cursor-pointer`}
                onClick={() => onSelect(task, 'view')}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task, 'view') }}
              >
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
