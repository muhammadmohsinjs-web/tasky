---
name: tasky-vibe-coding
description: Use when building or refactoring Tasky features end-to-end with strong product sense, clean architecture, and fast iteration across UI, hooks, Supabase, and tests.
---

# Tasky Vibe Coding

## When to use
Use this as the default orchestration skill for Tasky work:
- New features touching multiple layers
- Refactors requiring safe migration and UI consistency
- Rapid iteration where quality still matters

## Required context to load first
- `AGENTS.md`
- `tasky.md` (if present)
- Relevant page/component/hook files in scope

## Workflow
1. Define outcome in one sentence.
2. Map change surface: page, components, hooks, `src/lib`, and `supabase/` impact.
3. Implement smallest vertical slice first.
4. Add or update tests nearest to changed logic.
5. Run quality gates (`lint`, targeted tests, then build when needed).
6. Summarize behavior change, risks, and follow-up options.

## Composition rules
- For Supabase schema/policy changes: apply `tasky-supabase-rls`.
- For calendar/backlog/task-flow UI: apply `tasky-calendar-ux`.
- For feature implementation details: apply `tasky-feature-delivery`.
- For verification and release checks: apply `tasky-testing-ci`.
- For backlog slicing and sprint execution: apply `tasky-roadmap-execution`.

## Guardrails
- Preserve current architecture: hooks for data logic, components for rendering.
- Keep TypeScript strict and explicit; avoid `any` unless unavoidable.
- Maintain user-scoped data assumptions (`user_id`, RLS-safe queries).
- Prefer incremental patches over broad rewrites.
- Never ship DB changes without migration notes and rollback thought.

## Done checklist
- Behavior works for happy path and obvious edge cases.
- Existing flows are not regressed.
- Tests and lint are green for changed surface.
- Output includes file-level change summary and next-step options.
