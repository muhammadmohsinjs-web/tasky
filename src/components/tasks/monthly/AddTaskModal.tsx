import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, FileIcon, Image as ImageIcon, Inbox, Link as LinkIcon, Paperclip, Plus, X } from 'lucide-react';
import type { Category, Task, TaskLink, TaskPriority, TaskStatus as DbTaskStatus, RecurrenceRule, TaskType, GoalStatus } from '../../../types';
import { PRIORITY_CONFIG } from '../../../lib/constants';
import { loadTaskMeta, type TaskSubtaskDraft } from '../../../lib/taskMeta';
import { formatMonthLabel, generateMonthGrid, parseISODate, toISODate } from './calendarHelpers';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import type { TaskStatus } from './types';

interface TaskFormPayload {
  title: string;
  description: string | null;
  notes: string | null;
  time: string | null;
  end_time: string | null;
  task_type: TaskType;
  categoryId: string;
  goal_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dateISO: string | null;
  links: TaskLink[];
  files: File[];
  subtasks: TaskSubtaskDraft[];
  tags: string[];
  reminderAt: string | null;
  recurrence: RecurrenceRule | null;
}

interface AddTaskModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit' | 'view';
  defaultDateISO: string;
  defaultTaskType?: TaskType;
  defaultGoalId?: string | null;
  lockGoalId?: boolean;
  task: Task | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (payload: TaskFormPayload) => Promise<boolean> | boolean;
}

interface GoalOption {
  id: string
  title: string
  status: GoalStatus
}

const DAY_OPTIONS = [
  { label: 'S', value: 0 },
  { label: 'M', value: 1 },
  { label: 'T', value: 2 },
  { label: 'W', value: 3 },
  { label: 'T', value: 4 },
  { label: 'F', value: 5 },
  { label: 'S', value: 6 },
] as const;

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

function toDatetimeLocalValue(iso: string | null | undefined) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

interface CalendarDateInputProps {
  value: string;
  onChange: (nextValue: string) => void;
  disabled: boolean;
}

function formatDateValue(isoDate: string): string {
  return parseISODate(isoDate).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function CalendarDateInput({ value, onChange, disabled }: CalendarDateInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [monthDate, setMonthDate] = useState(() => {
    if (value) {
      const selectedDate = parseISODate(value);
      return new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!value) return;
    const selectedDate = parseISODate(value);
    setMonthDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!disabled) return;
    setIsOpen(false);
  }, [disabled]);

  const monthCells = useMemo(
    () => generateMonthGrid(monthDate.getFullYear(), monthDate.getMonth()),
    [monthDate],
  );
  const todayISO = toISODate(new Date());

  const handleSelectDate = (isoDate: string) => {
    onChange(isoDate);
    setIsOpen(false);
  };

  const shiftMonthBy = (offset: number) => {
    setMonthDate((previous) => new Date(previous.getFullYear(), previous.getMonth() + offset, 1));
  };

  const dayAbbr = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-left text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-default disabled:bg-[#F5F8FC]">
        <span className="flex items-center justify-between">
          <span>{value ? formatDateValue(value) : 'Pick a date'}</span>
          <CalendarDays className="h-4 w-4 text-[#5E7392]" />
        </span>
      </button>

      {isOpen ? (
        <div
          role="dialog"
          aria-label="Pick a date"
          className="absolute left-0 top-[calc(100%+8px)] z-50 w-full min-w-[300px] rounded-2xl border border-[#CCD8EA] bg-white p-3 shadow-[0_18px_40px_rgba(15,23,42,0.2)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-base font-semibold text-[#11263D]">{formatMonthLabel(monthDate)}</p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonthBy(-1)}
                aria-label="Previous month"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#314866] transition hover:bg-[#EAF1FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => shiftMonthBy(1)}
                aria-label="Next month"
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#314866] transition hover:bg-[#EAF1FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-[0.08em] text-[#667A98]">
            {dayAbbr.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {monthCells.map((cell) => {
              const isSelected = value === cell.isoDate;
              const isToday = cell.isoDate === todayISO;

              return (
                <button
                  key={cell.isoDate}
                  type="button"
                  onClick={() => handleSelectDate(cell.isoDate)}
                  aria-label={cell.date.toLocaleDateString('en-US', { dateStyle: 'full' })}
                  className={`inline-flex h-9 items-center justify-center rounded-lg border text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isSelected
                      ? 'border-[#1F67E8] bg-[#1F67E8] font-semibold text-white'
                      : isToday
                        ? 'border-[#94B8F7] bg-[#EAF2FF] font-semibold text-[#0F3D88]'
                        : cell.inCurrentMonth
                          ? 'border-transparent text-[#1E2F47] hover:border-[#CCD8EA] hover:bg-[#F5F8FF]'
                          : 'border-transparent text-[#98A8BF] hover:border-[#E0E8F5] hover:bg-[#F7FAFF]'
                  }`}>
                  {cell.dayNumber}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-sm font-semibold text-[#2A63B2] transition hover:text-[#144B96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(todayISO);
                const today = new Date();
                setMonthDate(new Date(today.getFullYear(), today.getMonth(), 1));
                setIsOpen(false);
              }}
              className="text-sm font-semibold text-[#2A63B2] transition hover:text-[#144B96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function AddTaskModal({
  isOpen,
  mode,
  defaultDateISO,
  defaultTaskType = 'task',
  defaultGoalId = null,
  lockGoalId = false,
  task,
  categories,
  onClose,
  onSubmit,
}: AddTaskModalProps) {
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [dateISO, setDateISO] = useState<string>('');
  const [time, setTime] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [categoryId, setCategoryId] = useState('');
  const [goalId, setGoalId] = useState('');
  const [links, setLinks] = useState<TaskLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [linkError, setLinkError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [subtasks, setSubtasks] = useState<TaskSubtaskDraft[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [reminderAt, setReminderAt] = useState('');
  const [recurrenceEnabled, setRecurrenceEnabled] = useState(false);
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceRule['frequency']>('weekly');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('task');
  const [endTime, setEndTime] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [goalOptions, setGoalOptions] = useState<GoalOption[]>([]);
  const existingAttachments = task?.attachments ?? [];
  const isBacklogTask = !dateISO;

  const heading = useMemo(() => {
    const typeLabel = taskType === 'habit' ? 'Habit' : 'Task';
    if (isViewMode) return `${typeLabel} Details`;
    return isEditMode ? `Edit ${typeLabel}` : `Create ${typeLabel}`;
  }, [isEditMode, isViewMode, taskType]);
  const showStatusField = (isEditMode || isViewMode) && taskType !== 'habit';

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    const initialRecurrence = task?.recurrence ?? null;

    setTitle(task?.title ?? '');
    setDescription(task?.description ?? '');
    setNotes(task?.notes ?? '');
    setDateISO(task?.date ?? defaultDateISO ?? '');
    setTime(task?.time ?? (mode === 'create' ? getCurrentTimeValue() : ''));
    setStatus(task ? dbToCalendarStatus(task.status) : 'pending');
    setPriority(task?.priority ?? 'medium');
    setCategoryId(task?.category_id ?? categories[0]?.id ?? '');
    setGoalId(task?.goal_id ?? defaultGoalId ?? '');
    setLinks(task?.links ?? []);
    setNewLinkUrl('');
    setNewLinkLabel('');
    setLinkError('');
    setTitleError('');
    setFiles([]);
    setSubtasks([]);
    setNewSubtaskTitle('');
    setTags([]);
    setTagInput('');
    setReminderAt('');
    const resolvedTaskType = task?.task_type ?? defaultTaskType ?? 'task';
    setTaskType(resolvedTaskType);
    setEndTime(task?.end_time ?? '');
    setDaysOfWeek(initialRecurrence?.days_of_week ?? []);
    setRecurrenceEnabled(resolvedTaskType === 'habit' ? true : Boolean(initialRecurrence));
    setRecurrenceFrequency(initialRecurrence?.frequency ?? 'daily');
    setRecurrenceInterval(initialRecurrence?.interval ?? 1);
    setRecurrenceEndDate(initialRecurrence?.end_date ?? '');
    setLoadingMeta(false);

    if (task?.id) {
      setLoadingMeta(true);
      void loadTaskMeta(task.id)
        .then((meta) => {
          if (!active) return;
          setSubtasks(meta.subtasks);
          setTags(meta.tags);
          setReminderAt(toDatetimeLocalValue(meta.reminderAt));
        })
        .catch(() => {
          if (!active) return;
          setSubtasks([]);
          setTags([]);
          setReminderAt('');
        })
        .finally(() => {
          if (!active) return;
          setLoadingMeta(false);
        });
    }

    return () => {
      active = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, defaultDateISO, defaultGoalId, defaultTaskType, isOpen, mode, task]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, submitting]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let active = true;
    void supabase
      .from('goals')
      .select('id,title,status')
      .eq('user_id', user.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setGoalOptions([]);
          return;
        }
        setGoalOptions((data as GoalOption[] | null) ?? []);
      });

    return () => {
      active = false;
    };
  }, [isOpen, user?.id]);

  useEffect(() => {
    if (!isOpen || taskType !== 'habit') return;
    setRecurrenceEnabled(true);
    setStatus('pending');
    if (!dateISO) {
      setDateISO(defaultDateISO || new Date().toISOString().slice(0, 10));
    }
  }, [taskType, isOpen, dateISO, defaultDateISO]);

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

  const addSubtask = () => {
    const normalized = newSubtaskTitle.trim();
    if (!normalized) return;
    setSubtasks((prev) => [
      ...prev,
      { title: normalized, status: 'todo', sort_order: prev.length },
    ]);
    setNewSubtaskTitle('');
  };

  const toggleSubtaskStatus = (index: number) => {
    setSubtasks((prev) => prev.map((item, i) => (i === index
      ? { ...item, status: item.status === 'done' ? 'todo' : 'done' }
      : item)));
  };

  const removeSubtask = (index: number) => {
    setSubtasks((prev) => prev.filter((_, i) => i !== index).map((item, i) => ({ ...item, sort_order: i })));
  };

  const addTag = () => {
    const normalized = tagInput.trim().replace(/\s+/g, ' ');
    if (!normalized) return;
    const exists = tags.some((tag) => tag.toLowerCase() === normalized.toLowerCase());
    if (exists) {
      setTagInput('');
      return;
    }
    setTags((prev) => [...prev, normalized]);
    setTagInput('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag) => tag !== tagToRemove));
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

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek((prev) => (
      prev.includes(day)
        ? prev.filter((value) => value !== day)
        : [...prev, day].sort((a, b) => a - b)
    ));
  };

  const activeGoals = useMemo(
    () => goalOptions.filter((goal) => goal.status === 'active' || goal.id === goalId),
    [goalOptions, goalId],
  );

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
    const isHabit = taskType === 'habit';
    const habitAnchorDate = defaultDateISO || new Date().toISOString().slice(0, 10);
    const recurrence: RecurrenceRule | null =
      (isHabit || (recurrenceEnabled && dateISO))
        ? {
            frequency: recurrenceFrequency,
            interval: Math.max(1, recurrenceInterval),
            end_date: recurrenceEndDate || null,
            ...(recurrenceFrequency === 'weekly' && daysOfWeek.length > 0
              ? { days_of_week: daysOfWeek }
              : {}),
          }
        : null;
    const finalDateISO = isHabit ? habitAnchorDate : (dateISO || null);
    let didSave = false;
    try {
      didSave = await onSubmit({
        title: normalizedTitle,
        description: description.trim() || null,
        notes: notes.trim() || null,
        time: time.trim() || null,
        end_time: isHabit ? (endTime.trim() || null) : null,
        task_type: taskType,
        categoryId,
        goal_id: taskType === 'task' ? (goalId || null) : null,
        status: isHabit ? 'pending' : status,
        priority,
        dateISO: finalDateISO,
        links,
        files,
        subtasks: subtasks.map((item, index) => ({
          ...item,
          title: item.title.trim(),
          sort_order: index,
        })).filter((item) => item.title.length > 0),
        tags,
        reminderAt: reminderAt ? new Date(reminderAt).toISOString() : null,
        recurrence,
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

            <div className="mb-3 rounded-xl border border-[#D8E3F3] bg-white p-1.5">
              <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#556985]">Type</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={isViewMode}
                  onClick={() => setTaskType('task')}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    taskType === 'task'
                      ? 'border-[#93B7F8] bg-[#EAF2FF] text-[#143C85]'
                      : 'border-[#D7E0EF] bg-white text-[#5B6E8C] hover:bg-[#F7FAFF]'
                  } ${isViewMode ? 'cursor-default' : ''}`}
                >
                  Task
                </button>
                <button
                  type="button"
                  disabled={isViewMode}
                  onClick={() => setTaskType('habit')}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                    taskType === 'habit'
                      ? 'border-[#93B7F8] bg-[#EAF2FF] text-[#143C85]'
                      : 'border-[#D7E0EF] bg-white text-[#5B6E8C] hover:bg-[#F7FAFF]'
                  } ${isViewMode ? 'cursor-default' : ''}`}
                >
                  Habit
                </button>
              </div>
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

            {taskType === 'task' ? (
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-medium text-[#314866]">Goal (optional)</span>
                <select
                  value={goalId}
                  onChange={(event) => setGoalId(event.target.value)}
                  disabled={isViewMode || lockGoalId}
                  className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:bg-[#F5F8FC]"
                >
                  <option value="">Select a goal...</option>
                  {activeGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>
                {lockGoalId ? (
                  <p className="mt-1 text-xs text-[#607A9C]">Goal is locked for tasks created from this goal page.</p>
                ) : null}
              </label>
            ) : null}
          </section>

          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#233553]">Schedule</h3>
            {taskType === 'habit' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Start time</span>
                  <input
                    value={time}
                    onChange={event => setTime(event.target.value)}
                    type="time"
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">End time</span>
                  <input
                    value={endTime}
                    onChange={event => setEndTime(event.target.value)}
                    type="time"
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>
              </div>
            ) : (
              <>
                <div className="mb-3 rounded-xl border border-[#D8E3F3] bg-white p-1.5">
                  <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#556985]">Scheduling</p>
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
                      <CalendarDateInput
                        value={dateISO}
                        onChange={setDateISO}
                        disabled={isViewMode}
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
              </>
            )}
          </section>

          <section className="rounded-2xl border border-[#E4EBF6] bg-[#FBFCFF] p-4">
            <h3 className="mb-3 text-sm font-semibold text-[#233553]">Execution Engine</h3>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-[#314866]">Reminder</span>
                <input
                  type="datetime-local"
                  value={reminderAt}
                  onChange={(event) => setReminderAt(event.target.value)}
                  readOnly={isViewMode}
                  className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </label>

              <div className="rounded-xl border border-[#D8E3F3] bg-white px-3 py-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#314866]">Recurrence</p>
                  <button
                    type="button"
                    disabled={isViewMode || isBacklogTask || taskType === 'habit'}
                    onClick={() => setRecurrenceEnabled((prev) => !prev)}
                    className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
                      recurrenceEnabled ? 'bg-[#EAF2FF] text-[#1F4C9A]' : 'bg-[#F3F5F9] text-[#607A9C]'
                    }`}
                  >
                    {taskType === 'habit' ? 'Required' : recurrenceEnabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <p className="mt-1 text-xs text-[#607A9C]">
                  {taskType === 'habit'
                    ? 'Habits always repeat and use recurrence settings.'
                    : 'Backlog tasks cannot recur until scheduled.'}
                </p>
              </div>
            </div>

            {recurrenceEnabled ? (
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Frequency</span>
                  <select
                    value={recurrenceFrequency}
                    onChange={(event) => setRecurrenceFrequency(event.target.value as RecurrenceRule['frequency'])}
                    disabled={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">Interval</span>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(event) => setRecurrenceInterval(Math.max(1, Number(event.target.value) || 1))}
                    readOnly={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-[#314866]">End date</span>
                  <input
                    type="date"
                    value={recurrenceEndDate}
                    onChange={(event) => setRecurrenceEndDate(event.target.value)}
                    readOnly={isViewMode}
                    className="h-11 w-full rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  />
                </label>
              </div>
            ) : null}

            {recurrenceEnabled && recurrenceFrequency === 'weekly' ? (
              <div className="mt-3">
                <span className="mb-1 block text-sm font-medium text-[#314866]">Days of week</span>
                <div className="flex flex-wrap items-center gap-2">
                  {DAY_OPTIONS.map((day) => {
                    const active = daysOfWeek.includes(day.value);
                    return (
                      <button
                        key={`${day.label}-${day.value}`}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => toggleDayOfWeek(day.value)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold transition ${
                          active
                            ? 'border-[#93B7F8] bg-[#EAF2FF] text-[#143C85]'
                            : 'border-[#D7E0EF] bg-white text-[#5B6E8C] hover:bg-[#F7FAFF]'
                        } ${isViewMode ? 'cursor-default' : ''}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-4">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Tags</span>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#CFDBEA] bg-white px-2 py-2">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] px-2 py-1 text-xs font-semibold text-[#1F4C9A]">
                      {tag}
                      {!isViewMode ? (
                        <button type="button" onClick={() => removeTag(tag)} className="text-[#3E67A9] hover:text-red-500">
                          <X className="h-3 w-3" />
                        </button>
                      ) : null}
                    </span>
                  ))}
                  {!isViewMode ? (
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ',') {
                          event.preventDefault();
                          addTag();
                        }
                      }}
                      className="h-8 min-w-[140px] flex-1 border-none bg-transparent px-1 text-sm text-[#1E2F47] focus:outline-none"
                      placeholder="Type tag and press Enter"
                    />
                  ) : null}
                </div>
                {!isViewMode ? (
                  <button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="inline-flex h-8 items-center rounded-lg border border-[#C7D3E6] bg-white px-3 text-xs font-semibold text-[#2F4767] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Add tag
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-4">
              <span className="mb-1 block text-sm font-medium text-[#314866]">Subtasks</span>
              {loadingMeta ? (
                <p className="text-xs text-[#607A9C]">Loading execution details...</p>
              ) : null}
              <div className="space-y-2">
                {subtasks.map((item, index) => (
                  <div key={`${item.id ?? 'new'}-${index}`} className="flex items-center gap-2 rounded-lg border border-[#DEE6F2] bg-white px-2 py-1.5">
                    <button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => toggleSubtaskStatus(index)}
                      className={`h-5 w-5 rounded border text-[10px] font-bold ${
                        item.status === 'done' ? 'border-[#5CA57C] bg-[#E6F6ED] text-[#1E5A3A]' : 'border-[#C7D3E6] bg-white text-[#607A9C]'
                      }`}
                    >
                      {item.status === 'done' ? '✓' : ''}
                    </button>
                    <span className={`flex-1 text-sm ${item.status === 'done' ? 'text-[#74869F] line-through' : 'text-[#324A68]'}`}>
                      {item.title}
                    </span>
                    {!isViewMode ? (
                      <button type="button" onClick={() => removeSubtask(index)} className="p-1 text-[#7D8EA8] hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ))}

                {!isViewMode ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(event) => setNewSubtaskTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          addSubtask();
                        }
                      }}
                      className="h-10 flex-1 rounded-xl border border-[#CFDBEA] bg-white px-3 text-[#1E2F47] placeholder:text-[#91A1B9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      placeholder="Add subtask"
                    />
                    <button
                      type="button"
                      onClick={addSubtask}
                      disabled={!newSubtaskTitle.trim()}
                      className="inline-flex h-10 items-center rounded-xl bg-[#1F67E8] px-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
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
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-[#324A68] hover:text-[#1F67E8] hover:underline"
                    >
                      {link.label || link.url}
                    </a>
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
