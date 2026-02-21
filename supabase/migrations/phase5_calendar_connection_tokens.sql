-- Phase 5: Persist Google OAuth tokens for background calendar sync
-- Safe to run multiple times.

ALTER TABLE calendar_connections
  ADD COLUMN IF NOT EXISTS google_refresh_token text,
  ADD COLUMN IF NOT EXISTS google_access_token text,
  ADD COLUMN IF NOT EXISTS google_access_token_expires_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_calendar_connections_sync_enabled
  ON calendar_connections (sync_enabled)
  WHERE sync_enabled = true;

