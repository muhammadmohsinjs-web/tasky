import type { TaskStatus, TaskPriority } from '../types'

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

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low: {
    label: 'Low',
    color: 'text-slate-400',
    icon: 'flag',
  },
  medium: {
    label: 'Medium',
    color: 'text-blue-500',
    icon: 'flag',
  },
  high: {
    label: 'High',
    color: 'text-orange-500',
    icon: 'flag',
  },
  urgent: {
    label: 'Urgent',
    color: 'text-red-500',
    icon: 'flag',
  },
}

export const CATEGORY_ICONS = [
  'tag', 'code', 'cloud', 'brain', 'database', 'globe',
  'server', 'layers', 'package', 'cpu', 'terminal', 'git-branch',
  'book', 'lightbulb', 'rocket', 'shield', 'zap', 'heart',
  'star', 'target'
] as const

export const CATEGORY_PALETTE = [
  { name: 'Blue', color: 'bg-blue-100 text-blue-700', accent: 'border-l-blue-400', hex: '#3b82f6' },
  { name: 'Amber', color: 'bg-amber-100 text-amber-700', accent: 'border-l-amber-400', hex: '#f59e0b' },
  { name: 'Violet', color: 'bg-violet-100 text-violet-700', accent: 'border-l-violet-400', hex: '#8b5cf6' },
  { name: 'Emerald', color: 'bg-emerald-100 text-emerald-700', accent: 'border-l-emerald-400', hex: '#10b981' },
  { name: 'Rose', color: 'bg-rose-100 text-rose-700', accent: 'border-l-rose-400', hex: '#f43f5e' },
  { name: 'Cyan', color: 'bg-cyan-100 text-cyan-700', accent: 'border-l-cyan-400', hex: '#06b6d4' },
  { name: 'Orange', color: 'bg-orange-100 text-orange-700', accent: 'border-l-orange-400', hex: '#f97316' },
  { name: 'Pink', color: 'bg-pink-100 text-pink-700', accent: 'border-l-pink-400', hex: '#ec4899' },
  { name: 'Indigo', color: 'bg-indigo-100 text-indigo-700', accent: 'border-l-indigo-400', hex: '#6366f1' },
  { name: 'Teal', color: 'bg-teal-100 text-teal-700', accent: 'border-l-teal-400', hex: '#14b8a6' },
  { name: 'Purple', color: 'bg-purple-100 text-purple-700', accent: 'border-l-purple-400', hex: '#a855f7' },
  { name: 'Lime', color: 'bg-lime-100 text-lime-700', accent: 'border-l-lime-400', hex: '#84cc16' },
  { name: 'Fuchsia', color: 'bg-fuchsia-100 text-fuchsia-700', accent: 'border-l-fuchsia-400', hex: '#d946ef' },
  { name: 'Sky', color: 'bg-sky-100 text-sky-700', accent: 'border-l-sky-400', hex: '#0ea5e9' },
]

export const TASK_SELECT = 'id,title,description,notes,time,end_time,task_type,category_id,date,end_date,recurrence,source_task_id,goal_id,status,priority,sort_order,links,created_at,updated_at,completed_at,deleted_at, category:categories(id,name,slug,color,accent,short_label,icon,sort_order,created_at), goal:goals(id,title,description,start_date,end_date,status,color,sort_order,created_at,updated_at), attachments:task_attachments(id,task_id,user_id,file_name,file_url,file_type,file_size,created_at)'
export const GOAL_SELECT = 'id,title,description,start_date,end_date,status,color,sort_order,created_at,updated_at'
export const EVENT_SELECT = 'id,user_id,title,description,start_at,end_at,is_all_day,timezone,source,status,created_at,updated_at'
export const CALENDAR_CONNECTION_SELECT = 'id,user_id,provider,google_calendar_id,sync_enabled,sync_direction,last_sync_at,created_at,updated_at'
export const EXTERNAL_EVENT_MAPPING_SELECT = 'id,user_id,event_id,provider,provider_calendar_id,provider_event_id,provider_etag,sync_state,last_synced_at,last_error,created_at,updated_at'
