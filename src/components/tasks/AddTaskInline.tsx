import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Plus, CalendarDays, Link as LinkIcon, ExternalLink, Paperclip, FileIcon, Image as ImageIcon, Upload } from 'lucide-react'
import type { Category, TaskPriority, TaskStatus, TaskLink, Task } from '../../types'
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../lib/constants'

interface Props {
  date: string
  onAdd: (title: string, categoryId: string, date: string, priority?: TaskPriority, extras?: { description?: string | null; notes?: string | null; status?: TaskStatus; links?: TaskLink[] }) => Promise<Task | null> | void
  categories: Category[]
}

/**
 * Add-task button that opens a centered popup modal.
 * Full-featured: matches edit mode fields for consistency.
 */
export function AddTaskInline({ date, onAdd, categories }: Props) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')
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

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id)
    }
  }, [categories, categoryId])

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
    if (categories[0]?.id && !categoryId) {
      setCategoryId(categories[0].id)
    }
  }

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed || submitting) return
    setSubmitting(true)
    try {
      const result = await onAdd(trimmed, categoryId, date, priority, {
        description: description.trim() || null,
        notes: notes.trim() || null,
        status,
        links: links.length > 0 ? links : [],
      })

      // Upload pending files if task was created successfully
      if (result?.id && pendingFiles.length > 0) {
        const { uploadFilesForTask } = await import('../../lib/uploadAttachment')
        await uploadFilesForTask(result.id, pendingFiles)
      }

      resetForm()
      setOpen(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (submitting) return
    resetForm()
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') handleClose()
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    setPendingFiles((prev) => [...prev, ...Array.from(files)])
    e.target.value = ''
  }

  const removePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const formattedDate = (() => {
    const [y, m, d] = date.split('-')
    const dt = new Date(Number(y), Number(m) - 1, Number(d))
    return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  })()

  return (
    <>
      <button
        onClick={() => { resetForm(); setOpen(true) }}
        className="w-full text-left text-xs text-slate-300 hover:text-indigo-500 py-1 cursor-pointer flex items-center gap-1.5 group/add mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="opacity-0 group-hover/add:opacity-100 transition-opacity">
          <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span className="font-medium">add task</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 pt-5 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-800">New Task</h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-sm text-slate-400">{formattedDate}</span>
                </div>
              </div>
              <button
                onClick={handleClose}
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
                  onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) handleSubmit(); if (e.key === 'Escape') handleClose() }}
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
                  onKeyDown={handleKeyDown}
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
                  onKeyDown={handleKeyDown}
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
                  onClick={handleClose}
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
    </>
  )
}
