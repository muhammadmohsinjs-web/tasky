---
name: tasky-fullstack-standard-coding
description: Use when acting as a fullstack developer for Tasky to deliver simple, standard, maintainable code with minimal complexity and strong bug-avoidance practices.
---

# Tasky Fullstack Standard Coding

## When to use
Use this skill for feature work, bug fixes, and refactors where the goal is:
- standard industry patterns
- simplest possible implementation
- low-risk, low-bug delivery

## Core principles
- Prefer boring, proven patterns over clever abstractions.
- Choose the simplest solution that satisfies requirements.
- Keep changes small, readable, and easy to test.
- Optimize for maintainability first, then micro-optimizations.

## Fullstack implementation rules
1. Start from behavior, then map to data, then map to UI.
2. Keep domain/data logic in hooks and utilities, not deeply in components.
3. Keep components focused on rendering and interaction.
4. Use explicit TypeScript types and existing project unions/interfaces.
5. Reuse existing constants and patterns before introducing new ones.

## Simplicity checklist
- Can this be done by extending existing hook/function instead of adding new layers?
- Are there fewer branches and fewer states possible?
- Is each function doing one clear thing?
- Are names clear without extra comments?

## Bug-avoidance checklist
- Validate assumptions at boundaries (inputs, nullability, async errors).
- Handle loading/empty/error states for user-facing flows.
- Keep optimistic updates paired with rollback or invalidation.
- Preserve existing RLS/user ownership assumptions for DB writes.
- Avoid hidden side effects and duplicated logic.

## Code quality gates
Run the smallest useful set first, then broader checks as needed:
- `npm run lint`
- targeted tests for changed files/logic
- `npm run test:run` for broader changes
- `npm run build` for type and build safety

## Output expectations
When finishing work, report:
1. what changed
2. why this is the simplest safe solution
3. what was verified
4. any residual risks

## Anti-patterns to avoid
- Unnecessary abstractions or generic frameworks for one-off needs
- Large rewrites when incremental edits work
- Silent failures without user/developer feedback
- New schema or API complexity without clear product need
