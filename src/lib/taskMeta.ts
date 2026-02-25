import { supabase } from './supabase'
import { expandRecurrence, formatDateStr } from './recurrence'
import type { RecurrenceRule, SubtaskStatus } from '../types'

export interface TaskSubtaskDraft {
  id?: string
  title: string
  status: SubtaskStatus
  sort_order: number
}

export interface TaskMetaState {
  subtasks: TaskSubtaskDraft[]
  tags: string[]
  reminderAt: string | null
}

function normalizeTag(raw: string) {
  return raw.trim().replace(/\s+/g, ' ')
}

function normalizedTagKey(raw: string) {
  return normalizeTag(raw).toLowerCase()
}

async function resolveUserId(explicit?: string) {
  if (explicit) return explicit
  const { data: { session } } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

export async function loadTaskMeta(taskId: string): Promise<TaskMetaState> {
  const [subtasksRes, tagsRes, remindersRes] = await Promise.all([
    supabase
      .from('task_subtasks')
      .select('id,title,status,sort_order')
      .eq('task_id', taskId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('task_tags')
      .select('tag:tags(name)')
      .eq('task_id', taskId),
    supabase
      .from('reminders')
      .select('remind_at,state')
      .eq('task_id', taskId)
      .in('state', ['pending', 'snoozed'])
      .order('remind_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ])

  if (subtasksRes.error) throw subtasksRes.error
  if (tagsRes.error) throw tagsRes.error
  if (remindersRes.error) throw remindersRes.error

  const subtasks = ((subtasksRes.data as Array<{
    id: string
    title: string
    status: SubtaskStatus
    sort_order: number
  }>) ?? []).map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    sort_order: item.sort_order,
  }))

  const tags = ((tagsRes.data as Array<{ tag: { name: string } | Array<{ name: string }> | null }>) ?? [])
    .map((row) => {
      if (!row.tag) return null
      if (Array.isArray(row.tag)) return row.tag[0]?.name ?? null
      return row.tag.name
    })
    .filter((name): name is string => Boolean(name))

  const reminderAt = remindersRes.data?.remind_at ?? null

  return { subtasks, tags, reminderAt }
}

export async function syncSubtasks(params: {
  taskId: string
  userId?: string
  subtasks: TaskSubtaskDraft[]
}) {
  const userId = await resolveUserId(params.userId)
  if (!userId) return

  const normalized = params.subtasks
    .map((item, index) => ({
      id: item.id,
      title: item.title.trim(),
      status: item.status,
      sort_order: index,
    }))
    .filter((item) => item.title.length > 0)

  const incomingIds = new Set(normalized.map((item) => item.id).filter((id): id is string => Boolean(id)))

  const { data: existingRows, error: existingError } = await supabase
    .from('task_subtasks')
    .select('id')
    .eq('task_id', params.taskId)

  if (existingError) throw existingError

  const existingIds = ((existingRows as Array<{ id: string }>) ?? []).map((row) => row.id)
  const toDelete = existingIds.filter((id) => !incomingIds.has(id))

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('task_subtasks')
      .delete()
      .in('id', toDelete)
      .eq('task_id', params.taskId)

    if (deleteError) throw deleteError
  }

  const upsertRows = normalized.map((item) => ({
    id: item.id,
    user_id: userId,
    task_id: params.taskId,
    title: item.title,
    status: item.status,
    sort_order: item.sort_order,
    updated_at: new Date().toISOString(),
  }))

  if (upsertRows.length === 0) return

  const { error: upsertError } = await supabase
    .from('task_subtasks')
    .upsert(upsertRows, { onConflict: 'id' })

  if (upsertError) throw upsertError
}

export async function syncTags(params: {
  taskId: string
  userId?: string
  tags: string[]
}) {
  const userId = await resolveUserId(params.userId)
  if (!userId) return

  const normalizedUnique = Array.from(
    new Map(
      params.tags
        .map((tag) => normalizeTag(tag))
        .filter(Boolean)
        .map((name) => [normalizedTagKey(name), name] as const)
    ).values()
  )

  const { error: clearError } = await supabase
    .from('task_tags')
    .delete()
    .eq('task_id', params.taskId)

  if (clearError) throw clearError
  if (normalizedUnique.length === 0) return

  const tagRows = normalizedUnique.map((name) => ({
    user_id: userId,
    name,
    normalized_name: normalizedTagKey(name),
  }))

  const { error: tagUpsertError } = await supabase
    .from('tags')
    .upsert(tagRows, { onConflict: 'user_id,normalized_name' })

  if (tagUpsertError) throw tagUpsertError

  const normalizedKeys = normalizedUnique.map((name) => normalizedTagKey(name))
  const { data: tags, error: tagsLoadError } = await supabase
    .from('tags')
    .select('id,normalized_name')
    .eq('user_id', userId)
    .in('normalized_name', normalizedKeys)

  if (tagsLoadError) throw tagsLoadError

  const taskTagsRows = ((tags as Array<{ id: string }>) ?? []).map((tag) => ({
    user_id: userId,
    task_id: params.taskId,
    tag_id: tag.id,
  }))

  if (taskTagsRows.length === 0) return
  const { error: taskTagsError } = await supabase
    .from('task_tags')
    .upsert(taskTagsRows, { onConflict: 'user_id,task_id,tag_id' })

  if (taskTagsError) throw taskTagsError
}

export async function syncReminder(params: {
  taskId: string
  userId?: string
  reminderAt: string | null
}) {
  const userId = await resolveUserId(params.userId)
  if (!userId) return

  const { error: clearError } = await supabase
    .from('reminders')
    .delete()
    .eq('task_id', params.taskId)

  if (clearError) throw clearError
  if (!params.reminderAt) return

  const { error: insertError } = await supabase
    .from('reminders')
    .insert({
      user_id: userId,
      task_id: params.taskId,
      remind_at: params.reminderAt,
      channel: 'in_app',
      state: 'pending',
    })

  if (insertError) throw insertError
}

export async function syncRecurrenceV2(params: {
  taskId: string
  userId?: string
  taskDate: string | null
  recurrence: RecurrenceRule | null
}) {
  const userId = await resolveUserId(params.userId)
  if (!userId) return

  if (!params.taskDate || !params.recurrence) {
    const { data: existingRule, error: existingRuleError } = await supabase
      .from('recurrence_rules')
      .select('id')
      .eq('task_id', params.taskId)
      .eq('user_id', userId)
      .maybeSingle()

    if (existingRuleError) throw existingRuleError
    if (!existingRule?.id) return

    const { error: deleteOccurrencesError } = await supabase
      .from('task_occurrences')
      .delete()
      .eq('rule_id', existingRule.id)

    if (deleteOccurrencesError) throw deleteOccurrencesError

    const { error: deleteRuleError } = await supabase
      .from('recurrence_rules')
      .delete()
      .eq('id', existingRule.id)

    if (deleteRuleError) throw deleteRuleError
    return
  }

  const start = new Date(`${params.taskDate}T00:00:00`)
  const rangeEnd = new Date(start)
  rangeEnd.setDate(rangeEnd.getDate() + 180)
  const dates = expandRecurrence(params.taskDate, params.recurrence, start, rangeEnd)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

  const { data: ruleRow, error: upsertRuleError } = await supabase
    .from('recurrence_rules')
    .upsert({
      user_id: userId,
      task_id: params.taskId,
      rule: params.recurrence,
      timezone,
      next_run_at: dates.find((date) => date > formatDateStr(new Date())) ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,task_id' })
    .select('id')
    .single()

  if (upsertRuleError || !ruleRow?.id) throw upsertRuleError

  const { error: clearError } = await supabase
    .from('task_occurrences')
    .delete()
    .eq('rule_id', ruleRow.id)

  if (clearError) throw clearError

  const occurrenceRows = dates.map((date) => ({
    user_id: userId,
    rule_id: ruleRow.id as string,
    task_id: params.taskId,
    occurrence_date: date,
    occurrence_key: `${params.taskId}:${date}`,
    state: 'projected' as const,
  }))

  if (occurrenceRows.length === 0) return

  const { error: insertOccurrencesError } = await supabase
    .from('task_occurrences')
    .insert(occurrenceRows)

  if (insertOccurrencesError) throw insertOccurrencesError
}

export async function syncTaskMeta(params: {
  taskId: string
  userId?: string
  subtasks: TaskSubtaskDraft[]
  tags: string[]
  reminderAt: string | null
  recurrence: RecurrenceRule | null
  taskDate: string | null
}) {
  await Promise.all([
    syncSubtasks({ taskId: params.taskId, userId: params.userId, subtasks: params.subtasks }),
    syncTags({ taskId: params.taskId, userId: params.userId, tags: params.tags }),
    syncReminder({ taskId: params.taskId, userId: params.userId, reminderAt: params.reminderAt }),
    syncRecurrenceV2({
      taskId: params.taskId,
      userId: params.userId,
      taskDate: params.taskDate,
      recurrence: params.recurrence,
    }),
  ])
}
