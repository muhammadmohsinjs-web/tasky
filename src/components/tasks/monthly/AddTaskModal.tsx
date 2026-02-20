import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ExternalLink, FileIcon, Image as ImageIcon, Inbox, Link as LinkIcon, Paperclip, Plus, X } from 'lucide-react';
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
  onSubmit: (payload: TaskFormPayload) => Promise<boolean> | boolean;
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
  const isBacklogTask = !dateISO;

  const heading = useMemo(() => {
    if (isViewMode) return 'Task Details';
    return isEditMode ? 'Edit Task' : 'Create Task';
  }, [isEditMode, isViewMode]);
  const showStatusField = isEditMode || isViewMode;

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
    let didSave = false;
    try {
      didSave = await onSubmit({
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
    } finally {
      setSubmitting(false);
    }
    if (didSave) onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[1px]" role="presentation" onClick={() => !submitting && onClose()}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#DCE5F3] bg-white p-5 shadow-[0_20px_55px_rgba(15,23,42,0.2)] md:p-6"
        onClick={event => event.stopPropagation()}>
        <header className="mb-5 border-b border-[#E8EDF5] pb-4">
          <h2 id="task-modal-title" className="text-[30px] font-semibold leading-[1.1] tracking-tight text-[#132238]">
            {heading}
          </h2>
          {!isViewMode ? (
            <p className="mt-1 text-sm text-[#64748B]">
              Fill essentials first. Add details and resources only when needed.
            </p>
          ) : null}
        </header>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#233553]">Basics</h3>
              {!showStatusField ? (
                <span className="inline-flex items-center rounded-full bg-[#EEF5FF] px-2 py-0.5 text-[11px] font-medium text-[#2A63B2]">
                  Status defaults to Pending
                </span>
              ) : null}
            </div>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Title</span>
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
                className={`h-11 w-full rounded-xl border bg-white px-3 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  titleError ? 'border-red-500' : 'border-[#CFDBEA]'
                }`}
                placeholder="Task title"
              />
              {titleError ? <p className="mt-1 text-xs text-red-500">{titleError}</p> : null}
            </label>

            <div className={`mt-3 grid grid-cols-1 gap-3 ${showStatusField ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
              {showStatusField ? (
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Status</span>
                  <select
                    value={status}
                    onChange={event => setStatus(event.target.value as TaskStatus)}
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                    <option value="in_progress">In Progress</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </label>
              ) : null}

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#314866]">Priority</span>
                <select
                  value={priority}
                  onChange={event => setPriority(event.target.value as TaskPriority)}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  {(Object.keys(PRIORITY_CONFIG) as TaskPriority[]).map(value => (
                    <option key={value} value={value}>
                      {PRIORITY_CONFIG[value].label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#314866]">Category</span>
                <select
                  value={categoryId}
                  onChange={event => setCategoryId(event.target.value)}
                  disabled={isViewMode}
                  className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <option value="">Uncategorized</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#233553]">Schedule</h3>
            <div className="mb-3 rounded-xl border border-[#D8E3F3] bg-white p-1.5">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#556985]">Task type</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={isViewMode}
                  onClick={() => setDateISO(defaultDateISO || new Date().toISOString().slice(0, 10))}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    !isBacklogTask
                      ? 'border-[#93B7F8] bg-[#EAF2FF] text-[#143C85]'
                      : 'border-[#D7E0EF] bg-white text-[#5B6E8C] hover:bg-[#F7FAFF]'
                  } ${isViewMode ? 'cursor-default' : ''}`}>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <CalendarDays className="h-4 w-4" />
                    Scheduled
                  </span>
                  {!isBacklogTask ? <span className="rounded-full bg-[#CFE0FF] px-2 py-0.5 text-[10px] font-semibold text-[#1F4C9A]">Active</span> : null}
                </button>

                <button
                  type="button"
                  disabled={isViewMode}
                  onClick={() => setDateISO('')}
                  className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                    isBacklogTask
                      ? 'border-[#A8C4F2] bg-[#EFF5FF] text-[#244D96]'
                      : 'border-[#D7E0EF] bg-white text-[#5B6E8C] hover:bg-[#F7FAFF]'
                  } ${isViewMode ? 'cursor-default' : ''}`}>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold">
                    <Inbox className="h-4 w-4" />
                    Backlog
                  </span>
                  {isBacklogTask ? <span className="rounded-full bg-[#D8E7FF] px-2 py-0.5 text-[10px] font-semibold text-[#2859AB]">Active</span> : null}
                </button>
              </div>
            </div>

            {!isBacklogTask ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Date</span>
                  <input
                    value={dateISO}
                    onChange={event => setDateISO(event.target.value)}
                    type="date"
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Time</span>
                  <input
                    value={time}
                    onChange={event => setTime(event.target.value)}
                    type="time"
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[#C8D8EF] bg-[#F5F9FF] px-3 py-2">
                <p className="text-sm font-medium text-[#385073]">
                  This task is in backlog and will not appear on a calendar date.
                </p>
                {!isViewMode ? (
                  <p className="mt-1 text-xs text-[#5A7091]">
                    Choose <span className="font-semibold">Scheduled</span> above when you are ready to assign a date and time.
                  </p>
                ) : null}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#233553]">Details <span className="text-[#7D8EA8]">(Optional)</span></h3>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Description</span>
              <textarea
                value={description}
                onChange={event => setDescription(event.target.value)}
                rows={3}
                readOnly={isViewMode}
                className="w-full rounded-xl border border-[#CFDBEA] bg-white px-3 py-2 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="What should be done?"
              />
            </label>

            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Note</span>
              <textarea
                value={notes}
                onChange={event => setNotes(event.target.value)}
                rows={3}
                readOnly={isViewMode}
                className="w-full rounded-xl border border-[#CFDBEA] bg-white px-3 py-2 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="Additional notes"
              />
            </label>
          </section>

          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#233553]">Resources <span className="text-[#7D8EA8]">(Optional)</span></h3>

            <div>
              <span className="mb-1 block text-sm font-medium text-[#314866]">Links</span>
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div key={`${link.url}-${index}`} className="flex items-center gap-2 rounded-lg border border-[#DEE6F2] bg-white px-2 py-1.5">
                    <LinkIcon className="h-3.5 w-3.5 shrink-0 text-[#607A9C]" />
                    <span className="truncate text-sm text-[#324A68]">{link.label || link.url}</span>
                    {!isViewMode ? (
                      <button type="button" onClick={() => removeLink(index)} className="ml-auto p-1 text-[#7D8EA8] hover:text-red-500">
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
                      className="h-11 rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="https://example.com"
                    />
                    <input
                      value={newLinkLabel}
                      onChange={event => setNewLinkLabel(event.target.value)}
                      type="text"
                      className="h-11 rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="Label (optional)"
                    />
                    <button
                      type="button"
                      onClick={addLink}
                      disabled={!newLinkUrl.trim()}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-[#1F67E8] px-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Add
                    </button>
                  </div>
                ) : null}
                {linkError ? <p className="text-xs text-red-500">{linkError}</p> : null}
              </div>
            </div>

            <div className="mt-3">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Documents</span>
              <div className="space-y-2 rounded-xl border border-dashed border-[#C8D8EE] bg-white p-3">
                {!isViewMode ? (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#CFDBEA] px-3 py-2 text-sm text-[#324A68] hover:bg-[#F3F7FD]">
                    <Paperclip className="h-4 w-4" />
                    Attach file(s)
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
                      className="flex items-center gap-2 rounded-lg border border-[#DEE6F2] bg-[#F7FAFF] px-2 py-1.5 text-[#324A68] hover:bg-[#EEF4FF]"
                    >
                      {isImage ? <ImageIcon className="h-3.5 w-3.5 shrink-0 text-indigo-500" /> : <FileIcon className="h-3.5 w-3.5 shrink-0 text-[#607A9C]" />}
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{attachment.file_name}</div>
                        <div className="text-[10px] text-[#7085A4]">{formatFileSize(attachment.file_size)}</div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#8FA1BD]" />
                    </a>
                  );
                })}

                {files.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-[#DEE6F2] bg-[#F7FAFF] px-2 py-1.5">
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-[#607A9C]" />
                    <span className="truncate text-sm text-[#324A68]">{file.name}</span>
                    {!isViewMode ? (
                      <button type="button" onClick={() => removeFile(index)} className="ml-auto p-1 text-[#7D8EA8] hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}

                {existingAttachments.length === 0 && files.length === 0 ? (
                  <p className="text-xs text-[#7085A4]">No documents attached.</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-[#E8EDF5] pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-10 items-center rounded-lg border border-[#C7D3E6] bg-white px-4 text-sm font-medium text-[#2F4767] hover:bg-[#F3F7FD] disabled:cursor-not-allowed disabled:opacity-50">
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode ? (
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-10 items-center rounded-lg bg-[#1F67E8] px-4 text-sm font-medium text-white hover:bg-[#165BD3] disabled:cursor-not-allowed disabled:opacity-50">
                {submitting ? 'Saving...' : isEditMode ? 'Save Changes' : 'Create Task'}
              </button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
