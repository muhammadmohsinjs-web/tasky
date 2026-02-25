-- Phase 7: Phase 1 Foundation Baseline
-- Purpose:
-- 1) Reproducible baseline for calendar sync/event tables used by runtime code.
-- 2) Soft-delete and undo/audit foundation for tasks.
-- Safe to run multiple times.

-- ---------------------------------------------------------------------------
-- Task soft-delete + activity log foundation
-- ---------------------------------------------------------------------------

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_tasks_user_date_active
  ON tasks (user_id, date)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_user_status_active
  ON tasks (user_id, status)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS task_activity_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  action_type text NOT NULL CHECK (action_type IN ('soft_delete', 'bulk_soft_delete', 'restore')),
  action_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own task activity log" ON task_activity_log;
CREATE POLICY "Users can read own task activity log"
  ON task_activity_log FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own task activity log" ON task_activity_log;
CREATE POLICY "Users can insert own task activity log"
  ON task_activity_log FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_activity_log_user_created_at
  ON task_activity_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_activity_log_task_created_at
  ON task_activity_log (task_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Calendar sync + event baseline tables (runtime dependencies)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  google_calendar_id text NOT NULL DEFAULT 'primary',
  sync_enabled boolean NOT NULL DEFAULT false,
  sync_direction text NOT NULL DEFAULT 'task_to_google' CHECK (sync_direction IN ('task_to_google')),
  last_sync_at timestamptz,
  google_refresh_token text,
  google_access_token text,
  google_access_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, provider)
);

ALTER TABLE calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own calendar connections" ON calendar_connections;
CREATE POLICY "Users can read own calendar connections"
  ON calendar_connections FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own calendar connections" ON calendar_connections;
CREATE POLICY "Users can insert own calendar connections"
  ON calendar_connections FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own calendar connections" ON calendar_connections;
CREATE POLICY "Users can update own calendar connections"
  ON calendar_connections FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own calendar connections" ON calendar_connections;
CREATE POLICY "Users can delete own calendar connections"
  ON calendar_connections FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user_provider
  ON calendar_connections (user_id, provider);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_sync_enabled
  ON calendar_connections (sync_enabled)
  WHERE sync_enabled = true;

CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_all_day boolean NOT NULL DEFAULT false,
  timezone text NOT NULL DEFAULT 'UTC',
  source text NOT NULL CHECK (source IN ('native', 'task')),
  status text NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own events" ON events;
CREATE POLICY "Users can read own events"
  ON events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own events" ON events;
CREATE POLICY "Users can insert own events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own events" ON events;
CREATE POLICY "Users can update own events"
  ON events FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own events" ON events;
CREATE POLICY "Users can delete own events"
  ON events FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_events_user_time
  ON events (user_id, start_at, end_at);

CREATE INDEX IF NOT EXISTS idx_events_user_status
  ON events (user_id, status);

CREATE TABLE IF NOT EXISTS task_event_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  relation_type text NOT NULL DEFAULT 'scheduled_from_task' CHECK (relation_type IN ('scheduled_from_task')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id),
  UNIQUE (user_id, event_id)
);

ALTER TABLE task_event_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own task event links" ON task_event_links;
CREATE POLICY "Users can read own task event links"
  ON task_event_links FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own task event links" ON task_event_links;
CREATE POLICY "Users can insert own task event links"
  ON task_event_links FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own task event links" ON task_event_links;
CREATE POLICY "Users can update own task event links"
  ON task_event_links FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own task event links" ON task_event_links;
CREATE POLICY "Users can delete own task event links"
  ON task_event_links FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_task_event_links_user_task
  ON task_event_links (user_id, task_id);

CREATE INDEX IF NOT EXISTS idx_task_event_links_user_event
  ON task_event_links (user_id, event_id);

CREATE TABLE IF NOT EXISTS external_event_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  provider_calendar_id text NOT NULL,
  provider_event_id text NOT NULL,
  provider_etag text,
  sync_state text NOT NULL DEFAULT 'pending' CHECK (sync_state IN ('pending', 'synced', 'error', 'disabled')),
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, event_id, provider),
  UNIQUE (user_id, provider, provider_calendar_id, provider_event_id)
);

ALTER TABLE external_event_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own external mappings" ON external_event_mappings;
CREATE POLICY "Users can read own external mappings"
  ON external_event_mappings FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own external mappings" ON external_event_mappings;
CREATE POLICY "Users can insert own external mappings"
  ON external_event_mappings FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own external mappings" ON external_event_mappings;
CREATE POLICY "Users can update own external mappings"
  ON external_event_mappings FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own external mappings" ON external_event_mappings;
CREATE POLICY "Users can delete own external mappings"
  ON external_event_mappings FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_external_event_mappings_user_event
  ON external_event_mappings (user_id, event_id);

CREATE INDEX IF NOT EXISTS idx_external_event_mappings_user_sync_state
  ON external_event_mappings (user_id, sync_state);

CREATE TABLE IF NOT EXISTS calendar_sync_outbox (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('google')),
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  operation text NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  dedupe_key text NOT NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed', 'dead')),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (dedupe_key)
);

ALTER TABLE calendar_sync_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own sync outbox" ON calendar_sync_outbox;
CREATE POLICY "Users can read own sync outbox"
  ON calendar_sync_outbox FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own sync outbox" ON calendar_sync_outbox;
CREATE POLICY "Users can insert own sync outbox"
  ON calendar_sync_outbox FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own sync outbox" ON calendar_sync_outbox;
CREATE POLICY "Users can update own sync outbox"
  ON calendar_sync_outbox FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own sync outbox" ON calendar_sync_outbox;
CREATE POLICY "Users can delete own sync outbox"
  ON calendar_sync_outbox FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_calendar_sync_outbox_user_status_next
  ON calendar_sync_outbox (user_id, status, next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_calendar_sync_outbox_user_event
  ON calendar_sync_outbox (user_id, event_id);

