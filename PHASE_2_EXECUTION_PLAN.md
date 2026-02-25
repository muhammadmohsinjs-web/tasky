# Phase 2 Execution Plan (Workflow Excellence)

## Objective
Ship Workflow Excellence as the second transformation phase: richer task modeling, high-velocity editing workflows, and deterministic execution behavior while preserving current single-user architecture.

## Scope Definition

### In Scope (Phase 2)
- Subtasks, tags, reminders, and recurrence normalization v2 (schema + API + UI).
- Multi-select bulk actions across list/backlog/scheduled contexts.
- Keyboard command system with a command palette for high-frequency actions.
- Modal payload evolution and task metadata persistence without breaking existing task CRUD.

### Out of Scope (Deferred)
- Multi-user collaboration and sharing.
- External reminder delivery channels (email/SMS worker pipeline).
- Full saved custom views and advanced integrations dashboard.
- Recurrence materialization worker orchestration beyond deterministic occurrence projection.

## Architecture Slices

### Slice A: Data Model Expansion (P0)
Dependencies: existing `tasks` table + auth/RLS baseline from prior phases.

Deliverables:
- New tables: `task_subtasks`, `tags`, `task_tags`, `reminders`, `recurrence_rules`, `task_occurrences`.
- RLS policies for full user isolation on each table.
- Query indexes supporting primary read/write paths.

Acceptance criteria:
- All new tables are idempotent migration-safe.
- User can only read/write rows where `user_id = auth.uid()`.
- Core lookups run on indexed predicates (`user_id`, `task_id`, state/date keys).

### Slice B: Metadata Service Layer (P0)
Dependencies: Slice A.

Deliverables:
- `src/lib/taskMeta.ts` service for load/sync of subtasks/tags/reminders/recurrence occurrences.
- Deterministic recurrence occurrence generation from existing recurrence utility.
- Unified API surface: `syncTaskMeta(...)`.

Acceptance criteria:
- Edit/create flows persist metadata in one call chain.
- Missing metadata is treated as empty state, not runtime failure.
- Recurrence mutation updates both rule row and occurrence projection.

### Slice C: UX + Workflow Engine (P0)
Dependencies: Slices A and B.

Deliverables:
- Add/Edit modal supports subtasks/tags/reminder/recurrence.
- Task list/backlog/calendar support multi-select and bulk action toolbar.
- Keyboard command support (`Cmd/Ctrl+K`, `N`, `/`, `X`, `B`, `D`).
- Command palette quick actions.

Acceptance criteria:
- User can update many tasks in one interaction.
- Power users can trigger high-frequency actions entirely by keyboard.
- New metadata fields round-trip between UI and DB.

### Slice D: Hardening + Validation (P0)
Dependencies: Slices A–C.

Deliverables:
- Lint/test/build gates green after integration.
- No type regressions in task hooks or calendar surfaces.

Acceptance criteria:
- `npm run lint` has zero errors.
- `npm run test:run` passes.
- `npm run build` passes.

## Execution Order and Dependency Map
1. Apply schema migration (foundation tables + RLS + indexes).
2. Introduce metadata service to isolate new persistence logic.
3. Extend modal payload and data entry controls.
4. Wire `CalendarPage` submit pipeline to call task CRUD then metadata sync.
5. Add bulk action state/handlers and keyboard command layer.
6. Patch task card/sidebar for selection behavior.
7. Validate with lint/tests/build.

## Risks and Controls
- Risk: Metadata tables not yet migrated in an environment.
  - Control: Data load failures are isolated and non-fatal in modal meta preload path.
- Risk: Bulk actions crossing scheduled/backlog stores can desync cache.
  - Control: Partition selected IDs by source and use existing hook bulk APIs for each source.
- Risk: Recurrence explosion on large ranges.
  - Control: Project deterministic 180-day window for v2 baseline.

## Immediate Execution Log (This Run)

### Completed
- [x] Added migration: `supabase/migrations/phase8_phase2_workflow_excellence.sql`
- [x] Added metadata service: `src/lib/taskMeta.ts`
- [x] Expanded types in `src/types.ts` for phase-2 entities.
- [x] Extended Add Task modal with subtasks/tags/reminder/recurrence fields.
- [x] Wired metadata sync into create/edit submit flow in calendar page.
- [x] Implemented multi-select bulk actions for list/backlog/calendar contexts.
- [x] Implemented keyboard shortcuts and command palette.
- [x] Added selection-aware rendering updates to task card and sidebar.
- [x] Extended backlog hook payload compatibility for recurrence/source linkage.
- [x] Verification complete:
  - [x] `npm run lint`
  - [x] `npm run test:run`
  - [x] `npm run build`

### Remaining (Phase 2 next increments)
- [ ] Inline editing in-place across list/calendar cards (reduce modal dependence).
- [ ] Dedicated integrations/sync-health settings surface.
- [ ] Saved custom views and quick-filter presets.
- [ ] Reminder dispatch worker + reliability telemetry (>99% dispatch SLO).

## Rollback Strategy
- Revert UI/service changes as one commit if needed.
- Keep migration forward-only; disable usage paths in UI if a hotfix rollback is required.
- Use existing task CRUD paths as fallback when metadata sync fails.

## Done Definition for Phase 2
Phase 2 is done when all P0 and P1 items above are shipped and validated, including inline editing and sync-health visibility, with no regression in task CRUD, list/backlog/calendar navigation, or build/test/lint gates.
