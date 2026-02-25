# Tasky Transformation Execution Blueprint (90 Days)

## 1. System Diagnosis (Brutally Honest)

### Current architectural maturity
- The product is a strong beta with mature UI execution and immature platform reproducibility.
- Frontend experience quality is high, but backend/source-of-truth governance is inconsistent.
- Build/test are stable (`68` tests pass, build passes, lint has 2 warnings), but operational maturity is still below production SaaS standards.

### Evidence-backed drift
- Runtime depends on calendar sync tables (`calendar_connections`, `events`, `task_event_links`, `external_event_mappings`, `calendar_sync_outbox`) in code, but reproducible schema definitions are not present in migrations/schema baseline (`supabase/schema.sql`, `phase5_calendar_connection_tokens.sql`, `useTasks.ts`, `useEvents.ts`).
- Query strategy is anti-cache (`staleTime:0`, `gcTime:0`, always refetch), increasing cost/latency and backend pressure (`src/lib/queryClient.ts`).
- Event read-path is tightly coupled to Google API calls on user-facing queries, which is a scaling anti-pattern (`src/hooks/useEvents.ts`).

### Workflow integrity assessment
- Core task CRUD flow is healthy.
- Calendar/list/backlog switching works, but inbox-first capture is not a first-class workflow yet.
- Task lifecycle exists, but completion semantics are shallow (no reminder lifecycle, no recurring instance lifecycle, no undo, no archive pipeline).
- Events page is mostly read and navigation-oriented; task/event boundary is visible to engineers but not consistently visible to users.

### Technical debt classification
1. Reproducibility debt: schema/migration mismatch with live feature set.
2. Coupling debt: UI queries triggering integration behavior.
3. Dormant capability debt: recurrence projection hook, suggestions hook, attachment hook, and large design-system surface mostly unused.
4. Domain debt: missing canonical entities (subtasks, tags, reminders, normalized recurrence).
5. Operability debt: no CI pipeline in repo, heavy console logging in runtime paths, weak production observability controls.

### Product-market competitiveness gap
- Against Todoist/Asana/ClickUp class expectations, missing baseline power layer: subtasks, reminders, tags, keyboard command system, undo, smart views as first-class objects.
- Current product is visually competitive, workflow-depth underpowered.

### Scalability risk assessment
- `useAllTasks` loads all tasks for dashboard/analytics/categories; this will degrade materially with account growth.
- Reorder performs N update calls for N tasks.
- Sync worker claims jobs row-by-row; contention and duplicate processing risk increases with concurrency.
- Outbox dedupe key includes timestamp+UUID, effectively disabling dedupe behavior.

### Hidden complexity risks
- 100+ design-system files with minimal runtime usage increase cognitive and maintenance load.
- Service worker strategy currently unregisters and clears caches on load, conflicting with offline/PWA narrative (`src/lib/registerServiceWorker.ts`).
- Status mapping duplication (`todo/inprogress/done` vs `pending/in_progress/completed`) creates translation overhead and regression risk.

### Where architecture and UX are misaligned
- Schema includes recurrence fields, but recurrence is not a coherent user-facing workflow.
- Sort order exists, reorder API exists, but no delivered drag-sort interaction.
- Sync controls live inside dashboard operations panel, not in a dedicated integration control center.
- Product messaging emphasizes calendar-first clarity, while capture and triage model is still fragmented.

## 2. Target State Definition

### What a Task Operating System means here
- A single-user execution platform where capture, planning, execution, and review are one coherent loop.
- Task system is primary truth; calendar is planning and commitment surface, not competing task storage.
- Every user action is fast, reversible, and auditable.

### UX philosophy
- Primary mode: inbox-first capture.
- Secondary mode: calendar-native planning.
- Power mode: command-driven execution.
- Design rule: one-click triage from inbox to today/upcoming/backlog.

### Core entity model
- `tasks`: canonical actionable units.
- `task_subtasks`: checklist-level execution decomposition.
- `tags` + `task_tags`: flexible cross-cutting taxonomy.
- `categories`: stable strategic grouping.
- `recurrence_rules` + `task_occurrences`: deterministic recurring workflow.
- `reminders`: time-based prompt and escalation.
- `events`: scheduled commitments (local + synced external representation).
- `task_event_links`: mapping between task and event surfaces.
- `calendar_connections` + `external_event_mappings` + `calendar_sync_outbox`: integration reliability plane.
- `task_activity_log`: undo/audit/replay.

### System boundaries (Calendar vs Tasks)
- Tasks own status and completion.
- Events own time blocks and meeting metadata.
- If task is time-blocked, create/update linked event; task status never inferred from event acceptance.
- External Google events are imported into event layer; task creation from event is explicit user action.

### Collaboration model
- Keep single-user in 90-day plan.
- Future-proof with `workspace_id` nullable columns and policy-ready table patterns, but do not ship team workflows now.

### Power-user layer architecture
- Command bus + keyboard map + bulk selection engine + undo manager.
- Saved views (Today, Overdue, Upcoming, Waiting, Review) persisted per user.
- All high-frequency actions available without modal dependency.

## 3. Schema Evolution Plan

### New tables/entities
1. `task_subtasks`
- `id, user_id, task_id, title, status(todo|done), sort_order, completed_at, created_at, updated_at`
2. `tags`
- `id, user_id, name, normalized_name, color, created_at`
3. `task_tags`
- `user_id, task_id, tag_id, created_at` with unique `(user_id, task_id, tag_id)`
4. `reminders`
- `id, user_id, task_id, remind_at, channel(in_app|email), state(pending|sent|snoozed|dismissed), snoozed_until, sent_at`
5. `recurrence_rules`
- `id, user_id, task_id, rrule_text, timezone, until_at, count_limit, next_run_at, created_at, updated_at`
6. `task_occurrences`
- `id, user_id, rule_id, task_id, occurrence_date, occurrence_key, state(projected|materialized|completed|skipped), materialized_task_id`
7. `task_activity_log`
- `id, user_id, task_id, action_type, action_payload, created_at, expires_at` (undo window + audit)

### Mandatory baseline tables to codify in migrations (currently drift-prone)
- `calendar_connections`
- `events`
- `task_event_links`
- `external_event_mappings`
- `calendar_sync_outbox`

### Modified tables
- `tasks`: add `completed_at`, `deleted_at` (soft delete), `inbox_rank`, `timezone`, `last_action_id`, `archived_at`.
- `categories`: add `archived_at` (soft retirement without hard-delete shock).

### Migration safety plan
1. `M0 Baseline`: create missing integration tables and indexes with `IF NOT EXISTS`; lock reproducibility first.
2. `M1 Additive`: add new tables/columns, no destructive changes.
3. `M2 Backfill`: migrate `tasks.recurrence` JSONB into `recurrence_rules`; create initial `task_occurrences`.
4. `M3 Dual-write`: app writes old and new fields for one release cycle.
5. `M4 Cutover`: read only new structures; keep compatibility view for rollback.
6. `M5 Cleanup`: drop deprecated columns after two stable releases.

### Backward compatibility approach
- Dual-read/dual-write adapter for recurrence and reminders.
- Feature flags: `recurrence_v2`, `reminders_v1`, `subtasks_v1`, `tags_v1`.
- Rollback path: revert reads to legacy fields without data loss.

### Indexing strategy
- `tasks(user_id, date, status)` and partial `tasks(user_id) WHERE date IS NULL`.
- `tasks(user_id, updated_at DESC)` for sync and recent queries.
- `task_subtasks(user_id, task_id, sort_order)`.
- `tags(user_id, normalized_name)` unique.
- `task_tags(user_id, task_id)` and `task_tags(user_id, tag_id)`.
- `reminders(user_id, state, remind_at)` partial on `state='pending'`.
- `recurrence_rules(user_id, next_run_at)` partial on active rules.
- `task_occurrences(user_id, occurrence_date)` unique on `(user_id, rule_id, occurrence_key)`.
- `calendar_sync_outbox(user_id, status, next_attempt_at)` plus unique dedupe on active key.

### Recurrence normalization tradeoff
- Keep template task + normalized rule + generated occurrences.
- Tradeoff: more tables and jobs, but deterministic execution and correct completion semantics at scale.

### Reminder architecture tradeoff
- Table-driven reminders with background dispatcher.
- Tradeoff: adds job infra, but enables reliable in-app/email reminders and auditability.

### Subtask modeling tradeoff
- Separate `task_subtasks` table instead of self-referencing `tasks`.
- Tradeoff: extra join, but cleaner lifecycle and avoids parent/child status ambiguity.

### Tag modeling tradeoff
- Many-to-many (`task_tags`) instead of denormalized array.
- Tradeoff: slightly more query complexity, but clean filtering, uniqueness, and analytics.

## 4. Workflow Refactor Blueprint

### Inbox-first capture flow
1. Global quick capture (`N`): title + optional date/time/category/tag parsing.
2. Default create into inbox (`date = null`, status `todo`).
3. Immediate triage rail: `Today`, `Upcoming`, `Backlog`, `Someday`.
4. One-step schedule from inbox via inline date picker and keyboard shortcuts.

### Inline editing model
- Task row supports inline edit for title, date, priority, tags, status.
- Side panel remains for deep edit (notes, links, attachments, recurrence, reminders).
- No hard modal dependency for frequent edits.

### Status lifecycle redesign
- Keep states: `todo -> inprogress -> done`.
- Add lifecycle metadata: `completed_at`, `archived_at`, undo action reference.
- Explicit `reopen` behavior from done to todo/inprogress.

### Overdue/Today/Upcoming system
- System views are computed + persisted presets.
- Overdue: open tasks with `date < today`.
- Today: open tasks with `date = today`.
- Upcoming: open tasks in next 7 days.
- Backlog: unscheduled open tasks.
- Views share same bulk-action model and keyboard controls.

### Multi-select bulk action layer
- Shift-click and keyboard-range selection.
- Bulk actions: status set, schedule, move to backlog, assign category, add/remove tags, delete/archive.
- All bulk actions return structured result and support undo.

### Keyboard command system
- `/` focus search.
- `N` new task.
- `E` edit selected.
- `D` schedule today.
- `B` move to backlog.
- `X` complete selected.
- `Cmd/Ctrl+Z` undo last task mutation.
- `Cmd/Ctrl+K` command palette with fuzzy actions and view switching.

### Undo architecture
- Client: mutation command stack with 10-second toast undo.
- Server: `task_activity_log` stores reversible payload and expiry.
- For destructive actions, convert hard delete to soft delete until undo window closes.

### Completion semantics model
- Completing recurring occurrence marks occurrence completed and schedules next occurrence.
- Completing parent task can optionally auto-complete open subtasks (configurable default off).
- Completion updates streak only once per calendar day per user.
- Event-linked tasks: completion does not auto-delete event unless user explicitly chooses.

## 5. Performance & Scalability Fixes

### Sync job concurrency design
- Replace row-by-row claim with atomic DB claim RPC (`FOR UPDATE SKIP LOCKED`).
- Process jobs per user shard with bounded concurrency.
- Enforce dedupe uniqueness for active outbox rows by `(user_id, event_id, operation, active_state)`.

### Event-query decoupling
- Remove Google API fan-out from `useEvents` read path.
- Read UI only from local `events` table.
- Run inbound sync in background worker (cron/webhook trigger) to hydrate local events.
- UI remains responsive even when provider latency spikes.

### Bulk reordering efficiency
- Replace N update calls with single RPC (`unnest(ids, positions)` update join).
- Return updated rows in one round trip for optimistic reconciliation.

### Query indexing and query-shape improvements
- Stop unbounded `useAllTasks` for dashboards; use aggregated SQL views/materialized views.
- Use date-windowed queries for analytics and events.
- Add server-side pagination for long lists and heavy history views.

### Caching strategy
- Update query defaults: `staleTime 30-120s`, `gcTime 10-30m`, targeted invalidation.
- Include `user.id` in all query keys.
- Cache smart views and counts separately from full task payloads.

### Background job optimization
- Token refresh once per user execution cycle, not per job.
- Jittered retries and capped exponential backoff.
- Dead-letter queue with replay tooling and observability dashboard.

### Cost/latency mitigation
- Cap external API pulls by sync token/delta windows.
- Avoid duplicate Google fetches from both dashboard and events view.
- Reduce verbose production logging on hot paths.
- Define SLOs: task query p95 < 400ms, events query p95 < 600ms, sync lag p95 < 2 minutes.

## 6. Technical Debt Resolution Plan

### Dormant complexity to remove
- Archive or split unused design-system runtime surface (103 files, almost no app usage).
- Remove dead hooks/utilities not wired to product flow (`useCalendarProjection`, `useSuggestions`, unused attachment hook path, celebration utility).
- Remove contradictory offline/PWA artifacts until true offline write-sync is implemented.

### Features to fully activate
- Either ship recurrence end-to-end (UI + generation + completion) or remove recurrence fields from user model temporarily.
- Activate manual ordering UX if `sort_order` remains in core model.
- Promote sync settings from dashboard controls into dedicated integration settings page.

### Hooks to consolidate
- Merge `useTasks`, `useBacklogTasks`, and `useAllTasks` into one task data-access layer with scoped query builders.
- Centralize task mutation logic to avoid duplicated behavior paths.
- Normalize status mapping once; eliminate UI/DB status translation duplication.

### Areas to simplify
- Consolidate task/event linking responsibilities into service layer, not hooks/pages.
- Standardize error surface and retry UX.
- Introduce typed API contracts for high-risk mutations.

### Test coverage expansion plan
- Target: 68 current tests to 220+ in 90 days.
- Priority suites: task mutation service, recurrence engine, reminders scheduler, outbox claim/dedupe, undo behavior, keyboard command regression, cross-view consistency.
- Add integration tests for migration backfills and RLS enforcement.
- Add end-to-end flows for inbox triage, bulk actions, recurrence completion, sync failure recovery.

### CI enforcement upgrades
- Add GitHub Actions pipeline: lint, typecheck, unit/integration tests, build.
- Enforce required checks before merge.
- Add migration lint + schema drift check.
- Add bundle-size guardrail and test coverage threshold gates.

## 7. 90-Day Execution Roadmap

### Phase 1 (Days 1-30): Stability + Core Parity

#### P0
1. Ship schema baseline migration for all runtime tables (including sync/event tables).
2. Refactor query client defaults and user-scoped query keys.
3. Decouple event read path from live Google calls.
4. Implement inbox-first smart views (`Inbox/Today/Upcoming/Overdue/Backlog`).
5. Add CI pipeline with merge gates.

#### P1
1. Consolidate task hooks into single data layer.
2. Introduce soft-delete + undo foundation (`task_activity_log`).

#### P2
1. Remove dead/offline contradictory artifacts and unused runtime modules.

#### Measurable success criteria
- Fresh environment setup requires zero manual SQL.
- Task list p95 < 400ms with 10k tasks/user simulation.
- Events page no longer calls provider APIs per render.
- CI required checks block broken merges.

### Phase 2 (Days 31-60): Workflow Excellence

#### P0
1. Ship subtasks, tags, reminders (schema + API + UI).
2. Launch multi-select bulk action engine.
3. Launch keyboard command system and command palette.
4. Ship recurrence normalization v2 with deterministic occurrence generation.

#### P1
1. Inline task editing across list/calendar.
2. Dedicated integrations settings page for sync health.

#### P2
1. Saved custom views and quick filters.

#### Measurable success criteria
- 80% of daily edits happen inline without modal dependency.
- Reminder dispatch reliability > 99% for due reminders.
- Bulk actions complete in < 500ms for 100-task batches.
- Keyboard-driven flows cover top 10 user actions.

### Phase 3 (Days 61-90): Power + Differentiation

#### P0
1. Weekly planning cockpit (capacity view + overdue drag-forward + focus queue).
2. Reliability hardening of sync worker (dedupe, dead-letter replay, SLO dashboards).
3. Completion intelligence (recurrence progression + review prompts).

#### P1
1. Calendar-native time-block from task improvements with reversible actions.
2. Analytics upgrade to behavior metrics (capture-to-schedule time, completion cycle time).

#### P2
1. Optional premium power-pack prep (advanced reminders, saved automations, deep analytics).

#### Measurable success criteria
- Weekly active users using planning cockpit > 45%.
- Sync dead jobs < 0.5% of total jobs.
- Median capture-to-schedule time reduced by 30%.
- 4-week retention improves by at least 15% vs Phase 1 baseline.

## 8. Risk Map

| Risk Type | Risk | Mitigation |
|---|---|---|
| Architectural | Schema drift continues between code and migrations | Freeze schema changes behind migration PR checklist + drift CI check |
| Architectural | Outbox duplication/lock contention at scale | Atomic claim RPC + dedupe constraints + replay tooling |
| Product | Building too much platform before workflow wins | Enforce phase gates tied to user workflow KPIs |
| UX | Inbox-first refactor confuses existing users | Progressive rollout with old/new view toggle for one release |
| Performance | Full-table queries regress with growth | Move to windowed queries + aggregates + pagination early in Phase 1 |
| Performance | External API latency affects UI | Strict event-query decoupling and background sync |
| Adoption | Power features increase complexity for casual users | Keep default simple; power features opt-in and keyboard-discoverable |
| Scope Creep | Collaboration/team features derail 90-day plan | Explicitly defer collaboration; no shared-workspace UI in current roadmap |
| Security | Token/storage handling expands attack surface | RLS verification tests + secret scanning + token lifecycle hardening |
| Delivery | Refactor causes regressions in core CRUD | High-priority regression suites + feature flags + phased rollout |

## 9. Product Positioning Clarification

### Strategic call
- Differentiate narrowly, do not compete broadly.

### Decisions
1. Compete broadly vs differentiate narrowly: differentiate narrowly.
2. Calendar-native wedge: yes, but anchored in inbox-to-calendar execution loop.
3. B2C vs B2B: B2C/prosumer first (solo operators, founders, ICs); defer team collaboration.
4. Feature depth vs clarity: depth in execution workflow (capture-triage-plan-complete-review), not breadth of enterprise surface area.

### Positioning statement
- The fastest way for serious individual operators to turn inbox chaos into calendar-backed execution.

## 10. Final Maturity Projection

| Stage | Score | Justification |
|---|---|---|
| Current | 5.8/10 (adjusted from 5.4) | Strong UX/build quality and functional core, but reproducibility drift, model gaps (subtasks/tags/reminders), and scaling coupling keep it below production-grade task OS maturity |
| Post-Phase-1 | 6.9/10 | Foundation hardened: reproducible schema, CI gating, decoupled event read path, clear inbox/today/upcoming system |
| Post-Phase-2 | 7.9/10 | Workflow depth reaches serious-user parity: subtasks, tags, reminders, recurrence v2, keyboard and bulk execution layer |
| Post-Phase-3 | 8.6/10 | Differentiation + reliability: planning cockpit, hardened sync SLOs, measurable execution outcomes; still below 9+ due collaboration and broader platform economics intentionally deferred |

