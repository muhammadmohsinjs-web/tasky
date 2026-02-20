-- Add task time field for explicit time scheduling in create/edit flows.
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS time text;
CREATE INDEX IF NOT EXISTS idx_tasks_time ON tasks (time) WHERE time IS NOT NULL;
