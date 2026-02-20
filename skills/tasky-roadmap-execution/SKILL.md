---
name: tasky-roadmap-execution
description: Use when translating Tasky plans and user stories into executable slices, sprint-ready tasks, and dependency-aware delivery order.
---

# Tasky Roadmap Execution

## Use for
- Turning planning docs into actionable implementation slices
- Sprint breakdown aligned with dependencies
- Prioritization between SaaS readiness and integration roadmap

## Source docs
- `FUTURE_PLANS.md`
- `FUTURE_PLANS_EXECUTION.md`
- `USER_STORIES.md`
- `PRODUCTION_READINESS_REVIEW.md`
- `IMPLEMENTATION_BLUEPRINT.md`

## Planning workflow
1. Pick one objective (example: auth hardening, sync MVP, calendar maturity).
2. Extract strict prerequisites and dependency chain.
3. Slice into thin vertical tasks (DB -> hook -> UI -> test).
4. Mark each task with risk, rollback, and validation gate.
5. Sequence by critical path, not by convenience.

## Prioritization heuristic
- P0 blockers first: auth, isolation, billing, infrastructure, legal.
- Then reliability and observability.
- Then growth/expansion features.

## Ticket quality checklist
Each task should include:
- clear user/business outcome
- in-scope and out-of-scope
- acceptance criteria
- touched files/modules
- test plan and rollout notes

## Output format
- 1 objective
- 5-10 execution tasks
- dependency notes
- estimated effort band
- immediate next 1-2 tasks to start coding
