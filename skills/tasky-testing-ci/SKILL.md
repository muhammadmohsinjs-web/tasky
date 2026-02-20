---
name: tasky-testing-ci
description: Use when validating Tasky changes with practical quality gates, including unit/component tests, linting, type-checking, and build verification.
---

# Tasky Testing and CI

## Use for
- Pre-merge verification
- Writing targeted tests for changed behavior
- Preventing regressions in hooks and UI components

## Test strategy
- Prefer focused tests near modified code (`*.test.ts(x)`/`*.spec.ts(x)`).
- Cover business logic in hooks first, then critical UI interaction paths.
- Avoid broad brittle snapshots.

## Standard commands
- `npm run lint`
- `npm run test:run`
- `npm run build`

Use targeted test runs first for speed, then full suite if change is broad.

## Minimum gate by change type
- Hook logic change: unit test + lint.
- UI interaction change: component test + lint.
- Data contract/schema change: relevant hook tests + build.
- Cross-cutting change: full lint + tests + build.

## Failure handling
1. Fix root-cause issue, not test-only symptoms.
2. Re-run smallest affected gate.
3. Re-run full required gate for confidence.

## CI readiness output
Include in final summary:
- commands run
- pass/fail status
- unexecuted gates (if any) and why
