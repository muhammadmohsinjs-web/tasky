# Tasky Future Plans - Execution Pack

This file converts `FUTURE_PLANS.md` into implementation-ready sprint planning artifacts.

## Assumptions
- Sprint length: 2 weeks
- Team: 2 full-stack engineers, 1 part-time QA
- Deployment model: feature flags enabled for risky sync paths

## Epic Breakdown (Jira-Ready)

### EPIC FP0 - Foundation and Baseline
Objective: Make the platform safe for Google integration.
Stories:
- FP-0.1 Multi-tenant Integration Connection Model
- FP-0.2 Canonical Event/Task Schema
- FP-0.3 Secure Token Storage
- FP-0.4 Background Job Infrastructure
Definition of Success:
- Tenant isolation validated in tests and RLS
- Canonical schema migrated in production safely
- Token security and queue reliability baseline complete

### EPIC FP1 - OAuth and One-Way Import
Objective: Connect Google and complete first successful import.
Stories:
- FP-1.1 Google OAuth Connect Flow
- FP-1.2 Calendar and Task List Selection
- FP-1.3 Initial Import Job
- FP-1.4 Read-Only Sync Status Panel
Definition of Success:
- User can connect, select sources, import, and view sync status

### EPIC FP2 - Bidirectional Sync MVP
Objective: Enable safe two-way sync.
Stories:
- FP-2.1 Outbound Event/Task Updates
- FP-2.2 Inbound Delta Sync
- FP-2.3 Conflict Detection and Resolution Rules
- FP-2.4 Delete and Tombstone Handling
Definition of Success:
- Create/update/delete are consistent across systems under retry and failure scenarios

### EPIC FP3 - Reliability and Edge Cases
Objective: Raise sync quality for production scale.
Stories:
- FP-3.1 Webhook + Polling Hybrid
- FP-3.2 Recurring Events and Exceptions
- FP-3.3 Shared Calendar Support
- FP-3.4 Quota and Rate-Limit Controls
Definition of Success:
- Missed webhook recovery, recurring correctness, shared calendar permissions, and quota protections proven

### EPIC FP4 - Productization and Monetization
Objective: Convert sync into a paid, controllable feature set.
Stories:
- FP-4.1 Sync Direction Controls
- FP-4.2 Plan-Based Entitlements
- FP-4.3 Admin and Audit Reporting
- FP-4.4 Billing and Upgrade Nudges
Definition of Success:
- Entitlements and UX controls are live with measurable conversion funnel

### EPIC FP5 - Enterprise and Expansion
Objective: Prepare for larger customers and multi-provider roadmap.
Stories:
- FP-5.1 Security and Compliance Controls
- FP-5.2 Provider Abstraction Layer
- FP-5.3 Migration Safety Playbook
Definition of Success:
- Security controls and provider abstraction allow expansion beyond Google without core rewrite

## Ticket Template (Copy/Paste for Jira)

Use this for each story in `FUTURE_PLANS.md`.

```md
Title: [FP-x.y] <Story Name>
Type: Story
Epic Link: EPIC FPx
Priority: <P0|P1|P2>
Labels: sync, google, calendar, tasks, multi-tenant

User Story:
As a <role>, I want <goal>, so that <outcome>.

Scope:
- <in-scope bullet 1>
- <in-scope bullet 2>
- <out-of-scope note>

Acceptance Criteria:
- [ ] <criterion 1>
- [ ] <criterion 2>
- [ ] <criterion 3>

Technical Notes:
- DB/Migration: <yes/no + files>
- API: <endpoint(s)>
- UI: <screen/component>
- Jobs/Workers: <queue names>
- Observability: <metrics/logs/alerts>

Test Plan:
- Unit: <what>
- Integration: <what>
- E2E: <what>

Rollout Plan:
- Feature flag: <flag_name>
- Enablement sequence: dev -> staging -> prod partial -> prod full
- Rollback: <specific rollback action>
```

## Sprint Plan by Phase

## Sprint 1 - FP0 Core Platform
Target stories:
- FP-0.1
- FP-0.2
Deliverables:
- New canonical tables and migrations in `supabase/migrations`
- RLS policies for integration entities
- Basic integration connection CRUD service
Exit Criteria:
- Tenant isolation tests pass
- Migration validated in staging

## Sprint 2 - FP0 Security + Jobs
Target stories:
- FP-0.3
- FP-0.4
Deliverables:
- Token encryption/decryption module
- Queue topology and retry/idempotency support
- Operational dashboard baseline (queue depth, failures)
Exit Criteria:
- Token security tests pass
- Failed job retry behavior verified

## Sprint 3 - FP1 OAuth Connect
Target stories:
- FP-1.1
- FP-1.2
Deliverables:
- Google connect flow with state validation
- Calendar/tasklist picker UI
- Persisted sync preferences
Exit Criteria:
- OAuth success and denied-consent cases handled

## Sprint 4 - FP1 Initial Import
Target stories:
- FP-1.3
- FP-1.4
Deliverables:
- Initial import worker
- Import dedupe logic
- Sync status panel in app
Exit Criteria:
- First import works end-to-end for selected sources

## Sprint 5 - FP2 Sync Write Paths
Target stories:
- FP-2.1
- FP-2.2
Deliverables:
- Outbound update/create/delete sync
- Inbound delta sync cursor persistence
Exit Criteria:
- Round-trip sync successful on staging data set

## Sprint 6 - FP2 Conflict and Delete Safety
Target stories:
- FP-2.3
- FP-2.4
Deliverables:
- Conflict detection and deterministic policy
- Tombstone/recovery flow
Exit Criteria:
- Conflict and delete scenarios validated via integration tests

## Sprint 7 - FP3 Reliability Engine
Target stories:
- FP-3.1
- FP-3.4
Deliverables:
- Webhook ingestion pipeline
- Reconciliation polling fallback
- Adaptive rate limiting and alerts
Exit Criteria:
- Sync lag and quota alerts functioning

## Sprint 8 - FP3 Edge Cases
Target stories:
- FP-3.2
- FP-3.3
Deliverables:
- Recurrence support with exceptions
- Shared calendar ACL-aware behavior
Exit Criteria:
- Recurrence and shared calendar test suites pass

## Sprint 9 - FP4 Productization
Target stories:
- FP-4.1
- FP-4.2
- FP-4.4
Deliverables:
- Direction controls in settings UI
- Plan gating for sync capabilities
- Upgrade prompts and analytics events
Exit Criteria:
- Feature gating verified in free/pro/enterprise accounts

## Sprint 10 - FP4/FP5 Enterprise Path
Target stories:
- FP-4.3
- FP-5.1
- FP-5.2
- FP-5.3 (start)
Deliverables:
- Admin audit exports
- Initial enterprise security controls
- Provider adapter interface
- Draft migration runbook
Exit Criteria:
- Enterprise pilot readiness checklist completed

## Dependency and Critical Path Map

Hard dependencies:
- FP-0.1 -> FP-1.1, FP-1.2, FP-1.3
- FP-0.2 -> FP-1.3, FP-2.1, FP-2.2, FP-3.2
- FP-0.3 -> FP-1.1
- FP-0.4 -> FP-1.3, FP-2.1, FP-2.2, FP-3.1
- FP-1.1 -> FP-1.2, FP-1.3
- FP-1.3 -> FP-2.1, FP-2.2
- FP-2.2 -> FP-3.1
- FP-2.3 -> FP-4.1
- FP-3.4 -> FP-4.2 (pricing reliability promise)
- FP-5.2 -> future Microsoft/ICS expansion

Critical path to GA bidirectional sync:
1. FP-0.1
2. FP-0.2
3. FP-0.3
4. FP-0.4
5. FP-1.1
6. FP-1.2
7. FP-1.3
8. FP-2.1
9. FP-2.2
10. FP-2.3
11. FP-2.4
12. FP-3.1
13. FP-3.4

## Risk Register (Top 8)

1. Token revocation spikes cause widespread sync failures.
Mitigation: proactive reauth state + alerts + graceful UI messaging.

2. Cursor corruption creates silent data drift.
Mitigation: transactional cursor updates + nightly reconciliation.

3. Rate-limit exhaustion impacts all tenants.
Mitigation: per-tenant throttles + global circuit breaker.

4. Conflict policy erodes trust if users see unexpected overwrites.
Mitigation: conflict inbox + audit trail + reversible deletes.

5. Recurrence edge cases break data parity.
Mitigation: dedicated recurrence test matrix before GA.

6. Shared calendar ACL mismatch causes noisy failures.
Mitigation: permission pre-check and source-specific error UI.

7. Webhook reliability gaps create stale sync.
Mitigation: hybrid webhook + polling architecture.

8. Over-coupling to Google blocks expansion.
Mitigation: provider adapter abstraction in FP-5.2.

## Immediate Next Backlog Setup

Create these first 8 Jira tickets now:
- FP-0.1
- FP-0.2
- FP-0.3
- FP-0.4
- FP-1.1
- FP-1.2
- FP-1.3
- FP-1.4

Then set milestone: `Google Sync MVP` covering FP0 + FP1 + FP2.
