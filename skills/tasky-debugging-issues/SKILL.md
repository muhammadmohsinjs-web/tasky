---
name: tasky-debugging-issues
description: Use when diagnosing bugs, regressions, runtime errors, failing tests/builds, or unexpected UI/data behavior in Tasky. Applies to frontend React/Vite code, hooks/query state, and Supabase-integrated flows where root-cause isolation and safe fixes are required.
---

# Tasky Debugging Issues

## Debugging workflow
1. Reproduce the issue with the smallest reliable scenario.
2. Classify failure type: runtime, state/logic, data contract, styling/interaction, build, or test.
3. Narrow to one layer at a time:
   - UI component/render path
   - Hook/query cache and invalidation path
   - Utility/business rule path
   - Supabase query/schema/policy path
4. Form one concrete hypothesis, then validate with direct evidence (logs, code path, query result, test failure output).
5. Implement the smallest fix that addresses root cause, not symptoms.
6. Verify with targeted checks, then run broader guardrails.

## Investigation checklist
- Capture exact failing path (screen/action/input/user state).
- Compare expected vs actual behavior with concrete values.
- Check recent related changes before broad refactors.
- Validate query keys, stale cache paths, and optimistic update rollback behavior.
- Confirm null/undefined handling around API boundaries and derived state.
- For Supabase-backed issues, verify selected columns, filters, and auth-sensitive assumptions.

## Fix standards
- Keep changes minimal and local to root cause.
- Preserve existing naming, types, and folder patterns.
- Add or update regression tests when bug behavior is deterministic.
- Avoid speculative cleanup in the same patch unless required for correctness.

## Verification
- Run targeted tests first for touched files/features.
- Run `npm run lint` and `npm run build` for cross-check.
- Re-test the original reproduction scenario after fix.
- Document root cause and why the fix prevents recurrence.

