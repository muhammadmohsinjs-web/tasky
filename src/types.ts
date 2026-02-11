export type TaskStatus = 'todo' | 'inprogress' | 'done'

export interface Category {
  id: string
  name: string
  slug: string
  color: string
  accent: string
  short_label: string
  created_at?: string
}

export interface Task {
  id: string
  title: string
  description?: string | null
  notes?: string | null
  category_id: string | null
  category?: Category | null
  date: string | null // ISO date string (YYYY-MM-DD) or null for backlog tasks
  status: TaskStatus
  created_at: string
}
