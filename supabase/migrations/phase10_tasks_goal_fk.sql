-- Phase 10: Add goal_id foreign key to tasks table
-- ON DELETE SET NULL: deleting a goal does not delete its tasks — they become standalone.
-- Run this AFTER phase10_goals_table.sql

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks (goal_id);
