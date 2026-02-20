# Tasky Calendar Redesign — Implementation Blueprint

## 1. Information Architecture Redesign

### Top-Level Navigation

| Route | Layer | Purpose |
|-------|-------|---------|
| `/dashboard` | Planning | Overview, stats, streaks |
| `/tasks` | Execution | Calendar / List / Backlog |
| `/categories` | Configuration | Category CRUD |
| `/analytics` | Reflection | Charts, trends |

### Interaction Flows

**Adding a task:**
1. Click `+` button in calendar cell → inline quick-add input expands inside cell (`AddTaskInline`)
2. Click a date cell → opens right-side Task Drawer → quick-add input at drawer top
3. Global `Cmd+K` shortcut → command palette with "Add task" action
4. Bulk Add modal (existing)

**Editing a task:**
1. Click task pill in calendar cell → `TaskDetailPanel` slides open in `edit` mode
2. Inside Task Drawer: click task row → expand inline edit form
3. Double-click task pill → direct inline title edit in cell

**Completing a task:**
1. Click status icon on task pill → cycles `todo → inprogress → done`
2. Inside drawer: checkbox toggle on task row
3. Completion triggers: confetti micro-animation on the cell's checkmark icon, 200ms green pulse

**Handling many tasks in one date:**
- Show max 3 task pills in cell
- Render `+N more` chip below the 3rd pill
- Clicking `+N more` opens the Task Drawer for that date
- Task Drawer shows full scrollable list with all actions

### CTA Hierarchy

| Level | Element | Location |
|-------|---------|----------|
| Primary | "Bulk Add" button | Page header |
| Secondary | Per-cell `+` quick add | Calendar cell bottom |
| Tertiary | Drawer quick-add input | Drawer header |

### Empty States

| State | Message | Action |
|-------|---------|--------|
| No tasks in day | Gray dashed border cell, no text | `+` button visible |
| No tasks in month | Illustration + "No tasks this month" | "Add your first task" CTA |
| No search results | "No tasks match '{query}'" | "Clear search" button |
| Filter returns empty | "No {category} tasks this month" | "Show all" button |
| Offline | Yellow banner at top: "You're offline. Changes will sync." | Auto-dismiss on reconnect |

---

## 2. Calendar System Redesign

### Task Overflow Pattern

```
Cell height: min-h-[140px] (desktop), min-h-[48px] (mobile)
Max visible tasks: 3 pills
Overflow: "+N more" chip (clickable)
```

Implementation in `Calendar.tsx`:
```tsx
const MAX_VISIBLE = 3
const visibleTasks = dayTasks.slice(0, MAX_VISIBLE)
const overflowCount = dayTasks.length - MAX_VISIBLE
```

### "+N more" Interaction

- Click → opens Task Drawer (right panel) pre-filtered to that date
- Hover → tooltip showing task titles as list
- Badge styling: `text-xs font-semibold text-brand-500 bg-brand-50 rounded-full px-2 py-0.5`

### Selected Date Behavior

- Clicking a date cell: highlights cell with `ring-2 ring-brand-500/40 bg-brand-50/30`
- Stores `selectedDate` state in `Tasks.tsx`
- Task Drawer opens showing tasks for that date
- Clicking same date again deselects and closes drawer

### Today Highlighting

- `bg-indigo-50/70 ring-1 ring-inset ring-indigo-200/50`
- Pulsing dot indicator on the day number badge for current day

### Overdue Highlighting

- Any cell with date < today that has `todo` or `inprogress` tasks:
  - Day number gets `text-danger-500` color
  - Cell gets subtle `bg-red-50/40` background
  - Small red dot indicator next to day number

```tsx
const isOverdue = dateStr < todayFull && dayTasks.some(t => t.status !== 'done')
```

### Drag-and-Drop

**Library:** `@dnd-kit/core` + `@dnd-kit/sortable` (~12KB gzipped)

**Behavior:**
- Drag task pill from one cell to another → updates `task.date`
- Visual feedback: ghost pill follows cursor, target cell gets `ring-2 ring-brand-400 bg-brand-50/50` highlight
- On drop: optimistic UI update via `updateTask(id, { date: newDate })`
- Cancel: `Escape` key returns pill to original cell

**Implementation:**
- Wrap calendar grid in `<DndContext>`
- Each task pill wrapped in `<Draggable>`
- Each cell is a `<Droppable>` with `id={dateStr}`

### Multi-Day Task Handling

**Data model addition:** add `end_date` field to Task.

**Rendering:**
- Multi-day task renders as a spanning bar across cells
- Uses absolute positioning within the week row
- Width: `(endCol - startCol + 1) * cellWidth`
- If spans across week boundary: split into two bars
- Color: category accent color with 20% opacity fill

### Recurring Task Handling

**Data model addition:** add `recurrence` JSONB field.

**Calendar projection:**
- `useCalendarProjection` hook generates virtual task instances for the visible month
- Virtual instances have `is_projected: true` flag
- Completing one creates a real `Task` record
- Rendering: recurring tasks show a small repeat icon on the pill

---

## 3. Task Drawer / Side Panel Specification

### Layout Structure

```
┌─────────────────────────────────────┐
│ [Date Header]          [X Close]    │  ← Sticky header
│ February 19, 2026 · 5 tasks        │
├─────────────────────────────────────┤
│ [+ Quick add task...]               │  ← Quick add input
├─────────────────────────────────────┤
│ [Sort: Priority ▾] [Filter ▾]      │  ← Controls bar
├─────────────────────────────────────┤
│ ☐ Design homepage mockup    [···]  │  ← Task rows (scrollable)
│ ☐ Fix auth bug              [···]  │
│ ☑ Update README             [···]  │
│ ☐ Review PR #42             [···]  │
│ ☐ Deploy staging            [···]  │
├─────────────────────────────────────┤
│ [2 selected] [Done] [Reschedule]   │  ← Bulk action bar
└─────────────────────────────────────┘
```

### Specifications

| Property | Value |
|----------|-------|
| Width | `w-[380px]` desktop, full screen mobile |
| Position | Right side, inside flex layout |
| Animation | `slide-in-right` 250ms |
| Background | `var(--surface)` |
| Border | `border-l border-slate-200` |
| Z-index | `z-30` (below mobile sidebar z-50) |

### Quick Add Pattern

- Input with placeholder "Add a task..."
- `Enter` to submit, auto-assigns selected date
- Category dropdown inline (compact pill selector)
- Priority defaults to `medium`
- After add: input clears, new task appears at top with `fade-in` animation

### Inline Task Actions (per row)

- Hover reveals: `[Edit]` `[Delete]` `[···]` (more menu)
- More menu: Change priority, Change category, Move to backlog, Duplicate
- Status toggle: left-side checkbox (click cycles status)
- Click task title: expands inline detail view

### Bulk Selection Mode

- Long press or `Ctrl+Click` enters selection mode
- Selected rows get `bg-brand-50` highlight
- Floating bar at drawer bottom: `[Mark Done]` `[Reschedule]` `[Delete]`
- Reuses existing bulk operations from `useTasks` hook

### Sorting Options

- Priority (high → low) — default
- Status (todo → inprogress → done)
- Title (A → Z)
- Created date (newest first)

### Filtering Inside Drawer

- Status pills: `All` | `To Do` | `In Progress` | `Done`
- Category pills (if multiple categories in that day's tasks)

### Keyboard Accessibility

| Key | Action |
|-----|--------|
| `Escape` | Close drawer |
| `Tab` | Navigate through task rows |
| `Enter` | Open task detail / confirm edit |
| `Space` | Toggle task status |
| `Delete` | Delete focused task (with confirmation) |
| `N` | Focus quick-add input |

### Close Behavior

- Click `X` button
- Press `Escape`
- Click outside drawer (on calendar area)
- Navigate to different date → drawer updates content (doesn't close)

---

## 4. Design System Specification

### Color Tokens

```css
/* Primary */
--color-primary-50: #eff6ff;
--color-primary-100: #dbeafe;
--color-primary-200: #bfdbfe;
--color-primary-300: #93c5fd;
--color-primary-400: #60a5fa;
--color-primary-500: #2563eb;
--color-primary-600: #1d4ed8;
--color-primary-700: #1e40af;
--color-primary-800: #1e3a8a;
--color-primary-900: #172554;

/* Success */
--color-success-50: #ecfdf5;
--color-success-100: #d1fae5;
--color-success-500: #059669;
--color-success-600: #047857;
--color-success-700: #065f46;

/* Warning */
--color-warning-50: #fffbeb;
--color-warning-100: #fef3c7;
--color-warning-500: #d97706;
--color-warning-600: #b45309;

/* Danger */
--color-danger-50: #fef2f2;
--color-danger-100: #fee2e2;
--color-danger-500: #dc2626;
--color-danger-600: #b91c1c;

/* Neutral */
--color-neutral-50: #f8fafc;
--color-neutral-100: #f1f5f9;
--color-neutral-200: #e2e8f0;
--color-neutral-300: #cbd5e1;
--color-neutral-400: #94a3b8;
--color-neutral-500: #64748b;
--color-neutral-600: #475569;
--color-neutral-700: #334155;
--color-neutral-800: #1e293b;
--color-neutral-900: #0f172a;

/* Surfaces */
--surface-0: #ffffff;
--surface-1: #f8fafc;
--surface-2: #f1f5f9;
--surface-3: #e2e8f0;

/* Hover States */
--hover-primary: #1d4ed8;
--hover-neutral: #f1f5f9;
--hover-danger: #b91c1c;

/* Disabled States */
--disabled-bg: #f1f5f9;
--disabled-text: #94a3b8;
--disabled-border: #e2e8f0;
```

### Typography Scale

```css
--font-display: clamp(2.5rem, 3vw + 1rem, 3.5rem);
--font-h1: clamp(1.875rem, 2vw + 1rem, 2.375rem);
--font-h2: clamp(1.5rem, 1.4vw + 1rem, 1.875rem);
--font-h3: 1.25rem;
--font-h4: 1.125rem;
--font-h5: 1rem;
--font-h6: 0.875rem;
--font-body: 0.9375rem;
--font-body-sm: 0.8125rem;
--font-caption: 0.75rem;
--font-meta: 0.6875rem;
```

### Spacing System

```css
--space-unit: 4px;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

Grid: 7-column CSS grid for calendar. Cell padding: `--space-2` to `--space-3`. Gap: `1px`.

### Border Radius Scale

```css
--radius-xs: 4px;
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 20px;
--radius-full: 9999px;
```

### Elevation System

```css
--elevation-card: 0 2px 8px rgba(15, 23, 42, 0.06);
--elevation-modal: 0 20px 40px rgba(15, 23, 42, 0.12), 0 8px 16px rgba(15, 23, 42, 0.06);
--elevation-drawer: -4px 0 24px rgba(15, 23, 42, 0.08);
--elevation-dropdown: 0 4px 16px rgba(15, 23, 42, 0.10);
--elevation-fab: 0 8px 24px rgba(15, 23, 42, 0.16);
```

---

## 5. Accessibility Compliance Plan

### Contrast Ratios

| Element | Min Ratio | Status |
|---------|-----------|--------|
| Body text (`#334155`) on white | 4.5:1 | 8.5:1 — PASS |
| Muted text (`#64748b`) on white | 4.5:1 | 4.7:1 — PASS |
| Faint text (`#78849a`) on white | 4.5:1 | 4.6:1 — PASS (updated from `#94a3b8`) |
| Primary button (white on `#2563eb`) | 4.5:1 | 4.6:1 — PASS |

### Minimum Clickable Area

- All interactive elements: min `44x44px` touch target
- Calendar cell `+` button: `36x36px` min
- Task status toggle: wrap in `44x44px` invisible touch target

### Focus State Design

```css
outline: 2px solid color-mix(in srgb, var(--brand-500) 70%, white);
outline-offset: 2px;
```

Calendar cells: `tabindex="0"` and `role="gridcell"` with visible focus ring.

### Keyboard Navigation

| Context | Keys | Behavior |
|---------|------|----------|
| Calendar grid | Arrow keys | Move between cells |
| Calendar grid | `Enter` | Open drawer for focused cell |
| Calendar grid | `+` or `N` | Quick-add on focused cell |
| Task drawer | `Tab` | Cycle through tasks |
| Task drawer | `Space` | Toggle task status |
| Task drawer | `Escape` | Close drawer |
| Month nav | `Ctrl+←/→` | Previous/next month |

### Screen Reader Labeling

- Calendar grid: `role="grid"`, `aria-label="Task calendar for February 2026"`
- Each cell: `role="gridcell"`, `aria-label="February 19, 3 tasks, 1 overdue"`
- Task pills: `role="button"`, `aria-label="Design homepage, priority high, status to do"`
- Status dots: `aria-hidden="true"`
- "+N more": `aria-label="Show 4 more tasks for February 19"`

### Colorblind-Safe Status Indicators

| Status | Color | Shape | Icon |
|--------|-------|-------|------|
| Todo | Slate | Empty circle | `○` |
| In Progress | Amber | Half-filled circle | `◐` |
| Done | Emerald | Filled checkmark | `✓` |

---

## 6. Data Architecture Model

### Extended Task Entity

```typescript
export interface Task {
  id: string
  user_id: string
  title: string
  description?: string | null
  notes?: string | null
  category_id: string | null
  category?: Category | null

  // Scheduling
  date: string | null               // Start date or null for backlog
  end_date?: string | null           // End date for multi-day tasks

  // Recurrence
  recurrence?: RecurrenceRule | null
  parent_task_id?: string | null     // Links projected instance to template

  // Core
  status: TaskStatus
  priority: TaskPriority
  sort_order?: number                // Manual ordering within a date

  // Metadata
  links?: TaskLink[]
  completed_at?: string | null       // Timestamp for streak tracking
  created_at: string
  updated_at?: string                // For conflict resolution
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  days_of_week?: number[]            // 0=Sun..6=Sat
  day_of_month?: number              // 1-31
  end_date?: string | null
  count?: number | null
}
```

### Entity Relationships

```
User (1) ──→ (N) Task
User (1) ──→ (N) Category
Category (1) ──→ (N) Task
Task (1) ──→ (N) TaskAttachment
Task (1) ──→ (N) TaskLink (embedded JSONB)
Task (1:template) ──→ (N:instances) Task (via parent_task_id)
```

### Status Enum Strategy

```typescript
export type TaskStatus = 'todo' | 'inprogress' | 'done'
// Future: | 'cancelled'
```

Transition rules:
- `todo → inprogress → done` (forward)
- `done → todo` (reopen)
- `inprogress → todo` (deprioritize)

### Calendar Projection Logic

```typescript
function useCalendarProjection(tasks: Task[], year: number, month: number) {
  return useMemo(() => {
    const projected: Map<string, Task[]> = new Map()
    const monthStart = `${year}-${String(month+1).padStart(2,'0')}-01`
    const monthEnd = lastDayOfMonth(year, month)

    for (const task of tasks) {
      if (!task.date) continue

      // Single-day task
      if (!task.end_date || task.end_date === task.date) {
        addToDate(projected, task.date, task)
        continue
      }

      // Multi-day: project into each date in range
      let cursor = max(task.date, monthStart)
      const end = min(task.end_date, monthEnd)
      while (cursor <= end) {
        addToDate(projected, cursor, { ...task, _span_position: getSpanPosition(cursor, task) })
        cursor = nextDay(cursor)
      }
    }

    // Recurring tasks: generate virtual instances
    for (const task of tasks) {
      if (!task.recurrence) continue
      const instances = generateOccurrences(task, monthStart, monthEnd)
      for (const date of instances) {
        addToDate(projected, date, { ...task, id: `${task.id}_${date}`, is_projected: true })
      }
    }

    return projected
  }, [tasks, year, month])
}
```

---

## 7. Performance & Scalability Plan

### Rendering Strategy

- Cap rendered pills per cell to 3 (with `+N more`)
- Total DOM nodes per month view: ~42 cells x 4 elements = ~168 (constant)
- Task Drawer virtualizes the full list only when opened

### Virtualization

- Calendar grid: NOT needed (fixed 42 cells max)
- Task Drawer list: Use `react-virtual` when a date has >50 tasks
- Backlog list: Add virtual scrolling at >200 items

### Optimistic UI Updates

```typescript
const updateTaskStatus = useCallback(async (id: string, status: TaskStatus) => {
  setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t)) // Optimistic
  const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
  if (error) { refetch() } // Rollback on error
}, [])
```

Extend to: drag-and-drop date changes, sort order updates, bulk operations.

### Concurrency Handling

- Add `updated_at` column to tasks table
- On save: `WHERE updated_at = $lastKnownTimestamp` — if 0 rows affected, refetch and show conflict toast
- For real-time: Supabase Realtime subscription on `tasks` table (future Phase 3)

### Offline Support (Phase 3)

- Service Worker caches Supabase responses
- `navigator.onLine` check → queue mutations in IndexedDB
- On reconnect: replay queue, resolve conflicts by `updated_at`
- Yellow banner component: "Offline — changes saved locally"

### Caching Strategy

- Phase 2: Add `react-query` or `swr`
  - Stale-while-revalidate on month data
  - Cache key: `['tasks', year, month]`
  - Background refetch interval: 60s
  - Invalidate on mutation

---

## 8. Conversion & Behavioral Layer

### Completion Reinforcement

| Trigger | Response | Principle |
|---------|----------|-----------|
| Complete a task | Green checkmark pulse (200ms) | Immediate feedback (operant conditioning) |
| Complete all tasks for a day | Cell emerald glow + "All done!" toast | Goal-gradient effect |
| Complete all tasks for a week | Confetti burst + streak increment | Variable reward |

### Progress Visualization

- Month progress bar in header: thin bar showing `done/total`
- Gradient: slate → emerald as completion increases

```tsx
<div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
    style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
  />
</div>
```

### Daily Streak Logic

```typescript
interface StreakData {
  current: number        // Consecutive days with all tasks done
  longest: number        // All-time record
  last_active_date: string
}
```

- A "streak day" = all tasks for that date are `done`
- Days with 0 tasks don't break the streak
- Display: flame icon + count in header
- Stored in `profiles` table as JSONB column

### Overdue Nudges

- Tasks overdue by 1 day: subtle red tint on cell
- Tasks overdue by 3+ days: red badge count in sidebar nav
- Tasks overdue by 7+ days: auto-suggestion toast "Move 5 overdue tasks to today?"
- Principle: Zeigarnik effect

### Smart Suggestions (Phase 3)

- "You usually do [category] tasks on Mondays" → auto-suggest scheduling
- "This task has been in-progress for 5 days" → nudge to complete or split
- Based on historical completion patterns

---

## 9. Mobile Responsive Strategy

### Month View on Mobile (`< 640px`)

- Switch from full grid to **week strip** (horizontal scroll showing 7 days)
- Each day shows: day number + task count dot
- Tapping a day opens full-screen Task Drawer
- Swipe left/right to change weeks
- "Today" button anchors to current week

```tsx
const isMobile = useMediaQuery('(max-width: 639px)')
if (isMobile) return <MobileWeekStrip ... />
return <DesktopCalendarGrid ... />
```

### Drawer Behavior on Mobile

- Full-screen slide-up sheet (not side panel)
- Drag handle at top for dismiss gesture
- `position: fixed; inset: 0; z-index: 40;`
- Backdrop: `bg-black/30`
- Close: swipe down, tap backdrop, or X button

### Gesture Patterns

| Gesture | Action |
|---------|--------|
| Swipe left on task row | Reveal delete button |
| Swipe right on task row | Mark as done |
| Long press task | Enter selection mode |
| Swipe down on drawer | Close drawer |
| Swipe left/right on week strip | Navigate weeks |

### Collapsible Controls

- Search bar: collapsed to icon on mobile, expands on tap
- Category filters: horizontal scroll pill strip (no wrap)
- View switcher: condensed icon-only tabs

### Bottom Navigation

Not recommended — current sidebar drawer is sufficient. Bottom nav would conflict with floating bulk-action bar.

---

## 10. Priority Implementation Roadmap

### Phase 1 — Core Structural Fixes (2-3 sprints) ✅ COMPLETED

| Task | Difficulty | Files Affected | Status |
|------|-----------|----------------|--------|
| Implement `+N more` overflow pattern in calendar cells | Low | `Calendar.tsx` | ✅ |
| Add `selectedDate` state + cell click handler | Low | `Tasks.tsx`, `Calendar.tsx` | ✅ |
| Convert `TaskDetailPanel` to dual-mode Task Drawer | Medium | `TaskDetailPanel.tsx`, `Tasks.tsx` | ✅ |
| Add overdue date highlighting | Low | `Calendar.tsx` | ✅ |
| Fix accessibility: `--text-faint` contrast ratio | Low | `index.css` | ✅ |
| Add `aria-label` attributes to calendar grid | Low | `Calendar.tsx` | ✅ |
| Add keyboard navigation for calendar cells | Medium | `Calendar.tsx` | ✅ |
| Increase touch targets on task pills | Low | `TaskItem.tsx` | ✅ |
| Add empty state components | Low | New: `EmptyState.tsx` | ✅ |
| Extend design tokens in CSS variables | Low | `index.css` | ✅ |
| Add month progress bar | Low | `Tasks.tsx` | ✅ |

### Phase 2 — System Maturity (2-3 sprints)

| Task | Difficulty | Files Affected |
|------|-----------|----------------|
| Install `@dnd-kit/core` + implement drag-and-drop | High | `Calendar.tsx`, `TaskItem.tsx`, `useTasks.ts` |
| Add `end_date` column + multi-day task rendering | High | `types.ts`, `Calendar.tsx`, Supabase migration |
| Add `recurrence` column + projection logic | High | `types.ts`, new `useCalendarProjection.ts`, migration |
| Add `sort_order` for manual ordering | Medium | `types.ts`, `useTasks.ts`, migration |
| Integrate `react-query` / `swr` for caching | Medium | All hooks |
| Add `updated_at` column + conflict detection | Medium | `types.ts`, hooks, migration |
| Mobile week strip view | Medium | New: `MobileWeekStrip.tsx` |
| Mobile full-screen drawer | Medium | `TaskDetailPanel.tsx` |
| Swipe gestures on mobile task rows | Medium | `TaskItem.tsx` |
| Streak tracking system | Medium | `useProfile.ts`, `Dashboard.tsx`, migration |
| Command palette (`Cmd+K`) | Medium | New: `CommandPalette.tsx` |

### Phase 3 — Optimization & Behavioral Layer (2-3 sprints)

| Task | Difficulty | Files Affected |
|------|-----------|----------------|
| Supabase Realtime subscription | Medium | `useTasks.ts`, `useBacklogTasks.ts` |
| Offline support (Service Worker + IndexedDB) | High | New SW file, hooks |
| Smart suggestions engine | High | New: `useSuggestions.ts` |
| Virtual scrolling for large lists | Low | `TaskList.tsx`, `BacklogList.tsx` |
| Completion animations (confetti, pulse) | Low | `Calendar.tsx`, `TaskItem.tsx` |
| Overdue nudge toasts | Low | `Tasks.tsx` |
| Performance audit + bundle optimization | Medium | Build config |
