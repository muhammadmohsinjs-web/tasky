import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Inbox, CalendarDays, Sparkles } from 'lucide-react';
import type { Category, TaskPriority } from '../../types';

type Destination = 'backlog' | 'date';
type ParsedInput = {
  titles: string[];
  duplicateCount: number;
};

interface Props {
  open: boolean;
  onClose: () => void;
  categories: Category[];
  onAddToDate: (items: { title: string; categoryId: string; date: string; priority?: TaskPriority }[]) => Promise<void>;
  onAddToBacklog: (items: { title: string; categoryId: string; priority?: TaskPriority }[]) => Promise<void>;
}

export function BulkAddModal({ open, onClose, categories, onAddToDate, onAddToBacklog }: Props) {
  const [text, setText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [destination, setDestination] = useState<Destination>('backlog');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id);
    }
  }, [categories, categoryId]);

  const parsedInput = useMemo<ParsedInput>(() => {
    const seen = new Set<string>();
    let duplicateCount = 0;
    const titles = text
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .filter(title => {
        const normalized = title.toLowerCase();
        if (seen.has(normalized)) {
          duplicateCount += 1;
          return false;
        }
        seen.add(normalized);
        return true;
      });

    return { titles, duplicateCount };
  }, [text]);

  const taskCount = parsedInput.titles.length;
  const previewTitles = parsedInput.titles.slice(0, 6);
  const overflowPreviewCount = Math.max(0, taskCount - previewTitles.length);

  const handleSubmit = async () => {
    if (taskCount === 0) return;
    if (destination === 'date' && !date) return;

    setSubmitting(true);
    try {
      if (destination === 'backlog') {
        await onAddToBacklog(parsedInput.titles.map(title => ({ title, categoryId, priority })));
      } else {
        await onAddToDate(parsedInput.titles.map(title => ({ title, categoryId, date, priority })));
      }
      setText('');
      setDate('');
      setPriority('medium');
      setDestination('backlog');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
      event.preventDefault();
      void handleSubmit();
      return;
    }
    if (event.key === 'Escape') {
      onClose();
    }
  };

  const handleDestinationChange = (nextDestination: Destination) => {
    setDestination(nextDestination);
    if (nextDestination === 'date' && !date) {
      setDate(new Date().toISOString().slice(0, 10));
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8" onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-5xl overflow-hidden rounded-[28px] border border-[#DDE7F4] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.28)] animate-fade-in"
        onClick={event => event.stopPropagation()}>
        <header className="border-b border-[#E4ECF7] px-6 py-5 md:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-[30px] font-semibold tracking-tight text-[#10213A]">Bulk Add Tasks</h3>
              <p className="mt-1 text-sm text-[#5A7091]">Drop one task per line. We auto-trim and skip duplicates before insert.</p>
            </div>
            <button onClick={onClose} className="cursor-pointer rounded-xl p-2 text-[#7A8EAC] hover:bg-[#EEF4FF] hover:text-[#4E6488]" aria-label="Close bulk add dialog">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="grid gap-5 p-6 md:p-7 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <div className="rounded-3xl border border-[#D7E2F2] bg-gradient-to-b from-[#FBFDFF] to-[#F4F8FF] p-4 md:p-5">
              <label className="mb-2 block text-sm font-semibold text-[#233553]">Task Input</label>
              <textarea
                placeholder={'Research auth providers\nWrite API documentation\nDesign onboarding flow'}
                value={text}
                onChange={event => setText(event.target.value)}
                autoFocus
                rows={12}
                className="bulk-add-task-input w-full resize-none rounded-2xl border border-[#CBD8EC] bg-white px-4 py-3 text-[15px] leading-relaxed text-[#18304F] placeholder:text-[#95A6C0]"
              />

              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center rounded-full border border-[#CFE0FF] bg-[#EAF2FF] px-2.5 py-1 font-semibold text-[#24559E]">{taskCount} ready</span>
                {parsedInput.duplicateCount > 0 ? (
                  <span className="inline-flex items-center rounded-full border border-[#F4E0C4] bg-[#FFF4E6] px-2.5 py-1 font-semibold text-[#8A5A15]">
                    {parsedInput.duplicateCount} duplicate{parsedInput.duplicateCount === 1 ? '' : 's'} skipped
                  </span>
                ) : null}
                <span className="text-[#6B7D98]">Cmd/Ctrl + Enter to submit quickly.</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#DEE7F4] bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#637A9B]">Preview</p>
              {taskCount === 0 ? (
                <p className="mt-2 text-sm text-[#6D809E]">Parsed tasks will appear here as you type.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {previewTitles.map((title, index) => (
                    <span key={`${title}-${index}`} className="inline-flex items-center rounded-xl border border-[#D7E3F5] bg-[#F7FAFF] px-2.5 py-1 text-xs font-medium text-[#36557F]">
                      {title}
                    </span>
                  ))}
                  {overflowPreviewCount > 0 ? (
                    <span className="inline-flex items-center rounded-xl border border-[#D7E3F5] bg-[#EEF4FF] px-2.5 py-1 text-xs font-semibold text-[#2E5FAE]">+{overflowPreviewCount} more</span>
                  ) : null}
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4 lg:col-span-5">
            <div className="rounded-3xl border border-[#D7E2F2] bg-[#FBFCFF] p-4 md:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#637A9B]">Task Defaults</p>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Category</label>
                <select
                  value={categoryId}
                  onChange={event => setCategoryId(event.target.value)}
                  className="h-11 w-full rounded-xl border border-[#CAD8EC] bg-white px-3 text-sm text-[#203855] focus:border-[#5E7EF4] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF]">
                  <option value="">Uncategorized</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Priority</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map(option => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setPriority(option)}
                      className={`rounded-xl border px-3 py-2 text-sm font-semibold capitalize transition ${
                        priority === option ? 'border-[#89A9F4] bg-[#EAF2FF] text-[#1F4C9A]' : 'border-[#D4DFEF] bg-white text-[#566B8B] hover:bg-[#F4F8FF]'
                      }`}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Destination</label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleDestinationChange('backlog')}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      destination === 'backlog' ? 'border-[#95B5FF] bg-[#EAF2FF] text-[#1F4C9A]' : 'border-[#D6E1F2] bg-white text-[#576B8B] hover:bg-[#F2F7FF]'
                    }`}>
                    <Inbox className="h-4 w-4" />
                    Backlog
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDestinationChange('date')}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                      destination === 'date' ? 'border-[#95B5FF] bg-[#EAF2FF] text-[#1F4C9A]' : 'border-[#D6E1F2] bg-white text-[#576B8B] hover:bg-[#F2F7FF]'
                    }`}>
                    <CalendarDays className="h-4 w-4" />
                    Schedule
                  </button>
                </div>
              </div>

              {destination === 'date' ? (
                <div className="mt-3">
                  <label className="mb-1.5 block text-sm font-semibold text-[#2C4160]">Schedule Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={event => setDate(event.target.value)}
                    className="h-11 w-full rounded-xl border border-[#CAD8EC] bg-white px-3 text-sm text-[#203855] focus:border-[#5E7EF4] focus:outline-none focus:ring-4 focus:ring-[#DCE5FF]"
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-[#DBE6F6] bg-[#F7FBFF] px-3 py-2.5">
              <p className="inline-flex items-center gap-2 text-xs text-[#4A6288]">
                <Sparkles className="h-3.5 w-3.5 text-[#4D74DE]" />
                {taskCount === 0 ? 'Add lines to generate tasks instantly.' : `${taskCount} task${taskCount === 1 ? '' : 's'} will be created with shared defaults.`}
              </p>
            </div>
          </aside>
        </div>

        <footer className="flex flex-col gap-3 border-t border-[#E4ECF7] bg-[#FBFDFF] px-6 py-4 sm:flex-row sm:items-center sm:justify-between md:px-7">
          <p className="text-xs text-[#6B7D98]">Escape to close modal • Cmd/Ctrl + Enter to submit</p>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setText('')}
              disabled={!text.trim() || submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-[#D8E2F3] bg-white px-4 text-sm font-semibold text-[#546A8D] hover:bg-[#F3F7FF] disabled:cursor-not-allowed disabled:opacity-50">
              Clear
            </button>
            <button onClick={onClose} className="inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-[#546A8D] hover:bg-[#F3F7FF]">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={taskCount === 0 || submitting || (destination === 'date' && !date)}
              className="inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#4A6FF0] to-[#5A95F7] px-5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(56,103,228,0.3)] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50">
              <Plus className="h-4 w-4" />
              {submitting ? 'Adding...' : taskCount > 0 ? `Add ${taskCount} ${taskCount === 1 ? 'Task' : 'Tasks'}` : 'Add Tasks'}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
