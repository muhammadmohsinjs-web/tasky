-- Phase 8: Workflow Excellence foundation (Phase 2)
-- Safe to run multiple times.

-- ---------------------------------------------------------------------------
-- Subtasks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS task_subtasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE task_subtasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own task subtasks" ON task_subtasks;
CREATE POLICY "Users can read own task subtasks"
  ON task_subtasks FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own task subtasks" ON task_subtasks;
CREATE POLICY "Users can insert own task subtasks"
  ON task_subtasks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own task subtasks" ON task_subtasks;
CREATE POLICY "Users can update own task subtasks"
  ON task_subtasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own task subtasks" ON task_subtasks;
CREATE POLICY "Users can delete own task subtasks"
  ON task_subtasks FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_subtasks_user_task_sort
  ON task_subtasks (user_id, task_id, sort_order);

-- ---------------------------------------------------------------------------
-- Tags and task-tag links
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  normalized_name text NOT NULL,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, normalized_name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own tags" ON tags;
CREATE POLICY "Users can read own tags"
  ON tags FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
CREATE POLICY "Users can insert own tags"
  ON tags FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own tags" ON tags;
CREATE POLICY "Users can update own tags"
  ON tags FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own tags" ON tags;
CREATE POLICY "Users can delete own tags"
  ON tags FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_tags_user_name
  ON tags (user_id, normalized_name);

CREATE TABLE IF NOT EXISTS task_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id, tag_id)
);

ALTER TABLE task_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own task tags" ON task_tags;
CREATE POLICY "Users can read own task tags"
  ON task_tags FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own task tags" ON task_tags;
CREATE POLICY "Users can insert own task tags"
  ON task_tags FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own task tags" ON task_tags;
CREATE POLICY "Users can delete own task tags"
  ON task_tags FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_tags_user_task
  ON task_tags (user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_task_tags_user_tag
  ON task_tags (user_id, tag_id);

-- ---------------------------------------------------------------------------
-- Reminders
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  remind_at timestamptz NOT NULL,
  channel text NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'email')),
  state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending', 'sent', 'snoozed', 'dismissed')),
  snoozed_until timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own reminders" ON reminders;
CREATE POLICY "Users can read own reminders"
  ON reminders FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
CREATE POLICY "Users can insert own reminders"
  ON reminders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
CREATE POLICY "Users can update own reminders"
  ON reminders FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;
CREATE POLICY "Users can delete own reminders"
  ON reminders FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_reminders_user_state_time
  ON reminders (user_id, state, remind_at);

CREATE INDEX IF NOT EXISTS idx_reminders_user_task
  ON reminders (user_id, task_id);

-- ---------------------------------------------------------------------------
-- Recurrence normalization (rules + occurrences)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  rule jsonb NOT NULL,
  timezone text NOT NULL DEFAULT 'UTC',
  next_run_at date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own recurrence rules" ON recurrence_rules;
CREATE POLICY "Users can read own recurrence rules"
  ON recurrence_rules FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own recurrence rules" ON recurrence_rules;
CREATE POLICY "Users can insert own recurrence rules"
  ON recurrence_rules FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own recurrence rules" ON recurrence_rules;
CREATE POLICY "Users can update own recurrence rules"
  ON recurrence_rules FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own recurrence rules" ON recurrence_rules;
CREATE POLICY "Users can delete own recurrence rules"
  ON recurrence_rules FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_recurrence_rules_user_next_run
  ON recurrence_rules (user_id, next_run_at);

CREATE TABLE IF NOT EXISTS task_occurrences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rule_id uuid NOT NULL REFERENCES recurrence_rules(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  occurrence_date date NOT NULL,
  occurrence_key text NOT NULL,
  state text NOT NULL DEFAULT 'projected' CHECK (state IN ('projected', 'materialized', 'completed', 'skipped')),
  materialized_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, rule_id, occurrence_key)
);

ALTER TABLE task_occurrences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own task occurrences" ON task_occurrences;
CREATE POLICY "Users can read own task occurrences"
  ON task_occurrences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own task occurrences" ON task_occurrences;
CREATE POLICY "Users can insert own task occurrences"
  ON task_occurrences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own task occurrences" ON task_occurrences;
CREATE POLICY "Users can update own task occurrences"
  ON task_occurrences FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own task occurrences" ON task_occurrences;
CREATE POLICY "Users can delete own task occurrences"
  ON task_occurrences FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_occurrences_user_date
  ON task_occurrences (user_id, occurrence_date);

