# Google OAuth Verification Package (Tasky)

Last updated: February 21, 2026

## 1) Scope-to-feature mapping

- `openid email profile`
  - User authentication and profile identity.
  - UI entry points: `/welcome`, app auth context.
  - Code: `src/contexts/AuthContext.tsx`.

- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
  - List the user's calendars to select sync target calendar.
  - UI entry points: Dashboard calendar selector and calendar refresh.
  - Code: `src/pages/Dashboard.tsx`, `src/hooks/useGoogleCalendarPreview.ts`, `supabase/functions/calendar-sync-outbox/index.ts`.

- `https://www.googleapis.com/auth/calendar.events`
  - Create/update/delete synced calendar events from tasks and read event details for merged events view.
  - UI entry points: Dashboard sync actions, Events page, task scheduling flow.
  - Code: `src/hooks/useCalendarSyncSettings.ts`, `src/hooks/useEvents.ts`, `src/hooks/useTasks.ts`, `supabase/functions/calendar-sync-outbox/index.ts`.

## 2) Public policy/support URLs (set in OAuth consent screen)

- Privacy Policy: `/privacy`
- Terms of Service: `/terms`
- Support: `/support`
- Google API Disclosure: `/google-api-disclosure`

These routes are public in `src/App.tsx` and linked from public pages (`src/pages/Landing.tsx`, `src/pages/Welcome.tsx`).

## 3) Data handling summary

- Stored Google-related data:
  - OAuth access/refresh tokens and token expiry in `calendar_connections`.
  - Provider mapping IDs in `external_event_mappings`.
  - Sync queue metadata in `calendar_sync_outbox`.
- Data is transmitted over HTTPS and stored in Supabase infrastructure.
- On `invalid_grant` token refresh errors, sync is disabled and stored Google tokens are cleared automatically.
  - Code: `supabase/functions/calendar-sync-outbox/index.ts`.

## 4) User controls required by verification

- Disconnect/revoke flow:
  - Dashboard action: **Disconnect Google**.
  - Server action: `action: "disconnectGoogle"` in `calendar-sync-outbox`.
  - Effect: best-effort Google token revocation, deletion of Google sync mappings/outbox rows, unlink task-event sync rows, and token removal.

- Data deletion flow:
  - In-product Google data deletion via Disconnect action.
  - Full data deletion request path documented in `/privacy` and `/support` via support email.

## 5) Reviewer walkthrough

1. Open `/welcome` and sign in with Google.
2. Navigate to `/dashboard`.
3. Click **Refresh Calendars**, confirm calendars load.
4. Enable sync and run **Run Sync Now**.
5. Verify events in `/events` and task-linked behavior.
6. Click **Disconnect Google** and confirm success toast.
7. Re-open dashboard; sync should be disabled and no Google sync metadata should remain active.

## 6) Reviewer test account checklist

Before submission, fill this:

- Reviewer login email: `<set before submission>`
- Reviewer password: `<set before submission>`
- App base URL on verified domain: `<set before submission>`
- OAuth client ID used for review project: `<set before submission>`

## 7) Compliance statement

Tasky's use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.

## 8) Remaining pre-submission tasks

- Ensure OAuth consent screen product name/logo/support email exactly match deployed app branding.
- Ensure all URLs in consent screen use the same verified production domain as the deployed app.
- Confirm support inbox ownership and response SLA coverage.
