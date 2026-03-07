-- Phase 16: Normalize tasks table to task-only rows.

BEGIN;

-- Convert any legacy non-task values to task.
UPDATE tasks
SET task_type = 'task'
WHERE task_type IS DISTINCT FROM 'task';

-- Ensure defaults are task-only going forward.
ALTER TABLE tasks
  ALTER COLUMN task_type SET DEFAULT 'task';

-- Recreate check constraint as task-only.
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS tasks_task_type_check;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type = 'task');

COMMIT;
