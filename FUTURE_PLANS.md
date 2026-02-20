# Tasky Future Plans - Phased Actionable User Stories

## Planning Rules
- Story format: `As a <user>, I want <goal>, so that <outcome>.`
- Every story includes acceptance criteria that are testable.
- Phases are ordered by dependency and risk reduction.

## Phase 0 - Foundation and Architecture Baseline
Goal: Prepare data model, security, and infrastructure for safe Google integration.

### FP-0.1 Multi-tenant Integration Connection Model
Story: As a workspace admin, I want each Google connection isolated to my workspace so that cross-tenant data leakage is impossible.
Acceptance Criteria:
- Integration connections are stored with `workspace_id` and `user_id`.
- Queries are protected with RLS and return only current tenant rows.
- Automated test verifies user A cannot read user B connection metadata.

### FP-0.2 Canonical Event/Task Schema
Story: As a product team, we want internal canonical event/task entities so that Tasky is not locked to one provider.
Acceptance Criteria:
- DB tables exist for canonical events/tasks and external bindings.
- External provider IDs are not used as primary keys in core entities.
- Migration is reversible and documented in `supabase/migrations`.

### FP-0.3 Secure Token Storage
Story: As a security owner, I want OAuth tokens encrypted at rest so that compromised DB snapshots do not expose credentials.
Acceptance Criteria:
- Refresh tokens are encrypted before insert.
- Decryption is only possible in trusted backend context.
- Token read/write paths are covered by unit tests.

### FP-0.4 Background Job Infrastructure
Story: As an engineer, I want dedicated sync queues so that webhook spikes do not block user actions.
Acceptance Criteria:
- Separate queues exist for inbound sync, outbound sync, and reconciliation.
- Failed jobs retry with exponential backoff and jitter.
- Jobs include idempotency keys.

## Phase 1 - OAuth and Initial One-Way Import
Goal: Connect Google and import selected calendars/tasks safely.

### FP-1.1 Google OAuth Connect Flow
Story: As a user, I want to connect my Google account so that I can import my calendar and tasks.
Acceptance Criteria:
- OAuth consent flow completes and stores connection successfully.
- `state` and nonce are validated.
- Rejected consent displays actionable UI feedback.

### FP-1.2 Calendar and Task List Selection
Story: As a user, I want to choose which calendars/lists to sync so that irrelevant data is excluded.
Acceptance Criteria:
- UI shows all accessible calendars/task lists.
- User can select/deselect sources before first import.
- Preferences persist and are editable later.

### FP-1.3 Initial Import Job
Story: As a user, I want my selected Google data imported once connected so that I can start using Tasky immediately.
Acceptance Criteria:
- Import creates canonical entities and binding records.
- Duplicate imports do not create duplicates.
- Import status is visible in UI (`in progress`, `complete`, `failed`).

### FP-1.4 Read-Only Sync Status Panel
Story: As a user, I want to see sync health so that I know whether my data is current.
Acceptance Criteria:
- UI shows `last synced at`, source count, and error state.
- Failed imports show retry CTA.
- Status updates without full page reload.

## Phase 2 - Bidirectional Sync MVP
Goal: Enable safe two-way sync with conflict-aware behavior.

### FP-2.1 Outbound Event/Task Updates
Story: As a user, I want changes made in Tasky to update Google so that both systems stay aligned.
Acceptance Criteria:
- Create/update/delete operations sync to mapped Google objects.
- Sync writes are idempotent.
- Provider `404` on delete is treated as success.

### FP-2.2 Inbound Delta Sync
Story: As a user, I want Google-side edits reflected in Tasky so that manual duplication is unnecessary.
Acceptance Criteria:
- Delta sync uses provider cursor/sync token.
- Cursor is updated only after successful processing.
- Partial failures do not corrupt cursor state.

### FP-2.3 Conflict Detection and Resolution Rules
Story: As a user, I want predictable conflict handling so that no important change is silently lost.
Acceptance Criteria:
- Conflict detection triggers when both sides edit same entity in conflict window.
- Deterministic policy is implemented (`last-writer-wins` + source priority tiebreaker).
- Conflict events are logged and visible in UI.

### FP-2.4 Delete and Tombstone Handling
Story: As a user, I want deletions synced safely so that accidental data loss can be recovered.
Acceptance Criteria:
- Deletes become soft deletes (`deleted_at`) internally.
- Tombstones are retained for configured recovery period.
- Recovery flow restores item and re-syncs mapping.

## Phase 3 - Reliability, Scale, and Edge Cases
Goal: Reach production-grade sync behavior under load.

### FP-3.1 Webhook + Polling Hybrid
Story: As a platform owner, I want webhook-triggered sync with polling fallback so that missed notifications are repaired.
Acceptance Criteria:
- Webhooks enqueue delta jobs only (no full sync in webhook handler).
- Scheduled reconciliation runs at defined interval.
- Drift detector reports mismatched record counts.

### FP-3.2 Recurring Events and Exceptions
Story: As a user, I want recurring events handled correctly so that series and exceptions remain accurate.
Acceptance Criteria:
- Series master and exception instances are modeled separately.
- `this event` and `all events` edits are supported.
- Exception sync is covered by integration tests.

### FP-3.3 Shared Calendar Support
Story: As a user, I want shared calendars synced with proper permissions so that team schedules stay accurate.
Acceptance Criteria:
- Read/write behavior respects Google ACL roles.
- Permission errors are surfaced with source-specific message.
- Shared calendar sync can be independently disabled.

### FP-3.4 Quota and Rate-Limit Controls
Story: As an SRE, I want adaptive throttling so that provider quotas are not exhausted.
Acceptance Criteria:
- Per-tenant and per-connection rate limiting is implemented.
- `429/403 quota` responses trigger dynamic backoff.
- Alert fires when quota risk exceeds threshold.

## Phase 4 - Productization and Monetization
Goal: Turn sync capability into a reliable, monetizable product surface.

### FP-4.1 Sync Direction Controls
Story: As a user, I want per-source sync direction controls so that I can keep Google as master or Tasky as master based on workflow.
Acceptance Criteria:
- Modes available: `Tasky -> Google`, `Google -> Tasky`, `Bidirectional`.
- Mode change requires confirmation when destructive.
- Mode change is audit logged.

### FP-4.2 Plan-Based Entitlements
Story: As a business owner, I want sync features gated by plan so that premium value increases conversion and LTV.
Acceptance Criteria:
- Free: one-way import + manual refresh only.
- Pro: bidirectional + near-real-time sync.
- Enterprise: admin policies, audit export, priority sync queue.

### FP-4.3 Admin and Audit Reporting
Story: As an enterprise admin, I want audit logs and sync reports so that compliance and operational oversight are possible.
Acceptance Criteria:
- Exportable audit report includes actor, source, action, timestamp.
- Sync incident timeline available per workspace.
- Access to logs follows workspace roles.

### FP-4.4 Billing and Upgrade Nudges
Story: As a free user, I want clear upgrade prompts at the right time so that I understand premium sync benefits.
Acceptance Criteria:
- Upgrade prompts appear on blocked premium actions.
- Prompt includes exact feature gap and CTA.
- Conversion events tracked in analytics.

## Phase 5 - Enterprise Readiness and Ecosystem Expansion
Goal: Reduce platform risk and support larger customers.

### FP-5.1 Security and Compliance Controls
Story: As a security lead, I want enterprise controls so that regulated customers can adopt Tasky.
Acceptance Criteria:
- SSO/SAML and role-based access control are available.
- Data retention and delete workflows are configurable per workspace.
- Security events are logged and exportable.

### FP-5.2 Provider Abstraction Layer
Story: As a platform engineer, I want provider-agnostic sync interfaces so that adding Microsoft/ICS does not require core rewrites.
Acceptance Criteria:
- Adapter interface defined for read/write/delta/cursor ops.
- Google implementation is one adapter behind interface.
- Contract tests validate adapter conformance.

### FP-5.3 Migration Safety Playbook
Story: As an engineering manager, I want a pivot-safe migration plan so that source-of-truth strategy can evolve without downtime.
Acceptance Criteria:
- Runbook exists for switching ownership modes by workspace.
- Backfill scripts tested in staging with rollback steps.
- Success metrics defined (error rate, lag, data parity).

## Suggested Delivery Cadence
- Phase 0: 1 sprint
- Phase 1: 1 to 2 sprints
- Phase 2: 2 sprints
- Phase 3: 2 sprints
- Phase 4: 1 to 2 sprints
- Phase 5: 2+ sprints

## Definition of Done (All Phases)
- Story acceptance criteria validated in QA.
- Monitoring and alerting added for new sync paths.
- Documentation updated (`README.md` or dedicated runbook).
- Feature flags used for risky rollout changes.

## Execution Companion
- Detailed sprint plan, Jira ticket template, critical path, and risk register are in `FUTURE_PLANS_EXECUTION.md`.
