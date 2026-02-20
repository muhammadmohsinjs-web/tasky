---
name: tasky-calendar-ux
description: Use when changing Tasky calendar/list/backlog interactions, including monthly planning UI, drawer behavior, filtering, and status progression.
---

# Tasky Calendar UX

## Use for
- `CalendarPage` and monthly task flow updates
- Calendar/List/Backlog behavior consistency
- Task interaction tuning (selection, status toggle, search/filter)

## Canonical UX rules
- Task status cycle is 3-state and deterministic.
- Selected date drives sidebar/task context.
- Search/filter applies consistently across views.
- Desktop and mobile behavior should be explicitly validated.

## Change process
1. Start in `src/components/tasks/monthly/CalendarPage.tsx` and linked monthly components.
2. Confirm mapping between calendar UI status and DB status.
3. Keep view transitions stateless where possible (derive from shared source arrays).
4. Validate keyboard and pointer interactions for the changed controls.
5. Ensure empty/loading states still render correctly.

## Accessibility baseline
- Interactive controls require accessible labels.
- Keyboard path should support primary interactions.
- Maintain visible focus styles.

## Regression checks
- Month navigation + "Today" behavior
- Add task flow from modal
- Delete and status toggle in list/backlog/calendar views
- Mobile sidebar open/close behavior
