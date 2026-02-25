# Phase 3 Execution Plan (Power + Differentiation)

## Objective
Deliver the Phase 3 differentiation layer that increases retention and reliability for serious individual operators:
- weekly planning cockpit for execution control,
- sync reliability hardening for calendar outbox durability,
- completion intelligence for recurrence progression and review loops.

## Strategic Constraints
- Single-user system only (no collaboration scope).
- Build on existing task + calendar + outbox architecture.
- Favor deterministic behavior and observable metrics over surface-level feature breadth.

## Phase 3 Scope

### P0 (Must ship)
1. Weekly planning cockpit
   - Capacity view per day (planned load vs target capacity).
   - Overdue carry-forward workflow (batch move overdue tasks into this week).
   - Focus queue (ranked execution list with one-click actions).
2. Sync reliability hardening
   - Outbox dedupe for active jobs.
   - Dead-letter replay path and stale-lock recovery.
   - SLO-oriented sync metrics in product UI.
3. Completion intelligence
   - Recurring completion review prompts.
   - One-click next-occurrence materialization from completed recurring work.

### P1 (Post-P0 in Phase 3)
- Calendar-native time-block improvements with reversible actions.
- Richer behavior metrics (capture-to-schedule, completion cycle time trend by category).

### P2 (Deferred)
- Premium automation/deep analytics pack.

## Dependency-Ordered Architecture Slices

### Slice A: Outbox Reliability Foundation (P0)
Changes:
- DB: partial unique dedupe index for active outbox jobs (`queued`/`failed`) by `(user_id, provider, event_id, operation)`.
- DB: indexing for dead/retry and done/recent telemetry reads.
- App: queue logic updates existing active outbox jobs instead of inserting duplicates.
- Worker: recover stale `processing` locks to `failed` for replay.

Acceptance:
- Duplicate active jobs for same event/operation are suppressed.
- Stuck processing jobs are recoverable automatically.
- Replay operations can re-queue recoverable jobs without manual row edits.

### Slice B: Planning Cockpit (P0)
Changes:
- New planning domain helpers (week windows, capacity math, focus scoring, recurrence review generation).
- New planning page with:
  - weekly capacity board,
  - overdue carry-forward batch action,
  - focus queue action rail,
  - completion review prompts.
- Route + sidebar integration.

Acceptance:
- User can rebalance weekly load in <60 seconds.
- Overdue backlog can be batch-forwarded to a chosen day.
- Focus queue supports direct status/schedule actions.

### Slice C: Completion Intelligence (P0)
Changes:
- Generate recurring review prompts from completed recurring tasks.
- Detect whether next occurrence already exists.
- Materialize the next occurrence task with explicit source linkage.

Acceptance:
- Recurring work does not silently end after completion.
- One-click progression action creates exactly one next actionable task.

### Slice D: Sync SLO Visibility (P0)
Changes:
- Expand outbox stats with 24h totals and success/dead rate.
- Show stale processing lock count.
- Add replay-recoverable action (dead + failed + stale processing).

Acceptance:
- Operators can assess sync health without DB access.
- Recovery actions are available in-product.

## Execution Plan (Immediate)
1. Add migration for outbox dedupe + SLO indexes.
2. Patch outbox enqueue logic in task mutations to dedupe/update active rows.
3. Add stale lock recovery in outbox processor.
4. Extend sync settings hook with SLO metrics + replay API.
5. Build planning helper library + tests.
6. Build `Planning` page and wire routes/navigation.
7. Surface SLO metrics in Dashboard.
8. Validate with lint, tests, and build.

## Risk Controls
- Race condition in dedupe path:
  - control: update-then-insert pattern with duplicate-key fallback update.
- Over-aggressive replay creating loops:
  - control: replay only `dead`/`failed`/stale-`processing`, reset timers explicitly.
- Planning actions breaking calendar sync:
  - control: reuse existing task mutation hooks that already manage event sync queueing.
- UX complexity drift:
  - control: keep cockpit actions explicit and one-layer deep.

## Success Metrics (Phase 3 P0)
- Outbox dead jobs remain <0.5% of processed 24h jobs.
- Sync success rate (24h) visible in UI and consistently >95% baseline.
- Weekly cockpit enables batch carry-forward and balancing in one screen.
- Recurring completion prompts produce next-occurrence tasks with source linkage.

## Immediate Execution Log (This Run)
- [x] Created this Phase 3 execution plan document.
- [x] Implemented migration + code changes.
- [x] Verified lint/tests/build.

## Done Definition
Phase 3 P0 is complete when reliability hardening, planning cockpit, and completion intelligence are shipped together with passing quality gates and measurable sync/weekly-planning telemetry visibility.
