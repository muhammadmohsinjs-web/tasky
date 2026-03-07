-- Phase 15: Unify task/habit categories into categories.applies_to flag.

BEGIN;

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS applies_to TEXT NOT NULL DEFAULT 'task';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'categories_applies_to_check'
      AND conrelid = 'categories'::regclass
  ) THEN
    ALTER TABLE categories
      ADD CONSTRAINT categories_applies_to_check
      CHECK (applies_to IN ('task', 'habit', 'both'));
  END IF;
END $$;

-- If habits currently reference categories, those categories should be usable for habits too.
UPDATE categories c
SET applies_to = CASE WHEN c.applies_to = 'task' THEN 'both' ELSE c.applies_to END
WHERE EXISTS (SELECT 1 FROM habits h WHERE h.category_id = c.id);

-- Merge data from legacy habit_categories table when present.
DO $$
BEGIN
  IF to_regclass('public.habit_categories') IS NOT NULL THEN
    -- Mark shared IDs as both.
    UPDATE categories c
    SET applies_to = CASE WHEN c.applies_to = 'task' THEN 'both' ELSE c.applies_to END
    FROM habit_categories hc
    WHERE hc.id = c.id;

    -- Insert habit-only categories that do not exist in categories yet.
    INSERT INTO categories (
      id,
      user_id,
      name,
      slug,
      color,
      accent,
      short_label,
      icon,
      sort_order,
      created_at,
      applies_to
    )
    SELECT
      hc.id,
      hc.user_id,
      hc.name,
      CASE
        WHEN EXISTS (
          SELECT 1
          FROM categories c2
          WHERE c2.user_id = hc.user_id
            AND c2.slug = hc.slug
        ) THEN hc.slug || '-habit-' || substr(hc.id::text, 1, 8)
        ELSE hc.slug
      END,
      hc.color,
      hc.accent,
      hc.short_label,
      COALESCE(hc.icon, 'tag'),
      COALESCE(hc.sort_order, 0),
      COALESCE(hc.created_at, NOW()),
      'habit'
    FROM habit_categories hc
    WHERE NOT EXISTS (SELECT 1 FROM categories c WHERE c.id = hc.id);

    -- Move habits FK back to categories.
    ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_category_id_fkey;

    UPDATE habits h
    SET category_id = NULL
    WHERE category_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM categories c
        WHERE c.id = h.category_id
      );

    ALTER TABLE habits
      ADD CONSTRAINT habits_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

    DROP TABLE IF EXISTS habit_categories;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_categories_applies_to ON categories (applies_to);

COMMIT;
