-- Phase 10: Add task_type and end_time columns to tasks table
-- task_type discriminates between 'habit' and 'task' (defaults to 'task' for all existing rows)
-- end_time is for habits only, stored as "HH:MM" 24-hour string matching the existing `time` format

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task'
  CHECK (task_type IN ('habit', 'task'));

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Index for filtering habits efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks (task_type);
