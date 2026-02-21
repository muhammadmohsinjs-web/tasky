-- Phase 6: Scheduler helper for automatic calendar sync
-- This migration creates a helper function. Scheduling is a manual SQL step
-- because project URL/keys/secrets are environment-specific.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE OR REPLACE FUNCTION public.run_calendar_sync_cron(
  project_url text,
  anon_key text,
  cron_secret text,
  user_limit int DEFAULT 20,
  job_limit int DEFAULT 50
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM net.http_post(
    url := project_url || '/functions/v1/calendar-sync-outbox',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', anon_key,
      'Authorization', 'Bearer ' || anon_key,
      'x-sync-secret', cron_secret
    ),
    body := jsonb_build_object(
      'userLimit', GREATEST(1, user_limit),
      'limit', GREATEST(1, job_limit)
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.run_calendar_sync_cron(text, text, text, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_calendar_sync_cron(text, text, text, int, int) TO postgres;

-- Manual setup (run once in SQL editor after replacing placeholders):
-- SELECT cron.schedule(
--   'calendar-sync-outbox-every-5-min',
--   '*/5 * * * *',
--   $$
--   SELECT public.run_calendar_sync_cron(
--     'https://<your-project-ref>.supabase.co',
--     '<your-anon-key>',
--     '<your-calendar-sync-cron-secret>',
--     20,
--     50
--   );
--   $$
-- );

-- To inspect jobs:
-- SELECT * FROM cron.job ORDER BY jobid DESC;

-- To remove the job later:
-- SELECT cron.unschedule('calendar-sync-outbox-every-5-min');
