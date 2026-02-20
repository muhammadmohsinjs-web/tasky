---
name: tasky-schema-migration-advisor
description: Use when a new Tasky feature may require database changes; this skill reviews current Supabase schema and code usage, then proposes safe migrations, RLS updates, backfill steps, and rollback guidance.
---

# Tasky Schema Migration Advisor

## When to use
Use this skill when the user asks any of the following:
- "Do we need a migration for this feature?"
- "Suggest DB changes for this new feature"
- "Check schema impact before implementation"
- "Write migration SQL with RLS and indexes"

## Required files to inspect first
- `supabase/schema.sql`
- `supabase/migrations/*.sql`
- `src/types.ts`
- `src/lib/constants.ts` (`TASK_SELECT`)
- Relevant hooks in `src/hooks/` and affected UI/component files

## Core objective
Given a feature request, determine whether schema changes are needed and produce an actionable migration proposal that is safe for production.

## Workflow
1. Restate feature intent as data requirements.
2. Compare requirements with existing entities, constraints, and policies.
3. Decide one of three outcomes:
   - `no migration needed`
   - `migration recommended`
   - `migration required before feature`
4. If migration is needed, produce:
   - SQL migration plan (additive-first)
   - required indexes and constraints
   - RLS policy changes
   - backfill strategy
   - app code touchpoints (`types`, selects, hooks, UI assumptions)
   - rollback plan
5. Flag risk level (`low`, `medium`, `high`) and why.

## Migration design rules
- Prefer additive, backward-compatible schema changes first.
- Never break existing reads/writes in same step unless explicitly requested.
- For user-owned tables, enforce `user_id = auth.uid()` patterns in RLS.
- Add indexes for new query patterns before scale issues appear.
- Keep enum/check constraints aligned with TypeScript unions.
- Update `TASK_SELECT` and TS types whenever columns change.

## Output format
Return migration advice in this exact structure:

1. `Schema impact`: brief yes/no + rationale.
2. `Proposed SQL`: concise migration snippet(s).
3. `RLS changes`: policy updates needed (or "none").
4. `Backfill/data migration`: exact steps (or "not required").
5. `App code updates`: files and fields to update.
6. `Rollback plan`: safe revert strategy.
7. `Risk notes`: key caveats and validation checklist.

## Validation checklist
- Existing app paths still work after migration.
- Owner user can read/write updated rows.
- Non-owner cannot access updated rows.
- Queries using new fields are indexed and typed.
- Build/tests/lint pass after code updates.

## Tasky-specific reminders
- Current key entities: `tasks`, `categories`, `profiles`, `task_attachments`.
- Current advanced task fields include `end_date`, `recurrence`, `source_task_id`, `sort_order`, `updated_at`.
- Feature work often requires synchronized edits across:
  - `supabase/migrations/*.sql`
  - `src/types.ts`
  - `src/lib/constants.ts`
  - `src/hooks/useTasks.ts` and related hooks
