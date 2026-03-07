-- Phase 12: Split habits into dedicated simplified table.

BEGIN;

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time TEXT,
  end_time TEXT,
  recurrence JSONB NOT NULL DEFAULT '{"frequency":"daily","interval":1,"end_date":null}'::jsonb,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done')),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure newer columns exist when this migration is re-run on an already-created table.
ALTER TABLE habits
  ADD COLUMN IF NOT EXISTS end_time TEXT;

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits (user_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_date ON habits (user_id, date);
CREATE INDEX IF NOT EXISTS idx_habits_user_status ON habits (user_id, status);
CREATE INDEX IF NOT EXISTS idx_habits_active ON habits (user_id) WHERE deleted_at IS NULL;

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own habits" ON habits;
CREATE POLICY "Users can read own habits"
  ON habits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own habits" ON habits;
CREATE POLICY "Users can insert own habits"
  ON habits FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own habits" ON habits;
CREATE POLICY "Users can update own habits"
  ON habits FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own habits" ON habits;
CREATE POLICY "Users can delete own habits"
  ON habits FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Backfill existing habit rows from tasks.
INSERT INTO habits (
  id,
  user_id,
  title,
  category_id,
  date,
  time,
  end_time,
  recurrence,
  status,
  completed_at,
  deleted_at,
  created_at,
  updated_at
)
SELECT
  t.id,
  t.user_id,
  t.title,
  t.category_id,
  COALESCE(t.date, (t.created_at AT TIME ZONE 'UTC')::date, CURRENT_DATE),
  t.time,
  t.end_time,
  COALESCE(t.recurrence::jsonb, '{"frequency":"daily","interval":1,"end_date":null}'::jsonb),
  CASE WHEN t.status = 'done' THEN 'done' ELSE 'todo' END,
  t.completed_at,
  t.deleted_at,
  t.created_at,
  COALESCE(t.updated_at, t.created_at, NOW())
FROM tasks t
WHERE t.task_type = 'habit'
ON CONFLICT (id) DO NOTHING;

-- Re-point streak FK to habits IDs (same IDs as old habit task rows).
ALTER TABLE habit_streaks DROP CONSTRAINT IF EXISTS habit_streaks_task_id_fkey;
ALTER TABLE habit_streaks
  ADD CONSTRAINT habit_streaks_task_id_fkey
  FOREIGN KEY (task_id) REFERENCES habits(id) ON DELETE CASCADE;

COMMIT;
