-- Phase 4: Task attachments support
-- Safe to run multiple times.

CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_task ON task_attachments (task_id);
CREATE INDEX IF NOT EXISTS idx_attachments_user ON task_attachments (user_id);
CREATE INDEX IF NOT EXISTS idx_attachments_created_at ON task_attachments (created_at DESC);

ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own attachments" ON task_attachments;
CREATE POLICY "Users can read own attachments"
  ON task_attachments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own attachments" ON task_attachments;
CREATE POLICY "Users can insert own attachments"
  ON task_attachments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own attachments" ON task_attachments;
CREATE POLICY "Users can delete own attachments"
  ON task_attachments FOR DELETE TO authenticated
  USING (user_id = auth.uid());
