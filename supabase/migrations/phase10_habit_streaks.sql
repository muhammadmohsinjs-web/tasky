-- Phase 10: Create habit_streaks table
-- Tracks per-habit streak data. One row per habit task.
-- current_streak: number of consecutive recurrence days completed
-- longest_streak: all-time best streak for this habit
-- last_completed_date: the last date this habit was marked done (used for streak continuity logic)

CREATE TABLE IF NOT EXISTS habit_streaks (
  task_id              UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak       INT DEFAULT 0,
  longest_streak       INT DEFAULT 0,
  last_completed_date  DATE
);

ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit streaks"
  ON habit_streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
