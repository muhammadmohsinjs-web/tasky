import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileIcon, Image as ImageIcon, Link as LinkIcon, Paperclip, Plus, X } from 'lucide-react';
import type { Category, Task, TaskLink, TaskPriority, TaskStatus as DbTaskStatus } from '../../../types';
import { PRIORITY_CONFIG } from '../../../lib/constants';
import type { TaskStatus } from './types';

interface TaskFormPayload {
  title: string;
  description: string | null;
  notes: string | null;
  time: string | null;
  categoryId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dateISO: string | null;
  links: TaskLink[];
  files: File[];
}

interface AddTaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  defaultDateISO: string;
  task: Task | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: TaskFormPayload) => Promise<void> | void;
}

function dbToCalendarStatus(status: DbTaskStatus): TaskStatus {
  if (status === 'inprogress') return 'in_progress';
  if (status === 'done') return 'completed';
  return 'pending';
}

function getCurrentTimeValue() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function AddTaskModal({ isOpen, mode, defaultDateISO, task, categories, onClose, onSubmit }: AddTaskModalProps) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dateISO, setDateISO] = useState<string>('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [linkError, setLinkError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const existingAttachments = task?.attachments ?? [];

  const heading = useMemo(() => {
    if (isViewMode) return 'Task Details';
    return isEditMode ? 'Edit Task' : 'Create Task';
  }, [isEditMode, isViewMode]);

  useEffect(() => {
    if (!isOpen) return;

    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setNotes(task?.notes ?? '');
    setDateISO(task?.date ?? defaultDateISO ?? '');
    setTime(task?.time ?? (mode === 'create' ? getCurrentTimeValue() : ''));
    setStatus(task ? dbToCalendarStatus(task.status) : 'pending');
    setPriority(task?.priority ?? 'medium');
    setCategoryId(task?.category_id ?? categories[0]?.id ?? '');
    setLinks(task?.links ?? []);
    setNewLinkUrl('');
    setNewLinkLabel('');
    setLinkError('');
    setTitleError('');
    setFiles([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultDateISO, isOpen, mode, task]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, submitting]);

  if (!isOpen) return null;

  const addLink = () => {
    const url = newLinkUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      setLinkError('Please enter a valid URL (e.g. https://example.com)');
      return;
    }
    setLinkError('');
    setLinks(prev => [...prev, { url, label: newLinkLabel.trim() || undefined }]);
    setNewLinkUrl('');
    setNewLinkLabel('');
  };

  const removeLink = (index: number) => {
    setLinks(prev => prev.filter((_, i) => i !== index));
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files;
    if (!selected || selected.length === 0) return;
    const selectedFiles = Array.from(selected);
    setFiles(prev => [...prev, ...selectedFiles]);
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isViewMode) return;
    const normalizedTitle = title.trim();
    if (!normalizedTitle) {
      setTitleError('Title is required');
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    setTitleError('');
    try {
      await onSubmit({
        title: normalizedTitle,
        description: description.trim() || null,
        notes: notes.trim() || null,
        time: time.trim() || null,
        categoryId,
        status,
        priority,
        dateISO: dateISO || null,
        links,
        files,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" role="presentation" onClick={() => !submitting && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={event => event.stopPropagation()}>
        <h2 id="task-modal-title" className="text-xl font-semibold text-slate-900">
          {heading}
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={event => {
                setTitle(event.target.value);
                if (titleError && event.target.value.trim()) {
                  setTitleError('');
                }
              }}
              type="text"
              required
              disabled={isViewMode}
              aria-invalid={Boolean(titleError)}
              className={`h-11 w-full rounded-xl px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                titleError ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Task title"
            />
            {titleError ? <p className="mt-1 text-xs text-red-500">{titleError}</p> : null}
          </label>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select
                value={status}
                onChange={event => setStatus(event.target.value as TaskStatus)}
                disabled={isViewMode}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Priority</span>
              <select
                value={priority}
                onChange={event => setPriority(event.target.value as TaskPriority)}
                disabled={isViewMode}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(value => (
                  <option key={value} value={value}>
                    {PRIORITY_CONFIG[value].label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Category</span>
              <select
                value={categoryId}
                onChange={event => setCategoryId(event.target.value)}
                disabled={isViewMode}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <option value="">Uncategorized</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Date</span>
              <div className="flex gap-2">
                <input
                  value={dateISO}
                  onChange={event => setDateISO(event.target.value)}
                  type="date"
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                {dateISO && !isViewMode ? (
                  <button
                    type="button"
                    onClick={() => setDateISO('')}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 text-slate-500 hover:bg-slate-100"
                    title="Move to backlog">
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Time</span>
              <input
                value={time}
                onChange={event => setTime(event.target.value)}
                type="time"
                disabled={isViewMode}
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Description</span>
            <textarea
              value={description}
              onChange={event => setDescription(event.target.value)}
              rows={3}
              readOnly={isViewMode}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Task description"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Note</span>
            <textarea
              value={notes}
              onChange={event => setNotes(event.target.value)}
              rows={3}
              readOnly={isViewMode}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Additional notes"
            />
          </label>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Link</span>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={`${link.url}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <LinkIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="truncate text-sm text-slate-700">{link.label || link.url}</span>
                  {!isViewMode ? (
                    <button type="button" onClick={() => removeLink(index)} className="ml-auto p-1 text-slate-500 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}

              {!isViewMode ? (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_180px_auto]">
                  <input
                    value={newLinkUrl}
                    onChange={event => setNewLinkUrl(event.target.value)}
                    type="url"
                    className="h-11 rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="https://example.com"
                  />
                  <input
                    value={newLinkLabel}
                    onChange={event => setNewLinkLabel(event.target.value)}
                    type="text"
                    className="h-11 rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    placeholder="Label (optional)"
                  />
                  <button
                    type="button"
                    onClick={addLink}
                    disabled={!newLinkUrl.trim()}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-3 text-white disabled:cursor-not-allowed disabled:opacity-50">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
              {linkError ? <p className="text-xs text-red-500">{linkError}</p> : null}
            </div>
          </div>

          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Documents</span>
            <div className="space-y-2 rounded-xl border border-dashed border-slate-300 p-3">
              {!isViewMode ? (
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  <Paperclip className="h-4 w-4" />
                  Select file(s)
                  <input type="file" multiple className="hidden" onChange={handleFilesSelected} />
                </label>
              ) : null}

              {existingAttachments.map((attachment) => {
                const isImage = attachment.file_type.startsWith('image/');
                return (
                  <a
                    key={attachment.id}
                    href={attachment.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-slate-700 hover:bg-slate-100"
                  >
                    {isImage ? <ImageIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" /> : <FileIcon className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{attachment.file_name}</div>
                      <div className="text-[10px] text-slate-500">{formatFileSize(attachment.file_size)}</div>
                    </div>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  </a>
                );
              })}

              {files.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5">
                  <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                  <span className="truncate text-sm text-slate-700">{file.name}</span>
                  {!isViewMode ? (
                    <button type="button" onClick={() => removeFile(index)} className="ml-auto p-1 text-slate-500 hover:text-red-500">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  ) : null}
                </div>
              ))}

              {existingAttachments.length === 0 && files.length === 0 ? (
                <p className="text-xs text-slate-500">No documents attached.</p>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50">
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode ? (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
