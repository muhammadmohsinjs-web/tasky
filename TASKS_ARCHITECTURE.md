# Tasky Tasks Architecture (Canonical Surface)

## Canonical Task Experience
- Route: `/tasks`
- Entry file: `src/pages/Tasks.tsx`
- Canonical feature surface: `src/components/tasks/monthly/CalendarPage.tsx`

## Active Building Blocks
- `src/components/tasks/monthly/CalendarPage.tsx`
- `src/components/tasks/monthly/CalendarGrid.tsx`
- `src/components/tasks/monthly/TaskSidebar.tsx`
- `src/components/tasks/monthly/TaskCard.tsx`
- `src/components/tasks/monthly/AddTaskModal.tsx`
- `src/components/tasks/BulkAddModal.tsx`
- `src/hooks/useTasks.ts`
- `src/hooks/useBacklogTasks.ts`

## Removed Legacy Surfaces
The following legacy task surfaces were removed because they were not used by active routes and created duplicate implementation paths:
- `src/components/tasks/AddTaskInline.tsx`
- `src/components/tasks/BacklogList.tsx`
- `src/components/tasks/Calendar.tsx`
- `src/components/tasks/CommandPalette.tsx`
- `src/components/tasks/DateTasksSidebar.tsx`
- `src/components/tasks/MobileWeekStrip.tsx`
- `src/components/tasks/MultiDayBar.tsx`
- `src/components/tasks/TaskDetailPanel.tsx`
- `src/components/tasks/TaskItem.tsx`
- `src/components/tasks/TaskList.tsx`
- `src/components/tasks/TasksPanel.tsx`
- `src/components/tasks/month-view/*`

## Guardrail
When implementing new task features, extend the `monthly/` surface and shared task hooks instead of creating parallel task UIs.
