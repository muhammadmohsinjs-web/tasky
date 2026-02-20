import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import type { CalendarTask } from './types';

interface TaskCardProps {
  task: CalendarTask;
  isSelected: boolean;
  onSelect: (taskId: string) => void;
  onView?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
}

const STATUS_META = {
  in_progress: {
    label: 'In Progress',
    bg: 'bg-[#FDECEA]',
    text: 'text-[#C4453E]',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-[#FEF6E0]',
    text: 'text-[#9A7C2E]',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-[#E6F5EC]',
    text: 'text-[#2D7A4F]',
  },
} as const;

const DOT_COLOR = {
  green: 'bg-[#34A853]',
  yellow: 'bg-[#D4A72C]',
  red: 'bg-[#DC4C42]',
  blue: 'bg-[#4285F4]',
} as const;

export function TaskCard({ task, isSelected, onSelect, onView, onEdit, onDelete, onToggleStatus }: TaskCardProps) {
  const meta = STATUS_META[task.status];
  const [menuOpen, setMenuOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(e: MouseEvent) {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [menuOpen]);

  return (
    <div className="relative" ref={cardRef}>
      <button
        type="button"
        onClick={() => onSelect(task.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          setMenuOpen((v) => !v);
        }}
        className={[
          'group w-full rounded-xl border bg-white px-3.5 py-2.5 text-left transition-all',
          'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.03)]',
          'hover:shadow-[0_2px_8px_rgba(0,0,0,0.06),0_6px_16px_rgba(0,0,0,0.04)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285F4]/40 focus-visible:ring-offset-1',
          isSelected
            ? 'border-[#BFD8FA] bg-[#F7FAFF] shadow-[0_2px_8px_rgba(37,99,235,0.08)]'
            : 'border-[#E8ECF2] hover:border-[#D4DAE4]',
        ].join(' ')}
        aria-pressed={isSelected}
      >
        {/* Row 1: dot + title ... time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[task.categoryColor]}`}
              aria-hidden="true"
            />
            <span className="truncate text-[12px] font-semibold leading-tight text-[#1E293B]">
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#8994A7]">
              {task.timeLabel}
            </span>
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  setMenuOpen((v) => !v);
                }
              }}
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#8994A7] transition hover:bg-[#F0F2F5] hover:text-[#5A6478]"
              aria-label="Task options"
            >
              <EllipsisVertical className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Row 2: status badge (clickable to toggle) */}
        <div className="mt-1.5 pl-4">
          <span
            role={onToggleStatus ? 'button' : undefined}
            tabIndex={onToggleStatus ? 0 : undefined}
            onClick={onToggleStatus ? (e) => { e.stopPropagation(); onToggleStatus(task.id); } : undefined}
            onKeyDown={onToggleStatus ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleStatus(task.id); } } : undefined}
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold leading-snug ${meta.bg} ${meta.text} ${onToggleStatus ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
          >
            {meta.label}
          </span>
        </div>
      </button>

      {/* Context menu */}
      {menuOpen && (
        <div
          className={[
            'absolute right-2 top-10 z-50 min-w-[130px] overflow-hidden rounded-xl border border-[#E4E8EF]',
            'bg-white py-1.5 shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_32px_rgba(0,0,0,0.06)]',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onView?.(task.id); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-[#3B4663] transition hover:bg-[#F4F6F9]"
          >
            <Eye className="h-3.5 w-3.5 text-[#7B879E]" />
            View
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onEdit?.(task.id); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-[#3B4663] transition hover:bg-[#F4F6F9]"
          >
            <Pencil className="h-3.5 w-3.5 text-[#7B879E]" />
            Edit
          </button>
          <div className="mx-2.5 my-0.5 h-px bg-[#EBEEF3]" />
          <button
            type="button"
            onClick={() => { setMenuOpen(false); onDelete?.(task.id); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-[#D64040] transition hover:bg-[#FEF5F5]"
          >
            <Trash2 className="h-3.5 w-3.5 text-[#D64040]" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
