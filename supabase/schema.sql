-- Supabase SQL: Run this in the Supabase SQL Editor to create or update schema.

create table if not exists categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  slug text not null unique,
  color text not null,
  accent text not null,
  short_label text not null,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  notes text,
  category_id uuid references categories(id) on delete set null,
  date date not null,
  status text not null default 'todo' check (status in ('todo', 'inprogress', 'done')),
  created_at timestamptz default now()
);

-- Indexes for fast queries
create index if not exists idx_tasks_date on tasks (date);
create index if not exists idx_tasks_category on tasks (category_id);
create index if not exists idx_tasks_status on tasks (status);

-- Seed default categories (safe to re-run)
insert into categories (name, slug, color, accent, short_label)
values
  ('Backend', 'backend', 'bg-blue-100 text-blue-700', 'border-l-blue-400', 'BE'),
  ('Cloud', 'cloud', 'bg-amber-100 text-amber-700', 'border-l-amber-400', 'AWS'),
  ('Agentic AI', 'agentic-ai', 'bg-violet-100 text-violet-700', 'border-l-violet-400', 'AI')
on conflict (slug) do nothing;

-- Row Level Security
alter table tasks enable row level security;
alter table categories enable row level security;

-- NOTE: Old permissive policies removed. User-scoped policies are defined in the
-- "User profiles, data isolation & personalization" migration below.

-- Migration: Make date nullable to support backlog tasks (run once in Supabase SQL Editor):
-- ALTER TABLE tasks ALTER COLUMN date DROP NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_tasks_backlog ON tasks (created_at) WHERE date IS NULL;

-- Migration: Add priority support (run once in Supabase SQL Editor):
-- ALTER TABLE tasks ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

-- Migration: Add links support (run once in Supabase SQL Editor):
-- ALTER TABLE tasks ADD COLUMN links jsonb DEFAULT '[]';

-- Migration: Add recurring instance source linkage (run once in Supabase SQL Editor):
-- ALTER TABLE tasks ADD COLUMN source_task_id uuid REFERENCES tasks(id) ON DELETE SET NULL;
-- CREATE INDEX IF NOT EXISTS idx_tasks_source_task ON tasks (source_task_id);

-- Migration: Add task attachments table (run once in Supabase SQL Editor):
-- CREATE TABLE IF NOT EXISTS task_attachments (
--   id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
--   task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
--   file_name text NOT NULL,
--   file_url text NOT NULL,
--   file_type text NOT NULL,
--   file_size bigint NOT NULL,
--   created_at timestamptz DEFAULT now()
-- );
-- CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments (task_id);
-- ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Authenticated users can read attachments" ON task_attachments FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can insert attachments" ON task_attachments FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Authenticated users can delete attachments" ON task_attachments FOR DELETE TO authenticated USING (true);

-- Migration: Add categories icon and sort_order (run once in Supabase SQL Editor):
-- ALTER TABLE categories ADD COLUMN icon text DEFAULT 'tag';
-- ALTER TABLE categories ADD COLUMN sort_order int DEFAULT 0;

-- Migration from old boolean completed column (run once if upgrading):
-- alter table tasks add column if not exists status text not null default 'todo' check (status in ('todo', 'inprogress', 'done'));
-- update tasks set status = 'done' where completed = true;
-- update tasks set status = 'todo' where completed = false;
-- alter table tasks drop column if exists completed;
-- alter table tasks drop constraint if exists tasks_category_id_fkey;
-- alter table tasks add constraint tasks_category_id_fkey foreign key (category_id) references categories(id) on delete set null;

-- ============================================================
-- Migration: User profiles, data isolation & personalization
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name text,
  avatar_url text,
  email text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- 2. Auto-create profile on signup via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Seed profiles for existing users (safe to re-run)
INSERT INTO profiles (id, display_name, avatar_url, email)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
  COALESCE(raw_user_meta_data->>'avatar_url', raw_user_meta_data->>'picture', ''),
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- 4. Add user_id to tasks, categories, task_attachments
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks (user_id);

ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories (user_id);

ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. IMPORTANT: Backfill existing data before changing RLS policies!
-- Find your user ID: SELECT id, email FROM auth.users;
-- Then run:
-- UPDATE tasks SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
-- UPDATE categories SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;
-- UPDATE task_attachments SET user_id = '<YOUR_USER_UUID>' WHERE user_id IS NULL;

-- 6. Drop old permissive RLS policies on tasks
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON tasks;
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON tasks;

-- 7. Create user-scoped RLS policies on tasks
CREATE POLICY "Users can read own tasks"
  ON tasks FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 8. Drop old permissive RLS policies on categories
DROP POLICY IF EXISTS "Authenticated users can read categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Authenticated users can delete categories" ON categories;

-- 9. Create user-scoped RLS policies on categories
CREATE POLICY "Users can read own categories"
  ON categories FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 10. Drop old permissive RLS policies on task_attachments
DROP POLICY IF EXISTS "Authenticated users can read attachments" ON task_attachments;
DROP POLICY IF EXISTS "Authenticated users can insert attachments" ON task_attachments;
DROP POLICY IF EXISTS "Authenticated users can delete attachments" ON task_attachments;

-- 11. Create user-scoped RLS policies on task_attachments
CREATE POLICY "Users can read own attachments"
  ON task_attachments FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own attachments"
  ON task_attachments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own attachments"
  ON task_attachments FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 12. Replace unique constraints on categories for per-user isolation
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_name_key;
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_slug_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_user_slug ON categories (user_id, slug);
