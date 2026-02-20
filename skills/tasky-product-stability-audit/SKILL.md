---
name: tasky-product-stability-audit
description: Use when auditing Tasky workflows, UX consistency, feature reliability, edge-case handling, and production readiness. Trigger on requests for workflow evaluation, UX/system stability review, architectural risk detection, broken flow detection, dead-end state checks, and release-readiness verdicts.
---

# Tasky Product Stability Audit

## Skill Purpose
Perform a hard-nosed, system-level audit of Tasky as a SaaS product expected to scale to 100,000+ users. Evaluate workflow integrity, UX stability, feature reliability, and architectural readiness. Detect weak logic, broken paths, and dead ends, then provide prioritized, actionable fixes.

## Trigger Conditions
Use this skill when prompts include any of:
- Workflow audit, flow mapping, UX audit, product audit, production readiness
- Broken flow, dead end, missing state, edge case, feature stability
- System design review, architecture feedback, scaling risk
- Reliability validation across calendar, task list/sidebar, categories, bulk actions, status changes, header controls

## Inputs
Require or infer:
- `audit_scope`: feature areas/pages/components in scope
- `target_personas`: PMs, engineers, CTOs (default if not supplied)
- `release_stage`: prototype, beta, pre-production, production
- `evidence_sources`: code paths, known bugs, analytics, QA notes, test results
- `constraints`: delivery timeline, tech constraints, business priorities

If critical input is missing, ask up to 3 concise clarifying questions. Otherwise proceed with explicit assumptions.

## Evaluation Logic
Run this audit sequence in order:

1. Workflow mapping
- Map primary flows end-to-end:
  - Create task
  - Edit task
  - Delete task
  - Bulk add/update
  - Change category
  - Update status
  - Navigate calendar (month/day transitions and selection)
  - Use task list/sidebar + header controls
- For each flow, capture: entry point, steps, state transitions, exit states, failure points.
- Flag:
  - Friction (extra clicks, context switching, hidden actions)
  - Missing states (loading, empty, error, partial-success)
  - Broken transitions or circular confusion loops
  - Dead-end states (no clear recovery or next action)

2. UX stability audit
- Validate pattern consistency (buttons, labels, status chips, bulk actions, feedback messages).
- Check hierarchy clarity (primary vs secondary actions, visual emphasis, information scent).
- Test mental-model alignment:
  - Do users predict what will happen before clicking?
  - Are list/calendar/category behaviors coherent across views?
- Detect cognitive overload:
  - Too many visible controls
  - Ambiguous states
  - High memory burden between screens

3. Feature stability validation
- Analyze logical correctness and dependency integrity:
  - Cross-feature coupling (calendar/list/sidebar/category/status sync)
  - Race conditions and stale UI risks
  - Mutation side effects after bulk actions
  - Error recovery and idempotency behavior
- Validate edge cases explicitly:
  - Empty workspace/new account
  - Large dataset and pagination pressure
  - Offline/slow network behavior
  - Concurrent edits
  - Invalid dates/category references
  - Permission and auth-state transitions

4. Business and product evaluation
- Judge whether current workflows serve core outcomes:
  - Speed of task capture
  - Prioritization clarity
  - Execution tracking confidence
- Detect bloat/redundancy:
  - Duplicate controls
  - Overlapping feature pathways
  - Low-value complexity
- Identify simplification opportunities that preserve power users.

5. Stability verdict scoring
- Assign severity to each finding:
  - `Critical`: blocks core flow, data-risk, or severe trust break
  - `Major`: high friction, repeated confusion, or reliability weakness
  - `Minor`: polish/consistency issue with low failure risk
- Determine final verdict:
  - `✅ Stable & Production-Ready`: no critical findings, max 2 major findings, edge-case handling acceptable, no dead-end flow
  - `⚠️ Needs Minor Refinement`: no critical findings, 3-6 major findings or notable consistency debt
  - `❌ Structural Issues Detected`: any critical finding, or repeated dead-end/broken core workflows

## Output Schema (Strict)
Always return exactly these sections in this order:

1. `Executive Summary`
- 3-6 lines with system-level judgment, main risks, and immediate priority.

2. `Workflow Analysis (bullet format)`
- One bullet per core workflow with:
  - Flow health (`Healthy`, `Fragile`, `Broken`)
  - Friction points
  - Missing states
  - Dead-end check result

3. `UX Observations`
- Pattern consistency, hierarchy clarity, mental-model alignment, cognitive load.

4. `Stability & Edge Case Audit`
- Reliability findings, dependency risks, and explicit edge-case coverage status.

5. `Architectural Risks`
- Data flow, coupling, scalability, and maintainability risks.

6. `Improvement Recommendations (Prioritized)`
- Numbered list with `P0`, `P1`, `P2`.
- Each recommendation includes: impact, implementation direction, and expected risk reduction.

7. `Final Stability Verdict`
- One of:
  - `✅ Stable & Production-Ready`
  - `⚠️ Needs Minor Refinement`
  - `❌ Structural Issues Detected`
- Include concise justification tied to findings and severity.

## Non-Negotiable Audit Rules
- Be direct and analytical; avoid generic advice.
- Report whether all features are logically connected.
- Report whether any broken user flow exists.
- Report whether any dead-end state exists.
- Report whether edge cases are handled.
- Report whether the system appears stable and production-ready.
- Prefer concrete, testable recommendations over broad opinions.
