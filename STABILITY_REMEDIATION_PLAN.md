# Tasky Stability Remediation Plan

## Objective
Close all production-readiness gaps identified in the stability audit using dependency-aware phases and small, shippable chunks.

## Delivery Rules
- Ship by vertical slice: query/data -> hook -> UI -> tests -> CI check.
- No phase closes without passing: `npm run lint`, `npm run test:run`, `npm run build`.
- Each chunk must be releasable behind existing UX (no half-wired controls).

## Phase 0: Release Hygiene Baseline (P0)

### Chunk 0.1 - CI Signal Repair
**User Story US-001**  
As an engineer, I need reliable lint/build/test signals so I can trust release decisions.

**Scope**
- Exclude generated artifacts (like `storybook-static`) from lint scope.
- Fix current source lint failures.

**Acceptance Criteria**
- `npm run lint` returns 0 errors.
- No generated build artifacts are linted.
- Existing tests still pass.

**Touched Areas**
- `eslint.config.js` and/or ignore config
- `src/lib/recurrence.ts`
- `src/components/auth/__tests__/ProtectedRoute.test.tsx`

---

## Phase 1: Core Workflow Integrity (P0)

### Chunk 1.1 - Fix Calendar Range Query for Multi-Day Tasks
**User Story US-002**  
As a project manager, I need all tasks overlapping the selected month to appear so planning is accurate.

**Scope**
- Correct monthly query logic in `useTasks` to include tasks that start before month start but overlap into current month.

**Acceptance Criteria**
- Multi-day task starting in previous month appears in current month.
- Normal single-day tasks still load correctly.
- No duplicate task rendering.

**Touched Areas**
- `src/hooks/useTasks.ts`
- monthly calendar task tests (new)

### Chunk 1.2 - Prevent Modal Close on Failed Save
**User Story US-003**  
As a user, I need the task modal to stay open when save fails so I can retry without re-entering data.

**Scope**
- Change submit contract to return success/failure.
- Close modal only on success.

**Acceptance Criteria**
- On backend failure, modal remains open with data intact.
- On success, modal closes and task list refreshes.

**Touched Areas**
- `src/components/tasks/monthly/AddTaskModal.tsx`
- `src/components/tasks/monthly/CalendarPage.tsx`
- `src/hooks/useTasks.ts`
- `src/hooks/useBacklogTasks.ts`

---

## Phase 2: Consistency Across Scheduled vs Backlog Flows (P1)

### Chunk 2.1 - Unify Task Mutation Behavior
**User Story US-004**  
As a user, I need consistent behavior when editing scheduled or backlog tasks so outcomes are predictable.

**Scope**
- Align mutation response handling (success/failure/conflict) across `useTasks` and `useBacklogTasks`.
- Add conflict check parity for backlog edits where applicable.

**Acceptance Criteria**
- Scheduled and backlog edits follow same error/success UX.
- Conflict scenario shows deterministic message and refresh behavior.

**Touched Areas**
- `src/hooks/useTasks.ts`
- `src/hooks/useBacklogTasks.ts`
- optional shared helper in `src/lib/`

### Chunk 2.2 - Standardize Bulk Action Feedback
**User Story US-005**  
As a power user, I need clear bulk action outcomes so I can trust high-volume operations.

**Scope**
- Normalize success/error toasts and partial failure handling.
- Ensure bulk actions update all relevant queries.

**Acceptance Criteria**
- Bulk status/delete/reschedule results are explicit.
- No stale UI after bulk operations.

**Touched Areas**
- `src/hooks/useTasks.ts`
- `src/hooks/useBacklogTasks.ts`

---

## Phase 3: UX Dead-End Removal and State Completeness (P1)

### Chunk 3.1 - Resolve Inert Sidebar Filter Control
**User Story US-006**  
As a user, I need every visible control to work or be clearly disabled so I don’t hit dead ends.

**Scope**
- Implement sidebar filter action, or disable it with explicit messaging.

**Acceptance Criteria**
- Clicking filter control performs a real action or shows disabled state + reason.
- No deceptive interactive affordances remain.

**Touched Areas**
- `src/components/tasks/monthly/TaskSidebar.tsx`
- `src/components/tasks/monthly/CalendarPage.tsx`

### Chunk 3.2 - Add Calendar View Loading/Error/Empty Parity
**User Story US-007**  
As a user, I need clear calendar loading/error/empty states so I know what to do next.

**Scope**
- Add explicit loading and failure UI for calendar view.
- Add recovery action for error states.

**Acceptance Criteria**
- Calendar has visible loading, empty, and error states.
- Error state includes retry.

**Touched Areas**
- `src/components/tasks/monthly/CalendarPage.tsx`
- shared empty/error components

---

## Phase 4: Edge-Case Hardening (P1/P2)

### Chunk 4.1 - Attachment Upload Truthfulness
**User Story US-008**  
As a user, I need upload feedback to reflect actual successful files so I trust attachment state.

**Scope**
- Track per-file success count.
- Show mixed-result summary when some files fail.

**Acceptance Criteria**
- Success toast count equals successfully uploaded files.
- Failed files are reported clearly.

**Touched Areas**
- `src/lib/uploadAttachment.ts`
- `src/hooks/useTaskAttachments.ts` (if reused)

### Chunk 4.2 - Offline/Network Degradation UX
**User Story US-009**  
As a user, I need graceful offline behavior so I don’t lose confidence during network issues.

**Scope**
- Integrate `useOnlineStatus` into task views.
- Show offline banner/state and prevent misleading mutation attempts.

**Acceptance Criteria**
- Offline state is visible in task workflows.
- Mutation attempts while offline are blocked or clearly queued (explicitly choose one).

**Touched Areas**
- `src/hooks/useOnlineStatus.ts`
- `src/components/tasks/monthly/CalendarPage.tsx`
- optional `src/components/ui/EmptyState.tsx`

---

## Phase 5: Architecture Simplification and Debt Closure (P2)

### Chunk 5.1 - Legacy Task Surface Cleanup
**User Story US-010**  
As a developer, I need a single clear task UX surface so maintenance and onboarding are simpler.

**Scope**
- Audit unused task components and either remove or formally deprecate them.
- Keep one canonical task flow.

**Acceptance Criteria**
- Dead/unused task UI modules are removed or documented as intentionally unused.
- No duplicate competing task flows in active code path.

**Touched Areas**
- legacy task components under `src/components/tasks/` (non-monthly)
- docs update

---

## Dependency Map
1. Phase 0 must complete first (CI trust baseline).
2. Phase 1 precedes all UX polish (core flow correctness first).
3. Phase 2 depends on Phase 1 submit contract updates.
4. Phase 3 depends on stable mutation and query behavior from Phase 1-2.
5. Phase 4 can run partially parallel with Phase 3 after Phase 1.
6. Phase 5 only after core behavior is stable.

## Suggested Sprint Sequence (Chunks)
1. Sprint A: 0.1 + 1.1  
2. Sprint B: 1.2 + 2.1  
3. Sprint C: 2.2 + 3.1  
4. Sprint D: 3.2 + 4.1  
5. Sprint E: 4.2 + 5.1

## Definition of Done Per Chunk
- Story acceptance criteria met.
- Added/updated tests for changed behavior.
- No lint/test/build regressions.
- Brief release note added to PR: behavior change, risk, rollback.

## Start Here (Immediate Next Chunks)
1. Chunk 0.1 - CI Signal Repair  
2. Chunk 1.1 - Calendar Range Query Fix
