# Google Calendar Integration Plan

Last updated: February 20, 2026
Owner: Product + Engineering

## Objective
Integrate Google Calendar with Tasky so users can manage both `tasks` and `events` in one calendar workflow, with reliable two-way sync for create/update/delete actions.

## 1. Domain Definitions

### Event (calendar commitment)
An `event` is a time-bound schedule block that usually has a start and end, and may include attendees, location, meeting link, and recurrence exceptions.

Examples:
- Team standup (9:00-9:30)
- Doctor appointment (2:00-3:00)
- Flight (all-day or timed)

### Task (actionable work item)
A `task` is work to be completed. It may have a due date/time, but does not require attendees or a meeting window.

Examples:
- Finish API docs
- Review PR #142
- Submit invoice

### Event vs Task - product difference
- Primary purpose:
  - Event: reserve time on a calendar.
  - Task: track completion of work.
- Core lifecycle:
  - Event: scheduled -> updated/cancelled.
  - Task: todo -> inprogress -> done.
- Time model:
  - Event: start/end required (or all-day).
  - Task: optional scheduled slot; due date can exist without duration.
- Collaboration model:
  - Event: attendees, organizer, meeting metadata.
  - Task: assignee/owner context, completion state.

## 2. Integration Scope (MVP)
- Connect one or more Google accounts per Tasky user.
- Import selected Google calendars.
- Sync Google Calendar events <-> Tasky events (bidirectional).
- Support Tasky tasks in calendar UI and optional sync to a selected Google calendar.
- Preserve existing Tasky task workflow and status model.

Out of scope for MVP:
- Google Tasks API integration (we will model task sync via a dedicated Tasky-to-Google calendar mapping first).
- Full attendee editing UI parity with Google.

## 3. Fundamental Google Calendar Workflow (must align app behavior)
1. User authorizes via OAuth (`calendar.readonly` for import, `calendar` for bidirectional).
2. App stores connection + encrypted tokens.
3. User selects calendars to sync.
4. Initial import:
   - Fetch events from selected calendars.
   - Upsert into Tasky canonical tables.
   - Store mapping to provider IDs.
5. Incremental inbound sync:
   - Use Google `syncToken` per calendar for deltas.
   - Handle create/update/delete changes idempotently.
6. Outbound sync:
   - Any Tasky create/update/delete enqueues outbound job.
   - Worker pushes change to Google API.
7. Reliability:
   - Webhook notifications trigger fetch, not full processing inside webhook.
   - Polling reconciliation runs to recover missed webhooks.

## 4. Canonical Data Model Plan (schema changes required)

### 4.1 New tables
- `integration_connections`
  - `id`, `user_id`, `provider`, `provider_account_id`, `status`, encrypted tokens, `token_expires_at`, timestamps.
- `integration_calendars`
  - `id`, `connection_id`, `user_id`, `provider_calendar_id`, `name`, `timezone`, `is_selected`, `sync_direction`, `sync_token`, timestamps.
- `events`
  - `id`, `user_id`, `title`, `description`, `location`, `starts_at`, `ends_at`, `is_all_day`, `timezone`, `status`, `source`, `last_synced_at`, `updated_at`, timestamps.
- `external_mappings`
  - `id`, `user_id`, `entity_type` (`task` | `event`), `entity_id`, `provider`, `provider_calendar_id`, `provider_object_id`, `provider_etag`, timestamps.
- `sync_jobs` (optional if queue metadata is persisted in DB)
  - `id`, `user_id`, `connection_id`, `job_type`, `payload`, `status`, `attempt_count`, `next_retry_at`, timestamps.

### 4.2 Existing table updates
- `tasks`
  - add `scheduled_start_at` and `scheduled_end_at` for calendar-blocking tasks.
  - add `origin` (`manual` | `google_import` | `synced`).
  - keep status workflow unchanged.

### 4.3 RLS and indexing
- All new tables enforce `user_id = auth.uid()`.
- Composite indexes:
  - `events(user_id, starts_at)`
  - `external_mappings(user_id, entity_type, entity_id)`
  - unique `(provider, provider_object_id, provider_calendar_id, user_id)`

### 4.4 Migration strategy
- Additive-first migrations (no destructive changes).
- Backfill defaults for existing tasks.
- Release under feature flag (`google_calendar_sync_enabled`).

## 5. Sync Rules and Conflict Policy

### 5.1 Source-of-truth model
- Events: bidirectional sync by default for selected calendars.
- Tasks: local-first with optional mirrored calendar events in one configured Google calendar.

### 5.2 Conflict resolution (MVP)
- Use deterministic `last-writer-wins` based on normalized `updated_at`.
- Keep provider `etag`/version on mappings.
- Store conflict log for observability.

### 5.3 Delete semantics
- Soft delete internally first (`deleted_at` / `cancelled_at`).
- Propagate delete to Google.
- Treat provider `404` on delete as success (idempotent delete).

## 6. UI/UX Plan

### 6.1 Calendar surface
- Show both `task` and `event` chips on day cells.
- Visual type distinction:
  - Task: status-colored chip.
  - Event: time-range chip with event icon.
- Filters: `All`, `Tasks`, `Events`, `Synced only`.

### 6.2 Create/Edit flows
- Add `Create` split action: `Task` or `Event`.
- Event form fields: title, start/end, all-day, location, notes, source calendar.
- Task form remains current with optional "Block time" toggle.

### 6.3 Sync visibility
- Settings -> Integrations:
  - Connect/disconnect Google.
  - Calendar picker.
  - Sync direction per calendar.
  - Last synced at, health state, retry button.
- Per item badge: `Google synced`, `Pending sync`, `Sync failed`.

### 6.4 UX consistency requirements
- Maintain current status cycle behavior for tasks.
- Preserve mobile/desktop parity for filters and create flow.
- Keep keyboard + focus behavior accessible.

## 7. User Stories (phased)

## Phase 0 - Foundation
- US-GC-0.1: As a user, I can connect my Google account securely so my calendar data can sync.
- US-GC-0.2: As a system, I store canonical events separately from tasks so both workflows remain clear.
- US-GC-0.3: As an admin, I can trust user-level data isolation via RLS on all integration tables.

## Phase 1 - Read + Display
- US-GC-1.1: As a user, I can select which Google calendars to import.
- US-GC-1.2: As a user, imported Google events appear in my Tasky calendar with event-specific styling.
- US-GC-1.3: As a user, I can filter calendar by tasks/events.

## Phase 2 - Write + Sync
- US-GC-2.1: As a user, creating/updating/deleting a Tasky event syncs to Google.
- US-GC-2.2: As a user, changes made in Google are reflected in Tasky via delta sync.
- US-GC-2.3: As a user, sync conflicts resolve predictably and are visible.

## Phase 3 - Task Mirroring
- US-GC-3.1: As a user, I can choose to mirror selected tasks as Google calendar events.
- US-GC-3.2: As a user, task completion updates mirrored Google entries safely.
- US-GC-3.3: As a user, unscheduled backlog tasks are never auto-pushed until scheduled.

## Phase 4 - Reliability + Scale
- US-GC-4.1: As a user, webhook-triggered sync keeps changes fresh.
- US-GC-4.2: As a platform owner, polling reconciliation repairs missed webhooks.
- US-GC-4.3: As a user, I can see sync health and retry failed jobs.

## 8. Technical Execution Slices (dependency-aware)
1. Schema + RLS migrations for integration/events/mappings.
2. OAuth connect + secure token lifecycle.
3. Initial import worker + dedupe.
4. Calendar UI rendering for dual entities.
5. Outbound event sync worker.
6. Inbound delta sync with token cursor.
7. Conflict and delete/tombstone handling.
8. Sync health panel + retry UX.

## 9. Testing and Validation Gates
- Unit:
  - event/task mapping transforms
  - conflict resolver
  - sync payload builders
- Integration:
  - OAuth callback + token persistence
  - initial import idempotency
  - inbound/outbound sync round trip
- UX/E2E:
  - create event in Tasky -> appears in Google
  - create event in Google -> appears in Tasky
  - create task in Tasky -> mirrored only when configured
- Security:
  - cross-user read/write blocked by RLS on new tables

## 10. Rollout and Risk Controls
- Feature flags:
  - `google_calendar_sync_enabled`
  - `event_entity_enabled`
  - `task_mirroring_enabled`
- Rollout steps:
  - internal users -> beta cohort -> full rollout
- Observability:
  - metrics: sync lag, job failure rate, duplicate rate, conflict rate
  - alerts: token refresh failures, webhook failures, quota/rate-limit spikes

## 11. Immediate Next Steps (start this sprint)
1. Finalize schema SQL draft for new tables + indexes + RLS.
2. Implement OAuth connect flow and connection persistence.
3. Build read-only import to render Google events in calendar before enabling bidirectional writes.

## 12. Documentation Cleanup Completed
Superseded docs removed in favor of this focused integration plan:
- `FUTURE_PLANS.md`
- `FUTURE_PLANS_EXECUTION.md`
