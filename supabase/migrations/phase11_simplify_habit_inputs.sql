-- Phase 11: Simplify habit data model usage.
-- Keeps habits lightweight by removing non-essential metadata from existing habit rows.

BEGIN;

-- 1) Clear task-level detail/resource fields for habits.
UPDATE tasks
SET
  description = NULL,
  notes = NULL,
  links = '[]'::jsonb,
  end_time = NULL
WHERE task_type = 'habit';

-- 2) Remove file attachments from habits (if attachments table exists).
DO $$
BEGIN
  IF to_regclass('public.task_attachments') IS NOT NULL THEN
    EXECUTE $q$
      DELETE FROM task_attachments ta
      USING tasks t
      WHERE ta.task_id = t.id
        AND t.task_type = 'habit'
    $q$;
  END IF;
END $$;

-- 3) Remove task meta rows for habits when meta tables exist.
DO $$
BEGIN
  IF to_regclass('public.task_subtasks') IS NOT NULL THEN
    EXECUTE $q$
      DELETE FROM task_subtasks ts
      USING tasks t
      WHERE ts.task_id = t.id
        AND t.task_type = 'habit'
    $q$;
  END IF;

  IF to_regclass('public.task_tags') IS NOT NULL THEN
    EXECUTE $q$
      DELETE FROM task_tags tt
      USING tasks t
      WHERE tt.task_id = t.id
        AND t.task_type = 'habit'
    $q$;
  END IF;

  IF to_regclass('public.task_reminders') IS NOT NULL THEN
    EXECUTE $q$
      DELETE FROM task_reminders tr
      USING tasks t
      WHERE tr.task_id = t.id
        AND t.task_type = 'habit'
    $q$;
  END IF;
END $$;

COMMIT;
