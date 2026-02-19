import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Inbox, Trash2, CalendarDays, X, Link as LinkIcon, ExternalLink, Loader2, Paperclip, FileIcon, Image as ImageIcon, Upload } from 'lucide-react'
import type { Task, Category, TaskStatus, TaskPriority, TaskLink } from '../../types'
import { categoryAccent, categoryLabel, categoryStyle } from '../../lib/categoryUtils'
import { StatusBadge, nextStatus } from '../ui/StatusBadge'
import { PriorityBadge } from '../ui/PriorityBadge'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/constants'

interface Props {
  tasks: Task[]
  totalCount?: number
  categories: Category[]
  onAdd: (title: string, categoryId: string, priority?: TaskPriority, extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => Promise<Task | null> | void
  onStatusChange: (id: string, status: TaskStatus) => void
  onSelect: (task: Task, mode: 'view' | 'edit') => void
  onDelete: (id: string) => void
  onSchedule: (ids: string[], date: string) => Promise<void>
  onBulkStatusChange: (ids: string[], status: TaskStatus) => Promise<void>
  onBulkDelete: (ids: string[]) => Promise<void>
}

export function BacklogList({ tasks, totalCount, categories, onAdd, onStatusChange, onSelect, onDelete, onSchedule, onBulkStatusChange, onBulkDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [links, setLinks] = useState<TaskLink[]>([])
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [linkError, setLinkError] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)
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

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setNotes('')
    setPriority('medium')
    setStatus('todo')
    setLinks([])
    setNewLinkUrl('')
    setNewLinkLabel('')
    setLinkError('')
    setPendingFiles([])
  }

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const result = await onAdd(trimmed, categoryId, priority, {
        description: description.trim() || null,
        notes: notes.trim() || null,
        status,
        links: links.length > 0 ? links : [],
      })

      if (result?.id && pendingFiles.length > 0) {
        const { uploadFilesForTask } = await import('../../lib/uploadAttachment')
        await uploadFilesForTask(result.id, pendingFiles)
      }

      resetForm()
      setModalOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleCloseModal = () => {
    if (submitting) return
    resetForm()
    setModalOpen(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const fileArray = Array.from(files)
    e.target.value = ''
    setPendingFiles((prev) => [...prev, ...fileArray])
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const addLink = () => {
    const url = newLinkUrl.trim()
    if (!url) return
    try {
      new URL(url)
    } catch {
      setLinkError('Please enter a valid URL (e.g. https://example.com)')
      return
    }
    setLinkError('')
    setLinks([...links, { url, label: newLinkLabel.trim() || undefined }])
    setNewLinkUrl('')
    setNewLinkLabel('')
  }

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index))
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
      {/* Add to backlog button */}
        <div className="mb-6">
          <button
            onClick={() => { resetForm(); setModalOpen(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Add to Backlog
          </button>
        </div>

      {/* Add task modal */}
      {modalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleCloseModal}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">New Backlog Task</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm text-slate-400">Unscheduled</span>
                </div>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pb-6 pt-2 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Title</label>
                <input
                  type="text"
                  placeholder="What's the task?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSubmit(); if (e.key === 'Escape') handleCloseModal() }}
                  autoFocus
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {categories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-1.5">Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                      <option value="">Uncategorized</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1.5">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  >
                    {(Object.keys(STATUS_CONFIG) as TaskStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                >
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>{PRIORITY_CONFIG[p].label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') handleCloseModal() }}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-300"
                  placeholder="What did you learn and why does it matter?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Escape') handleCloseModal() }}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none placeholder:text-slate-300"
                  placeholder="Links, snippets, or next steps..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Links</label>
                <div className="space-y-2">
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-slate-600 truncate">{link.label || link.url}</div>
                        {link.label && <div className="text-[10px] text-slate-400 truncate">{link.url}</div>}
                      </div>
                      <button
                        onClick={() => removeLink(index)}
                        className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                        title="Remove link"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    />
                    <input
                      type="text"
                      placeholder="Label (optional)"
                      value={newLinkLabel}
                      onChange={(e) => setNewLinkLabel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                      className="w-28 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-100"
                    />
                    <button
                      onClick={addLink}
                      disabled={!newLinkUrl.trim()}
                      className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                  {linkError && <p className="text-xs text-red-500">{linkError}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1.5">Attachments</label>
                <div className="space-y-2">
                  {pendingFiles.map((file, index) => {
                    const isImage = file.type.startsWith('image/')
                    return (
                      <div key={index} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                        {isImage ? (
                          <ImageIcon className="w-4 h-4 text-indigo-500 shrink-0" />
                        ) : (
                          <FileIcon className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-xs text-slate-600 truncate">{file.name}</div>
                          <div className="text-[10px] text-slate-400">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          onClick={() => removePendingFile(index)}
                          className="p-1 text-slate-400 hover:text-red-500 cursor-pointer"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}
                  <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-colors">
                    <input
                      type="file"
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                    />
                    <Paperclip className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-500">Upload files</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmit}
                  disabled={!title.trim() || submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 font-semibold text-sm cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Upload className="w-4 h-4 animate-pulse" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Add Task
                    </>
                  )}
                </button>
                <button
                  onClick={handleCloseModal}
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Backlog tasks */}
      {tasks.length === 0 ? (
        <div className="text-center py-20 flex flex-col items-center gap-4">
          <div className="bg-indigo-50 p-4 rounded-full">
            <Inbox className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-700 mb-1">Your backlog is empty</h3>
            <p className="text-sm text-slate-400">Add unscheduled tasks above to organize your work</p>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-2 rounded-lg">
              <span className="font-medium text-slate-500">Tip:</span>
              <span>Use the input above to quickly add tasks</span>
            </div>
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
                  <PriorityBadge priority={task.priority} />
                  {task.links && task.links.length > 0 && (
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" title={`${task.links.length} link(s)`} />
                  )}
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryStyle(task.category)}`}>
                    {categoryLabel(task.category)}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${task.title}"?`)) onDelete(task.id) }}
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
          {(acting || scheduling) && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            </div>
          )}
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
