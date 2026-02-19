import { useEffect, useState } from 'react';
import type { CategoryColor, TaskStatus } from './types';

interface AddTaskModalProps {
  isOpen: boolean;
  defaultDateISO: string;
  onClose: () => void;
  onAddTask: (payload: { title: string; status: TaskStatus; dateISO: string; timeLabel: string; categoryColor: CategoryColor }) => void;
}

export function AddTaskModal({ isOpen, defaultDateISO, onClose, onAddTask }: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<TaskStatus>('pending');
  const [dateISO, setDateISO] = useState(defaultDateISO);
  const [timeLabel, setTimeLabel] = useState('09:00 AM');
  const [categoryColor, setCategoryColor] = useState<CategoryColor>('blue');

  useEffect(() => {
    if (isOpen) {
      setDateISO(defaultDateISO);
    }
  }, [defaultDateISO, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = title.trim();
    if (!normalized) return;

    onAddTask({
      title: normalized,
      status,
      dateISO,
      timeLabel,
      categoryColor,
    });

    setTitle('');
    setStatus('pending');
    setTimeLabel('09:00 AM');
    setCategoryColor('blue');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4" role="presentation" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="add-task-title" className="text-xl font-semibold text-slate-900">
          Add Task
        </h2>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Title</span>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              type="text"
              required
              className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              placeholder="Task title"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Status</span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as TaskStatus)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="in_progress">In Progress</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Date</span>
              <input
                value={dateISO}
                onChange={(event) => setDateISO(event.target.value)}
                type="date"
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Time</span>
              <input
                value={timeLabel}
                onChange={(event) => setTimeLabel(event.target.value)}
                type="text"
                required
                className="h-11 w-full rounded-xl border border-slate-300 px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                placeholder="02:30 PM"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">Color</span>
              <select
                value={categoryColor}
                onChange={(event) => setCategoryColor(event.target.value as CategoryColor)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="yellow">Yellow</option>
                <option value="red">Red</option>
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Add Task
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
