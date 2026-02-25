-- Phase 9: Reliability hardening for calendar sync outbox (Phase 3)
-- Safe to run multiple times.

-- Prevent duplicate active jobs for the same event/operation while still allowing
-- historical rows (done/dead) to exist.
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_sync_outbox_active_dedupe
  ON calendar_sync_outbox (user_id, provider, event_id, operation)
  WHERE event_id IS NOT NULL AND status IN ('queued', 'failed');

-- Support dead-letter replay and stale lock inspection.
CREATE INDEX IF NOT EXISTS idx_calendar_sync_outbox_dead_updated
  ON calendar_sync_outbox (user_id, provider, updated_at DESC)
  WHERE status = 'dead';

CREATE INDEX IF NOT EXISTS idx_calendar_sync_outbox_processing_updated
  ON calendar_sync_outbox (user_id, provider, updated_at DESC)
  WHERE status = 'processing';

-- Support 24h sync SLO metric scans.
CREATE INDEX IF NOT EXISTS idx_calendar_sync_outbox_terminal_updated
  ON calendar_sync_outbox (user_id, provider, status, updated_at DESC)
  WHERE status IN ('done', 'dead', 'failed');
