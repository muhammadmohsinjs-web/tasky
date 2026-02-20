---
name: tasky-feature-delivery
description: Use when implementing Tasky product features with existing patterns in React, hooks, TanStack Query, and Supabase-backed business logic.
---

# Tasky Feature Delivery

## Use for
- New feature flows (tasks, categories, analytics, dashboard)
- Refactors to hooks/components with behavior preservation
- Incremental UX improvements tied to business rules

## Project patterns
- Route-level composition in `src/pages/`
- Domain logic in hooks (`src/hooks/useX.ts`)
- Shared utilities in `src/lib/`
- Query-driven data state via TanStack Query
- Supabase calls in hooks/utils, not deep in leaf components

## Implementation steps
1. Identify primary hook that owns data for this feature.
2. Model UI state separately from server state.
3. Use optimistic updates only with rollback/invalidation strategy.
4. Keep mutation methods cohesive (`add`, `update`, `delete`, `bulk`).
5. Match existing naming and status/priority enums from `src/types.ts`.

## Coding standards
- 2-space indent, single quotes, small pure helpers.
- Co-locate view-specific helpers near the component.
- Reuse constants from `src/lib/constants.ts`.
- Add comments only where logic is non-obvious.

## Validation
- Run targeted tests for changed hooks/components.
- Check loading, empty, error, and offline behavior where applicable.
- Verify no query key mismatch and no stale cache regressions.
