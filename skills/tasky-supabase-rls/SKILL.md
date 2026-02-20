---
name: tasky-supabase-rls
description: Use when modifying Tasky database schema, migrations, Supabase policies, or user-scoped data access patterns with production-safe guardrails.
---

# Tasky Supabase and RLS

## Use for
- Table changes in `supabase/schema.sql` and `supabase/migrations/`
- Policy updates for `tasks`, `categories`, `profiles`, `task_attachments`
- Query changes that depend on tenant/user isolation

## Non-negotiables
- Every user-owned table must enforce `user_id = auth.uid()` in RLS.
- New columns need migration-safe defaults/backfill strategy.
- Indexes must support new hot queries.
- Data model changes must be reflected in `src/types.ts` and hook queries.

## Migration workflow
1. Define schema delta and expected app behavior.
2. Write additive migration first (safe rollout).
3. Add indexes and constraints deliberately.
4. Update or create RLS policies in same change set.
5. Document manual backfill steps when required.
6. Update hook select fields (`TASK_SELECT`) and mutations.

## Query safety checklist
- No broad cross-tenant query patterns.
- Writes include `user_id` where required.
- Realtime filters include current `user_id` when possible.

## Verification
- Test with at least two users conceptually: no cross-read, no cross-write.
- Confirm create/update/delete still works for owner.
- Validate policy behavior for attachments and related entities.
