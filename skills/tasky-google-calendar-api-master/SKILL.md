---
name: tasky-google-calendar-api-master
description: Expert workflow for Google Calendar API integration, including OAuth consent setup, token lifecycle management (access/refresh/revocation), push sync/webhooks, quota and rate-limit handling, resilient retry/backoff, and production-grade error handling. Use when prompts mention Google Calendar API, calendar sync, events.watch, OAuth scopes, token refresh failures, 401/403/429/5xx errors, incremental sync tokens, webhook channel issues, or any Google calendar integration debugging.
---

# Tasky Google Calendar API Master

## Core approach
1. Confirm integration mode: user OAuth, service account, or hybrid.
2. Confirm required scopes and least-privilege scope set.
3. Validate token lifecycle: issuance, secure storage, refresh, expiry handling, revocation handling.
4. Design sync strategy: initial full sync + incremental sync via `nextSyncToken`.
5. Add production reliability: idempotency, retries with jitter, quota-aware throttling, dead-letter handling.
6. Add observability: structured logs, error classification, correlation IDs, alert thresholds.

## OAuth and token handling checklist
- Use offline access when refresh tokens are required.
- Handle refresh token rotation and invalidation (`invalid_grant`) as a first-class state.
- Store token metadata (`expires_at`, scope set, last refresh status) for diagnostics.
- Re-auth users on non-recoverable auth failures; do not infinite-retry.
- Separate user-facing auth errors from transient API transport failures.

## Error handling playbook
- `401`/`invalid_token`: refresh once, then mark connection action-required.
- `403`/`insufficientPermissions`: detect scope mismatch; require reconnect with expanded scopes.
- `403`/quota variants (`rateLimitExceeded`, `userRateLimitExceeded`): exponential backoff + jitter and reduce batch pressure.
- `404` on watched resources: treat as stale channel/resource and recreate watch.
- `409` duplicates/conflicts: enforce idempotency keys and safe upsert semantics.
- `410` sync token invalid: discard token and perform bounded resync window.
- `429` and `5xx`: retry with capped backoff and retry budget.

## Quotas and rate limits
- Batch reads/writes conservatively and tune by error telemetry.
- Enforce per-user and global concurrency limits.
- Use queue-based backpressure rather than burst fanout.
- Track retry counts and stop after budget is exhausted.

## Webhooks and sync channels
- Persist channel metadata (`channelId`, `resourceId`, expiration).
- Renew watches before expiration with safety margin.
- Verify webhook authenticity using expected headers and channel state.
- Treat webhook delivery as a trigger, not source of truth; fetch deltas from API.

## Implementation expectations
- Prefer strongly typed Google API client wrappers.
- Keep side effects idempotent across retries.
- Isolate provider-specific logic behind adapter boundaries.
- Add tests for token refresh paths, rate-limit retries, webhook replay, and sync-token reset.

## Response style for this skill
- Provide concrete implementation steps, not generic advice.
- Include failure-mode matrix for auth, quota, sync, and webhook paths.
- Recommend exact logging fields and recovery actions per error class.
