export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Profile {
  id: string
  display_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  updated_at: string
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

export interface Task {
  id: string
  user_id?: string
  title: string
  description?: string | null
  notes?: string | null
  category_id: string | null
  category?: Category | null
  date: string | null // ISO date string (YYYY-MM-DD) or null for backlog tasks
  status: TaskStatus
  priority: TaskPriority
  links?: TaskLink[]
  created_at: string
}
