import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical, Eye, Pencil, Trash2 } from 'lucide-react';
import type { CalendarTask } from './types';

interface TaskCardProps {
  task: CalendarTask;
  isSelected: boolean;
  isChecked?: boolean;
  selectionMode?: boolean;
  onSelect: (taskId: string) => void;
  onView?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
  onDelete?: (taskId: string) => void;
  onToggleStatus?: (taskId: string) => void;
  onToggleSelect?: (taskId: string) => void;
}

const STATUS_META = {
  in_progress: {
    label: 'In Progress',
    bg: 'bg-[#FDEBE8]',
    text: 'text-[#B63B33]',
  },
  pending: {
    label: 'Pending',
    bg: 'bg-[#FDF4DD]',
    text: 'text-[#8C6C1F]',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-[#E6F6ED]',
    text: 'text-[#256643]',
  },
} as const;

const DOT_COLOR = {
  green: 'bg-[#34A853]',
  yellow: 'bg-[#D4A72C]',
  red: 'bg-[#DC4C42]',
  blue: 'bg-[#4285F4]',
} as const;

export function TaskCard({
  task,
  isSelected,
  isChecked = false,
  selectionMode = false,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  onToggleSelect,
}: TaskCardProps) {
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
          'group w-full rounded-2xl border bg-white px-4 py-3 text-left transition-all',
          'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_6px_18px_rgba(15,23,42,0.04)]',
          'hover:shadow-[0_2px_10px_rgba(0,0,0,0.06),0_10px_22px_rgba(15,23,42,0.07)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A7CF2]/45 focus-visible:ring-offset-1',
          isSelected
            ? 'border-[#9EC3FA] bg-[#F4F8FF] shadow-[0_0_0_1px_rgba(42,124,242,0.18),0_8px_20px_rgba(37,99,235,0.10)]'
            : 'border-[#E3E9F2] hover:border-[#C9D4E3]',
        ].join(' ')}
        aria-pressed={isSelected}
      >
        {/* Row 1: dot + title ... time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            {selectionMode ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSelect?.(task.id);
                }}
                className={`h-4 w-4 rounded border text-[10px] font-bold ${
                  isChecked ? 'border-[#4E80D9] bg-[#EAF2FF] text-[#1D4F95]' : 'border-[#C7D3E6] bg-white text-transparent'
                }`}
                aria-label={isChecked ? 'Unselect task' : 'Select task'}
              >
                {isChecked ? '✓' : ''}
              </button>
            ) : null}
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${DOT_COLOR[task.categoryColor]}`}
              aria-hidden="true"
            />
            <span className="truncate text-[13px] font-semibold leading-tight text-[#1F2A3D]">
              {task.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#74839A]">
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
              className="flex h-6 w-6 items-center justify-center rounded-full text-[#7E8CA2] transition hover:bg-[#EDF2F8] hover:text-[#3F4A60]"
              aria-label="Task options"
            >
              <EllipsisVertical className="h-4 w-4" />
            </span>
          </div>
        </div>

        {/* Row 2: status badge (clickable to toggle) */}
        <div className="mt-2 pl-4">
          <span
            role={onToggleStatus ? 'button' : undefined}
            tabIndex={onToggleStatus ? 0 : undefined}
            onClick={onToggleStatus ? (e) => { e.stopPropagation(); onToggleStatus(task.id); } : undefined}
            onKeyDown={onToggleStatus ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggleStatus(task.id); } } : undefined}
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-semibold leading-none ${meta.bg} ${meta.text} ${onToggleStatus ? 'cursor-pointer transition hover:brightness-95' : ''}`}
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
