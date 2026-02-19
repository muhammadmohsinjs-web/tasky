export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  updated_at: string
  streak?: StreakData
}

export interface TaskLink {
  url: string
  label?: string
}

export interface TaskAttachment {
  id: string
  task_id: string
  user_id?: string
  file_name: string
  file_url: string
  file_type: string
  file_size: number
  created_at: string
}

export interface Category {
  id: string
  user_id?: string
  name: string
  slug: string
  color: string
  accent: string
  short_label: string
  icon?: string
  sort_order?: number
  created_at?: string
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  days_of_week?: number[]  // 0=Sun..6=Sat
  end_date?: string | null
  count?: number | null
}

export interface StreakData {
  current: number
  longest: number
  last_completed_date: string | null
}

export interface Task {
  id: string
  user_id?: string
  title: string
  description?: string | null
  notes?: string | null
  category_id: string | null
  category?: Category | null
  date: string | null // ISO date string (YYYY-MM-DD) or null for backlog tasks
  end_date?: string | null
  recurrence?: RecurrenceRule | null
  status: TaskStatus
  priority: TaskPriority
  sort_order?: number
  links?: TaskLink[]
  created_at: string
  updated_at?: string
  is_projected?: boolean
  source_task_id?: string | null
}
