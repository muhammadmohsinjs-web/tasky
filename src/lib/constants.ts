import type { TaskStatus } from '../types'

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; dot: string; bg: string; hex: string }> = {
  todo: {
    label: 'To Do',
    color: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
    bg: 'bg-slate-50',
    hex: '#94a3b8',
  },
  inprogress: {
    label: 'In Progress',
    color: 'bg-amber-100 text-amber-700',
    dot: 'bg-amber-400',
    bg: 'bg-amber-50',
    hex: '#f59e0b',
  },
  done: {
    label: 'Done',
    color: 'bg-emerald-100 text-emerald-700',
    dot: 'bg-emerald-400',
    bg: 'bg-emerald-50',
    hex: '#10b981',
  },
}

export const CATEGORY_PALETTE = [
  { name: 'Blue', color: 'bg-blue-100 text-blue-700', accent: 'border-l-blue-400', hex: '#3b82f6' },
  { name: 'Amber', color: 'bg-amber-100 text-amber-700', accent: 'border-l-amber-400', hex: '#f59e0b' },
  { name: 'Violet', color: 'bg-violet-100 text-violet-700', accent: 'border-l-violet-400', hex: '#8b5cf6' },
  { name: 'Emerald', color: 'bg-emerald-100 text-emerald-700', accent: 'border-l-emerald-400', hex: '#10b981' },
  { name: 'Rose', color: 'bg-rose-100 text-rose-700', accent: 'border-l-rose-400', hex: '#f43f5e' },
  { name: 'Cyan', color: 'bg-cyan-100 text-cyan-700', accent: 'border-l-cyan-400', hex: '#06b6d4' },
  { name: 'Orange', color: 'bg-orange-100 text-orange-700', accent: 'border-l-orange-400', hex: '#f97316' },
  { name: 'Pink', color: 'bg-pink-100 text-pink-700', accent: 'border-l-pink-400', hex: '#ec4899' },
]
