import { useEffect, useRef, useState } from 'react'
import type { Category, Task, TaskStatus, TaskPriority, TaskLink } from '../../types'
import { categoryStyle, categoryLabel, categoryAccent } from '../../lib/categoryUtils'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/constants'
import { useTaskAttachments } from '../../hooks/useTaskAttachments'
import { nextStatus } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import {
  X, Trash2, Pencil, Link as LinkIcon, ExternalLink, Plus,
  Paperclip, FileIcon, Image as ImageIcon, Upload,
  Circle, Clock, CheckCircle2, Eye,
} from 'lucide-react'

const STATUS_ICONS = {
  todo: Circle,
  inprogress: Clock,
  done: CheckCircle2,
} as const

interface Props {
  task: Task | null
  categories: Category[]
  mode: 'view' | 'edit'
  onModeChange: (mode: 'view' | 'edit') => void
  onClose: () => void
  onUpdate: (id: string, updates: {
    title?: string
    description?: string | null
    notes?: string | null
    category_id?: string | null
    date?: string | null
    status?: TaskStatus
    priority?: TaskPriority
    links?: TaskLink[]
  }) => void
  onDelete: (id: string) => void
  selectedDate?: string | null
  selectedDateTasks?: Task[]
  onTaskSelect?: (task: Task, mode: 'view' | 'edit') => void
  onStatusChange?: (id: string, status: TaskStatus) => void
  onTaskDelete?: (id: string) => void
}

export function TaskDetailPanel({
  task,
  categories,
  mode,
  onModeChange,
  onClose,
  onUpdate,
  onDelete,
  selectedDate,
  selectedDateTasks = [],
  onTaskSelect,
  onStatusChange,
  onTaskDelete,
}: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState<string | null>('')
  const [notes, setNotes] = useState<string | null>('')
  const [date, setDate] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [links, setLinks] = useState<TaskLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [linkError, setLinkError] = useState('')
  const [drawerSort, setDrawerSort] = useState<'priority' | 'status' | 'title'>('priority')
  const [drawerStatusFilter, setDrawerStatusFilter] = useState<TaskStatus | 'all'>('all')

  const { attachments, uploading, fetchAttachments, uploadFile, deleteAttachment } = useTaskAttachments(task?.id || null)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024
  const sheetRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const rowTouchStart = useRef<{ x: number; y: number; taskId: string | null }>({ x: 0, y: 0, taskId: null })

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY
  }

  const handleSheetTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current
    if (diff > 100) onClose()
  }

  const handleRowTouchStart = (e: React.TouchEvent, taskId: string) => {
    rowTouchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      taskId,
    }
  }

  const handleRowTouchEnd = (e: React.TouchEvent, t: Task) => {
    const start = rowTouchStart.current
    if (start.taskId !== t.id) return

    const diffX = e.changedTouches[0].clientX - start.x
    const diffY = e.changedTouches[0].clientY - start.y

    if (Math.abs(diffY) > 45 || Math.abs(diffX) < 70) return

    if (diffX > 0) {
      onStatusChange?.(t.id, nextStatus(t.status))
      return
    }

    if (window.confirm(`Delete "${t.title}"?`)) {
      onTaskDelete?.(t.id)
    }
  }

  const MobileWrapper = ({ children }: { children: React.ReactNode }) => {
    if (!isMobile) return <>{children}</>
    return (
      <div className="fixed inset-0 z-50 flex flex-col">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div
          ref={sheetRef}
          className="relative mt-auto bg-white rounded-t-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
          onTouchStart={handleSheetTouchStart}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div className="flex justify-center py-3 cursor-grab">
            <div className="w-10 h-1 bg-slate-300 rounded-full" />
          </div>
          {children}
        </div>
      </div>
    )
  }

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setDescription(task.description ?? '')
    setNotes(task.notes ?? '')
    setDate(task.date ?? '')
    setCategoryId(task.category_id)
    setStatus(task.status)
    setPriority(task.priority)
    setLinks(task.links ?? [])
    fetchAttachments()
  }, [task, fetchAttachments])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (task || selectedDate) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [task, selectedDate, onClose])

  // --- Date-list drawer mode ---
  if (!task && selectedDate) {
    const formattedDate = (() => {
      const [y, m, d] = selectedDate.split('-')
      if (!y) return selectedDate
      const dt = new Date(Number(y), Number(m) - 1, Number(d))
      return dt.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    })()

    const priorityOrder: Record<TaskPriority, number> = { urgent: 0, high: 1, medium: 2, low: 3 }
    const statusOrder: Record<TaskStatus, number> = { todo: 0, inprogress: 1, done: 2 }

    let sortedTasks = [...selectedDateTasks]
    if (drawerStatusFilter !== 'all') {
      sortedTasks = sortedTasks.filter((t) => t.status === drawerStatusFilter)
    }
    if (drawerSort === 'priority') {
      sortedTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    } else if (drawerSort === 'status') {
      sortedTasks.sort((a, b) => statusOrder[a.status] - statusOrder[b.status])
    } else {
      sortedTasks.sort((a, b) => a.title.localeCompare(b.title))
    }

    const doneCount = selectedDateTasks.filter((t) => t.status === 'done').length
    const statusFilters: Array<{ key: TaskStatus | 'all'; label: string }> = [
      { key: 'all', label: 'All' },
      { key: 'todo', label: 'To Do' },
      { key: 'inprogress', label: 'In Progress' },
      { key: 'done', label: 'Done' },
    ]

    return (
      <MobileWrapper>
        <aside className="w-full lg:w-[380px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur animate-slide-in-right">
          <div className="p-5 border-b border-slate-200">
            <div className="flex items-center justify-between mb-1">
              <div className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Date Tasks</div>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Close drawer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-sm font-semibold text-slate-700">{formattedDate}</div>
            <div className="text-xs text-slate-400 mt-0.5">
              {selectedDateTasks.length} task{selectedDateTasks.length !== 1 ? 's' : ''}
              {doneCount > 0 && ` · ${doneCount} done`}
            </div>
          </div>

          <div className="px-5 pt-4 pb-2 space-y-3">
            <div className="flex gap-1.5 flex-wrap">
              {statusFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setDrawerStatusFilter(f.key)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full cursor-pointer transition-colors ${
                    drawerStatusFilter === f.key
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Sort</span>
              <select
                value={drawerSort}
                onChange={(e) => setDrawerSort(e.target.value as typeof drawerSort)}
                className="text-[11px] font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-300"
              >
                <option value="priority">Priority</option>
                <option value="status">Status</option>
                <option value="title">Title A-Z</option>
              </select>
            </div>
          </div>

          <div className="px-5 pb-5 space-y-1 overflow-y-auto max-h-[calc(100vh-320px)]">
            {sortedTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No tasks match the filter.</p>
                {drawerStatusFilter !== 'all' && (
                  <button onClick={() => setDrawerStatusFilter('all')} className="mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
                    Show all
                  </button>
                )}
              </div>
            ) : (
              sortedTasks.map((t) => {
                const StatusIcon = STATUS_ICONS[t.status]
                return (
                  <div
                    key={t.id}
                    className={`group flex items-center gap-2.5 py-2.5 px-3 rounded-xl border-l-2 ${categoryAccent(t.category)} transition-all cursor-pointer ${
                      t.status === 'done' ? 'opacity-60' : 'hover:bg-slate-50'
                    }`}
                    role="button"
                    tabIndex={0}
                    onTouchStart={(e) => handleRowTouchStart(e, t.id)}
                    onTouchEnd={(e) => handleRowTouchEnd(e, t)}
                    onClick={() => onTaskSelect?.(t, 'view')}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTaskSelect?.(t, 'view') } }}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusChange?.(t.id, nextStatus(t.status)) }}
                      className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-100 cursor-pointer transition-colors"
                      aria-label={`Mark as ${STATUS_CONFIG[nextStatus(t.status)].label}`}
                    >
                      <StatusIcon className={`w-4 h-4 ${
                        t.status === 'done' ? 'text-emerald-500' :
                        t.status === 'inprogress' ? 'text-amber-500' :
                        'text-slate-300'
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm leading-snug block truncate ${
                        t.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700'
                      }`}>
                        {t.title}
                      </span>
                      {t.category && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full inline-block mt-0.5 ${categoryStyle(t.category)}`}>
                          {categoryLabel(t.category)}
                        </span>
                      )}
                    </div>
                    <PriorityBadge priority={t.priority} size="sm" />
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button onClick={(e) => { e.stopPropagation(); onTaskSelect?.(t, 'view') }} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer" title="View">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); onTaskSelect?.(t, 'edit') }} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 cursor-pointer" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${t.title}"?`)) onTaskDelete?.(t.id) }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </aside>
      </MobileWrapper>
    )
  }

  if (!task) return null
  const activeCategory = categories.find((c) => c.id === categoryId) ?? task.category

  const addLink = () => {
    const url = newLinkUrl.trim()
    if (!url) return
    try { new URL(url) } catch { setLinkError('Please enter a valid URL (e.g. https://example.com)'); return }
    setLinkError('')
    setLinks([...links, { url, label: newLinkLabel.trim() || undefined }])
    setNewLinkUrl('')
    setNewLinkLabel('')
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    for (let i = 0; i < files.length; i++) {
      await uploadFile(files[i])
    }
    e.target.value = ''
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const handleSave = () => {
    onUpdate(task.id, {
      title: title.trim() || task.title,
      description: description?.trim() || null,
      notes: notes?.trim() || null,
      date: date || null,
      category_id: categoryId,
      status,
      priority,
      links,
    })
    onModeChange('view')
  }

  const formattedDate = (() => {
    if (!task.date) return 'Unscheduled'
    const [y, m, d] = task.date.split('-')
    if (!y) return task.date
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  })()

  if (mode === 'view') {
    return (
      <MobileWrapper>
        <aside className="w-full lg:w-[380px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur animate-slide-in-right">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Task details</div>
              <div className="text-sm font-semibold text-slate-700">Overview</div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onModeChange('edit')} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 cursor-pointer" aria-label="Edit task" title="Edit">
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Close detail panel">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-lg border border-slate-200 ${
                task.status === 'done' ? 'text-emerald-600 bg-emerald-50' :
                task.status === 'inprogress' ? 'text-amber-600 bg-amber-50' :
                'text-slate-500 bg-slate-50'
              }`}>
                {STATUS_CONFIG[task.status].label}
              </span>
              <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(activeCategory)}`}>
                {categoryLabel(activeCategory)}
              </span>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Title</label>
              <p className="mt-1 text-sm text-slate-700">{task.title}</p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Date</label>
              <p className="mt-1 text-sm text-slate-600">{formattedDate}</p>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400">Priority</label>
              <p className={`mt-1 text-sm font-medium ${PRIORITY_CONFIG[task.priority].color}`}>
                {PRIORITY_CONFIG[task.priority].label}
              </p>
            </div>

            {task.description && (
              <div>
                <label className="text-[11px] font-medium text-slate-400">Description</label>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            {task.notes && (
              <div>
                <label className="text-[11px] font-medium text-slate-400">Notes</label>
                <p className="mt-1 text-sm text-slate-600 whitespace-pre-wrap">{task.notes}</p>
              </div>
            )}

            {task.links && task.links.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-slate-400">Links</label>
                <div className="mt-1 space-y-1.5">
                  {task.links.map((link, index) => (
                    <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 group">
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{link.label || link.url}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {attachments.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-slate-400">Attachments</label>
                <div className="mt-1 space-y-1.5">
                  {attachments.map((attachment) => {
                    const isImage = attachment.file_type.startsWith('image/')
                    return (
                      <div key={attachment.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg group">
                        {isImage ? <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" /> : <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <a href={attachment.file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-slate-700 hover:text-indigo-600 truncate block">
                            {attachment.file_name}
                          </a>
                          <div className="text-[10px] text-slate-400">{formatFileSize(attachment.file_size)}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 border-t border-slate-200 flex items-center gap-2">
            <button onClick={() => onModeChange('edit')} className="flex-1 text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold cursor-pointer flex items-center justify-center gap-2">
              <Pencil className="w-3.5 h-3.5" />
              Edit Task
            </button>
            <button
              onClick={() => { if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id) }}
              className="text-sm px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:border-red-200 hover:text-red-500 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </aside>
      </MobileWrapper>
    )
  }

  // --- Edit mode ---
  return (
    <MobileWrapper>
      <aside className="w-full lg:w-[380px] shrink-0 border-l border-slate-200 bg-white/70 backdrop-blur animate-slide-in-right">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-slate-400 font-bold">Task details</div>
            <div className="text-sm font-semibold text-slate-700">Edit and refine</div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer" aria-label="Close detail panel">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[calc(100vh-280px)]">
          <div className="flex items-center gap-2">
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="text-xs px-2 py-1 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300">
              {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
            <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(activeCategory)}`}>
              {categoryLabel(activeCategory)}
            </span>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Category</label>
            <select value={categoryId ?? ''} onChange={(e) => setCategoryId(e.target.value || null)} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100">
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Date</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
              {date && (
                <button onClick={() => setDate('')} className="text-xs px-2.5 py-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 rounded-lg cursor-pointer" title="Move to backlog">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {!date && <p className="text-[10px] text-slate-400 mt-1">No date — task will be in backlog</p>}
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Priority</label>
            <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100">
              {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Description</label>
            <textarea value={description ?? ''} onChange={(e) => setDescription(e.target.value)} rows={3} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none" placeholder="What did you learn and why does it matter?" />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Notes</label>
            <textarea value={notes ?? ''} onChange={(e) => setNotes(e.target.value)} rows={4} className="mt-1 w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100 resize-none" placeholder="Links, snippets, or next steps..." />
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Links</label>
            <div className="mt-1 space-y-2">
              {links.map((link, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-slate-600 truncate">{link.label || link.url}</div>
                    {link.label && <div className="text-[10px] text-slate-400 truncate">{link.url}</div>}
                  </div>
                  <button onClick={() => removeLink(index)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer" title="Remove link">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input type="url" placeholder="https://..." value={newLinkUrl} onChange={(e) => setNewLinkUrl(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
                <input type="text" placeholder="Label (optional)" value={newLinkLabel} onChange={(e) => setNewLinkLabel(e.target.value)} className="w-32 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100" />
                <button onClick={addLink} disabled={!newLinkUrl.trim()} className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {linkError && <p className="text-xs text-red-500 mt-1">{linkError}</p>}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500">Attachments</label>
            <div className="mt-1 space-y-2">
              {attachments.map((attachment) => {
                const isImage = attachment.file_type.startsWith('image/')
                return (
                  <div key={attachment.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    {isImage ? <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" /> : <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-slate-600 truncate">{attachment.file_name}</div>
                      <div className="text-[10px] text-slate-400">{formatFileSize(attachment.file_size)}</div>
                    </div>
                    <button onClick={() => deleteAttachment(attachment.id, attachment.file_url)} className="p-1 text-slate-400 hover:text-red-500 cursor-pointer" title="Delete attachment">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
              <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                <input type="file" multiple onChange={handleFileUpload} disabled={uploading} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
                {uploading ? (
                  <>
                    <Upload className="w-4 h-4 text-slate-400 animate-pulse" />
                    <span className="text-sm text-slate-500">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Upload files</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex items-center gap-2">
          <button onClick={handleSave} className="flex-1 text-sm px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 font-semibold cursor-pointer">
            Save changes
          </button>
          <button onClick={() => onModeChange('view')} className="text-sm px-3 py-2 border border-slate-200 text-slate-500 rounded-lg hover:border-slate-300 hover:text-slate-700 cursor-pointer">
            Cancel
          </button>
        </div>
      </aside>
    </MobileWrapper>
  )
}
