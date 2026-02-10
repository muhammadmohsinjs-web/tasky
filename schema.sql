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

-- Migration from old boolean completed column (run once if upgrading):
-- alter table tasks add column if not exists status text not null default 'todo' check (status in ('todo', 'inprogress', 'done'));
-- update tasks set status = 'done' where completed = true;
-- update tasks set status = 'todo' where completed = false;
-- alter table tasks drop column if exists completed;
-- alter table tasks drop constraint if exists tasks_category_id_fkey;
-- alter table tasks add constraint tasks_category_id_fkey foreign key (category_id) references categories(id) on delete set null;
