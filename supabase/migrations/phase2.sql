-- Phase 2 Migration: Calendar Redesign — System Maturity
-- ======================================================

-- 1. updated_at column + auto-update trigger
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
UPDATE tasks SET updated_at = created_at WHERE updated_at IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON tasks;
CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. sort_order for manual ordering within a date
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tasks_sort ON tasks (date, sort_order);

-- 3. end_date for multi-day tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS end_date date;
CREATE INDEX IF NOT EXISTS idx_tasks_end_date ON tasks (end_date);

-- 4. recurrence JSONB column
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence jsonb DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_recurrence ON tasks ((recurrence IS NOT NULL)) WHERE recurrence IS NOT NULL;

-- 5. Link materialized recurring instances to their template
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS source_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_source_task ON tasks (source_task_id);

-- 6. Streak tracking in profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS streak jsonb DEFAULT '{"current": 0, "longest": 0, "last_completed_date": null}'::jsonb;
