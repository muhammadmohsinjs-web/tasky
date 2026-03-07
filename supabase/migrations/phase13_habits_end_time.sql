-- Phase 13: Add end_time to habits table.

BEGIN;

ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Backfill from legacy task rows when habit IDs match migrated tasks IDs.
UPDATE habits h
SET end_time = t.end_time
FROM tasks t
WHERE t.id = h.id
  AND t.task_type = 'habit'
  AND h.end_time IS NULL
  AND t.end_time IS NOT NULL;

COMMIT;
