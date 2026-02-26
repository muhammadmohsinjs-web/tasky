export type TaskStatus = 'todo' | 'inprogress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type TaskType = 'habit' | 'task'
export type GoalStatus = 'active' | 'completed' | 'abandoned'
export type CalendarProvider = 'google'
export type SyncDirection = 'task_to_google'
export type EventSource = 'native' | 'task'
export type EventStatus = 'confirmed' | 'cancelled'
export type ExternalSyncState = 'pending' | 'synced' | 'error' | 'disabled'
export type SyncOutboxOperation = 'upsert' | 'delete'
export type SyncOutboxStatus = 'queued' | 'processing' | 'done' | 'failed' | 'dead'

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

export type SubtaskStatus = 'todo' | 'done'
export interface TaskSubtask {
  id: string
  task_id: string
  user_id?: string
  title: string
  status: SubtaskStatus
  sort_order: number
  created_at: string
  updated_at?: string
}

export interface Tag {
  id: string
  user_id?: string
  name: string
  normalized_name: string
  color?: string | null
  created_at: string
}

export interface Reminder {
  id: string
  user_id?: string
  task_id: string
  remind_at: string
  channel: 'in_app' | 'email'
  state: 'pending' | 'sent' | 'snoozed' | 'dismissed'
  snoozed_until?: string | null
  sent_at?: string | null
  created_at: string
  updated_at?: string
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
  time?: string | null
  end_time?: string | null    // "HH:MM" 24-hour, only for habits
  task_type?: TaskType        // 'habit' | 'task', defaults to 'task'
  category_id: string | null
  category?: Category | null
  date: string | null // ISO date string (YYYY-MM-DD) or null for backlog tasks
  end_date?: string | null
  recurrence?: RecurrenceRule | null
  status: TaskStatus
  priority: TaskPriority
  sort_order?: number
  links?: TaskLink[]
  attachments?: TaskAttachment[]
  goal_id?: string | null     // FK to goals table
  goal?: Goal | null          // joined when needed
  created_at: string
  updated_at?: string
  completed_at?: string | null
  deleted_at?: string | null
  is_projected?: boolean
  source_task_id?: string | null
}

export interface Goal {
  id: string
  user_id?: string
  title: string
  description?: string | null
  start_date?: string | null   // YYYY-MM-DD
  end_date?: string | null     // YYYY-MM-DD
  status: GoalStatus
  color?: string | null
  sort_order?: number
  created_at: string
  updated_at?: string
  // Derived fields (computed client-side, not from DB)
  task_count?: number
  completed_task_count?: number
  progress?: number            // 0–100
}

export interface HabitStreak {
  task_id: string
  user_id?: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
}

export interface TaskActivityLog {
  id: number
  user_id: string
  task_id?: string | null
  action_type: 'soft_delete' | 'bulk_soft_delete' | 'restore'
  action_payload: Record<string, unknown>
  created_at: string
  expires_at?: string | null
}

export interface CalendarConnection {
  id: string
  user_id: string
  provider: CalendarProvider
  google_calendar_id: string
  google_refresh_token?: string | null
  google_access_token?: string | null
  google_access_token_expires_at?: string | null
  sync_enabled: boolean
  sync_direction: SyncDirection
  last_sync_at?: string | null
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  user_id: string
  title: string
  description?: string | null
  start_at: string
  end_at: string
  is_all_day: boolean
  timezone: string
  source: EventSource
  status: EventStatus
  created_at: string
  updated_at: string
}

export interface TaskEventLink {
  id: string
  user_id: string
  task_id: string
  event_id: string
  relation_type: 'scheduled_from_task'
  created_at: string
}

export interface ExternalEventMapping {
  id: string
  user_id: string
  event_id: string
  provider: CalendarProvider
  provider_calendar_id: string
  provider_event_id: string
  provider_etag?: string | null
  sync_state: ExternalSyncState
  last_synced_at?: string | null
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface CalendarSyncOutbox {
  id: number
  user_id: string
  provider: CalendarProvider
  event_id?: string | null
  operation: SyncOutboxOperation
  payload: Record<string, unknown>
  dedupe_key: string
  status: SyncOutboxStatus
  attempt_count: number
  next_attempt_at: string
  last_error?: string | null
  created_at: string
  updated_at: string
}

export interface RecurrenceRuleRow {
  id: string
  user_id: string
  task_id: string
  rule: RecurrenceRule
  timezone: string
  next_run_at?: string | null
  created_at: string
  updated_at: string
}

export interface TaskOccurrence {
  id: string
  user_id: string
  rule_id: string
  task_id: string
  occurrence_date: string
  occurrence_key: string
  state: 'projected' | 'materialized' | 'completed' | 'skipped'
  materialized_task_id?: string | null
  created_at: string
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type ProposalType = 'create_tasks' | 'reschedule_tasks'

export interface ProposedTask {
  title: string
  description?: string
  date?: string | null
  time?: string | null
  goal_id?: string | null
  priority?: TaskPriority
}

export interface ProposedReschedule {
  task_id: string
  task_title: string
  new_date?: string
  new_time?: string
  reason: string
}

export interface Proposal {
  type: 'proposal'
  proposal_type: ProposalType
  summary: string
  items: ProposedTask[] | ProposedReschedule[]
}
