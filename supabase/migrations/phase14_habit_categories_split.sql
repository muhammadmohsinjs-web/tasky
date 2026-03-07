-- Phase 14: Separate habit categories from task categories.

BEGIN;

CREATE TABLE IF NOT EXISTS habit_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  color TEXT NOT NULL,
  accent TEXT NOT NULL,
  short_label TEXT NOT NULL,
  icon TEXT DEFAULT 'tag',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_habit_categories_user ON habit_categories (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_habit_categories_user_slug ON habit_categories (user_id, slug);

ALTER TABLE habit_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own habit categories" ON habit_categories;
CREATE POLICY "Users can read own habit categories"
  ON habit_categories FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own habit categories" ON habit_categories;
CREATE POLICY "Users can insert own habit categories"
  ON habit_categories FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own habit categories" ON habit_categories;
CREATE POLICY "Users can update own habit categories"
  ON habit_categories FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own habit categories" ON habit_categories;
CREATE POLICY "Users can delete own habit categories"
  ON habit_categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- Seed habit categories from existing task categories per user so options are available immediately.
INSERT INTO habit_categories (
  id,
  user_id,
  name,
  slug,
  color,
  accent,
  short_label,
  icon,
  sort_order,
  created_at
)
SELECT
  c.id,
  c.user_id,
  c.name,
  c.slug,
  c.color,
  c.accent,
  c.short_label,
  c.icon,
  COALESCE(c.sort_order, 0),
  c.created_at
FROM categories c
WHERE c.user_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Rebind habits.category_id to habit_categories.
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_category_id_fkey;

UPDATE habits h
SET category_id = NULL
WHERE category_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM habit_categories hc
    WHERE hc.id = h.category_id
  );

ALTER TABLE habits
  ADD CONSTRAINT habits_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES habit_categories(id) ON DELETE SET NULL;

COMMIT;
