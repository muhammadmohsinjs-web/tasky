# Tasky — Transformation Execution Blueprint

> **Document purpose:** A complete, phase-by-phase implementation guide for transforming Tasky from a calendar-first task manager into a habit-and-goal-driven daily productivity system with integrated AI assistance. Written for an LLM agent executing the changes. Every story references exact files, types, and patterns already in the codebase.

---

## Table of Contents

1. [Project Context](#1-project-context)
2. [Current Architecture Snapshot](#2-current-architecture-snapshot)
3. [Target Architecture](#3-target-architecture)
4. [Entity Model (Final)](#4-entity-model-final)
5. [Execution Phases Overview](#5-execution-phases-overview)
6. [Phase 1 — Database & Type Foundation](#phase-1--database--type-foundation)
7. [Phase 2 — Navigation Restructure](#phase-2--navigation-restructure)
8. [Phase 3 — Daily Cockpit (Primary Screen)](#phase-3--daily-cockpit-primary-screen)
9. [Phase 4 — Habits Feature](#phase-4--habits-feature)
10. [Phase 5 — Goals Feature](#phase-5--goals-feature)
11. [Phase 6 — Backlog Page](#phase-6--backlog-page)
12. [Phase 7 — Calendar Heatmap](#phase-7--calendar-heatmap)
13. [Phase 8 — Analytics Update](#phase-8--analytics-update)
14. [Phase 9 — AI Integration](#phase-9--ai-integration)
15. [Global Constraints & Conventions](#global-constraints--conventions)

---

## 1. Project Context

**App name:** Tasky
**Owner:** Personal productivity app (single user, not SaaS)
**Stack:** React 18 + TypeScript + Vite + Tailwind CSS + Supabase (Postgres + Auth + Realtime) + TanStack Query
**Auth:** Supabase Auth, Google OAuth
**State:** TanStack Query for server state, no global client store
**Routing:** React Router v6
**Notifications:** Sonner toasts
**Design system:** Custom components in `src/components/design-system/`

---

## 2. Current Architecture Snapshot

### Routes (src/App.tsx)
| Route | Component | Keep? |
|---|---|---|
| `/dashboard` | `Dashboard.tsx` | Remove — merge useful stats into Cockpit header |
| `/tasks` | `Tasks.tsx` → `CalendarPage.tsx` | Replace with Cockpit |
| `/planning` | `Planning.tsx` | Remove — replaced by Goals |
| `/categories` | `Categories.tsx` | Keep as-is |
| `/analytics` | `Analytics.tsx` | Keep, update content |

### Key Files
| File | Purpose |
|---|---|
| `src/types.ts` | All global TypeScript interfaces |
| `src/lib/constants.ts` | `TASK_SELECT`, status/priority configs |
| `src/hooks/useTasks.ts` | Fetch tasks by month window |
| `src/hooks/useBacklogTasks.ts` | Fetch tasks with `date IS NULL` |
| `src/hooks/useProfile.ts` | Global streak (partially wired) |
| `src/lib/recurrence.ts` | `expandRecurrence()` utility |
| `src/components/tasks/monthly/CalendarPage.tsx` | Current primary screen |
| `src/components/tasks/monthly/AddTaskModal.tsx` | Create/edit task modal |
| `src/components/tasks/monthly/TaskCard.tsx` | Task card component |
| `supabase/schema.sql` | Schema reference (not migration runner) |
| `supabase/migrations/` | Migration SQL files (phase2–phase9 exist) |

### Current Task Model (src/types.ts — Task interface)
```typescript
id, user_id, title, description, notes,
time,           // "HH:MM" — scheduled start time (NOT creation time)
category_id, category,
date,           // YYYY-MM-DD or null (backlog)
end_date,       // YYYY-MM-DD for multi-day tasks
recurrence,     // RecurrenceRule JSONB
status,         // 'todo' | 'inprogress' | 'done'
priority,       // 'low' | 'medium' | 'high' | 'urgent'
sort_order, links, attachments,
created_at, updated_at, completed_at, deleted_at,
is_projected,   // virtual recurrence ghost
source_task_id  // parent recurring task
```

### What Does NOT Exist Yet
- `task_type` field (habit vs task)
- `end_time` field (habits need start + end time)
- `goal_id` field on tasks
- `goals` table
- `habit_streaks` table
- Per-habit streak logic
- Daily cockpit screen
- Goals screen
- Calendar heatmap

---

## 3. Target Architecture

### New Routes
| Route | Component | Description |
|---|---|---|
| `/cockpit` | `CockpitPage.tsx` | **Primary screen.** Today's habits + scheduled tasks |
| `/goals` | `GoalsPage.tsx` | All goals, with progress |
| `/goals/:id` | `GoalDetailPage.tsx` | Goal detail with linked tasks |
| `/backlog` | `BacklogPage.tsx` | Unscheduled tasks |
| `/calendar` | `CalendarHeatmapPage.tsx` | Completion heatmap — read only |
| `/analytics` | `Analytics.tsx` | Updated analytics |
| `/categories` | `Categories.tsx` | Unchanged |

### New Navigation Order (sidebar)
1. Cockpit (default landing)
2. Goals
3. Backlog
4. Calendar
5. Analytics
6. Categories

### Removed
- `/dashboard` — removed
- `/planning` — removed
- `/tasks` — replaced by `/cockpit`
- `/events` redirect — removed

---

## 4. Entity Model (Final)

### Habit
- A task with `task_type = 'habit'`
- Always has `recurrence` set (daily/weekly minimum)
- Has `time` (start, "HH:MM") and `end_time` (end, "HH:MM")
- Binary interaction: `todo` → `done` only (no `inprogress`)
- Has its own streak in `habit_streaks` table
- Appears in Cockpit every day it recurs

### Task
- A task with `task_type = 'task'`
- May or may not have a `date` (scheduled vs backlog)
- May be linked to a `goal_id`
- Full status cycle: `todo → inprogress → done`
- Appears in Cockpit only on its scheduled date
- Appears in Goal detail if `goal_id` is set
- Appears in Backlog if `date IS NULL`

### Goal
- Separate entity in `goals` table
- Has `title`, `description`, `start_date`, `end_date`, `status`
- Tasks are linked to it via `tasks.goal_id`
- Progress = count of done tasks / total tasks with this `goal_id`
- Has no subtasks of its own — tasks ARE its subtasks

### Streak Logic
- **Per-habit streak:** in `habit_streaks` table. Incremented when a habit is marked done. Broken if the habit was not completed on its expected recurrence day.
- **Daily streak (global):** fires when ≥80% of today's habits are marked done for that day. Stored in existing `profiles.streak` JSONB field. The existing `updateStreak()` in `useProfile.ts` should be called from the habit completion handler.

---

## 5. Execution Phases Overview

| Phase | What | Risk |
|---|---|---|
| 1 | DB schema + TypeScript types | Low — additive only |
| 2 | Navigation restructure | Low — routing only |
| 3 | Daily Cockpit screen | Medium — new primary screen |
| 4 | Habits feature | Medium — new task_type branch |
| 5 | Goals feature | Medium — new entity + relations |
| 6 | Backlog page | Low — mostly exists already |
| 7 | Calendar heatmap | Low — replaces existing calendar |
| 8 | Analytics update | Low — additive |
| 9 | AI integration | Medium — new external dependency (Claude API) |

**Each phase must be independently deployable.** Do not mix phases in a single commit.

### Phase 9 Sub-phases (execute in order)
| Sub-phase | Stories | What |
|---|---|---|
| 9-A | 9.1–9.3 | Infrastructure: Claude client, tool schemas, AI command bar UI |
| 9-B | 9.4–9.5 | Read-only features: task creation via NL, analytics queries |
| 9-C | 9.6–9.7 | Write features with confirmation: goal generation, day planning |
| 9-D | 9.8–9.9 | Proactive features: weekly health check, streak nudge |

---

## Phase 1 — Database & Type Foundation

### Goal
Add all new columns, tables, and TypeScript types without breaking anything existing.

---

### Story 1.1 — Add `task_type` and `end_time` columns to tasks table

**Context:**
Tasks need a type discriminator (`habit` vs `task`) and habits need an end time in addition to the existing `time` (start time) field.

**Migration file to create:**
`supabase/migrations/phase10_task_type_and_end_time.sql`

```sql
-- Add task_type column
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'task'
  CHECK (task_type IN ('habit', 'task'));

-- Add end_time column for habits (stored as "HH:MM" 24-hour string, same format as `time`)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS end_time TEXT;

-- Index for filtering habits efficiently
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON tasks (task_type);
```

**No RLS changes needed** — existing policies cover all tasks rows.

**Acceptance criteria:**
- `tasks` table has `task_type TEXT DEFAULT 'task'` column
- `tasks` table has `end_time TEXT` column
- All existing tasks default to `task_type = 'task'`

---

### Story 1.2 — Create `goals` table

**Migration file to create:**
`supabase/migrations/phase10_goals_table.sql`

```sql
CREATE TABLE IF NOT EXISTS goals (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  start_date   DATE,
  end_date     DATE,
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  color        TEXT,          -- optional hex color for goal card accent
  sort_order   INT DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status ON goals (user_id, status);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

**Acceptance criteria:**
- `goals` table exists with RLS enabled
- Only authenticated users can read/write their own goals

---

### Story 1.3 — Add `goal_id` foreign key to tasks table

**Migration file to create:**
`supabase/migrations/phase10_tasks_goal_fk.sql`

```sql
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_goal ON tasks (goal_id);
```

**Note:** `ON DELETE SET NULL` means deleting a goal does not delete its tasks — they become standalone.

---

### Story 1.4 — Create `habit_streaks` table

**Migration file to create:**
`supabase/migrations/phase10_habit_streaks.sql`

```sql
CREATE TABLE IF NOT EXISTS habit_streaks (
  task_id              UUID PRIMARY KEY REFERENCES tasks(id) ON DELETE CASCADE,
  user_id              UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_streak       INT DEFAULT 0,
  longest_streak       INT DEFAULT 0,
  last_completed_date  DATE
);

ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own habit streaks"
  ON habit_streaks FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

### Story 1.5 — Update TypeScript types (src/types.ts)

**File to edit:** `src/types.ts`

**Changes:**

1. Add `TaskType` union type near the top (after `TaskStatus`):
```typescript
export type TaskType = 'habit' | 'task'
```

2. Add `GoalStatus` union type:
```typescript
export type GoalStatus = 'active' | 'completed' | 'abandoned'
```

3. Add these fields to the existing `Task` interface:
```typescript
task_type?: TaskType        // 'habit' | 'task', defaults to 'task'
end_time?: string | null    // "HH:MM" 24-hour, only for habits
goal_id?: string | null     // FK to goals table
goal?: Goal | null          // joined when needed
```

4. Add new `Goal` interface after the `Task` interface:
```typescript
export interface Goal {
  id: string
  user_id?: string
  title: string
  description?: string | null
  start_date?: string | null   // YYYY-MM-DD
  end_date?: string | null     // YYYY-MM-DD
  status: GoalStatus
  color?: string | null
  sort_order?: number
  created_at: string
  updated_at?: string
  // Derived fields (computed client-side, not from DB)
  task_count?: number
  completed_task_count?: number
  progress?: number            // 0–100
}
```

5. Add `HabitStreak` interface:
```typescript
export interface HabitStreak {
  task_id: string
  user_id?: string
  current_streak: number
  longest_streak: number
  last_completed_date: string | null
}
```

6. Update `TASK_SELECT` constant in `src/lib/constants.ts` to include new fields:
```typescript
export const TASK_SELECT = 'id,title,description,notes,time,end_time,task_type,category_id,date,end_date,recurrence,source_task_id,goal_id,status,priority,sort_order,links,created_at,updated_at,completed_at,deleted_at, category:categories(id,name,slug,color,accent,short_label,icon,sort_order,created_at), attachments:task_attachments(id,task_id,user_id,file_name,file_url,file_type,file_size,created_at)'
```

Add `GOAL_SELECT` constant:
```typescript
export const GOAL_SELECT = 'id,title,description,start_date,end_date,status,color,sort_order,created_at,updated_at'
```

**Acceptance criteria:**
- TypeScript compiles without errors after type changes
- All existing task queries still work (new fields are optional)

---

## Phase 2 — Navigation Restructure

### Goal
Replace the current sidebar navigation with the new 6-item structure. Rewire routes. Do NOT build new screens yet — just create stub pages that render a "Coming soon" placeholder.

---

### Story 2.1 — Add new stub pages

**Create these files:**

`src/pages/Cockpit.tsx`
```typescript
export default function Cockpit() {
  return <div className="p-6 text-slate-500">Cockpit — coming soon</div>
}
```

`src/pages/Goals.tsx`
```typescript
export default function Goals() {
  return <div className="p-6 text-slate-500">Goals — coming soon</div>
}
```

`src/pages/GoalDetail.tsx`
```typescript
export default function GoalDetail() {
  return <div className="p-6 text-slate-500">Goal Detail — coming soon</div>
}
```

`src/pages/Backlog.tsx`
```typescript
export default function Backlog() {
  return <div className="p-6 text-slate-500">Backlog — coming soon</div>
}
```

`src/pages/CalendarHeatmap.tsx`
```typescript
export default function CalendarHeatmap() {
  return <div className="p-6 text-slate-500">Calendar Heatmap — coming soon</div>
}
```

---

### Story 2.2 — Update App.tsx routes

**File to edit:** `src/App.tsx`

Replace the entire route block inside `<Route element={<AppLayout />}>` with:

```typescript
<Route path="/cockpit" element={<Cockpit />} />
<Route path="/goals" element={<Goals />} />
<Route path="/goals/:id" element={<GoalDetail />} />
<Route path="/backlog" element={<Backlog />} />
<Route path="/calendar" element={<CalendarHeatmap />} />
<Route path="/analytics" element={<Analytics />} />
<Route path="/categories" element={<Categories />} />
```

Add a default redirect at the top of the protected section:
```typescript
<Route index element={<Navigate to="/cockpit" replace />} />
<Route path="/dashboard" element={<Navigate to="/cockpit" replace />} />
<Route path="/tasks" element={<Navigate to="/cockpit" replace />} />
<Route path="/planning" element={<Navigate to="/goals" replace />} />
```

Import new page components at the top of `App.tsx`.

**Acceptance criteria:**
- Navigating to `/` or `/dashboard` or `/tasks` redirects correctly
- All new routes render their stub pages without errors

---

### Story 2.3 — Update AppLayout sidebar navigation

**File to edit:** `src/components/layout/AppLayout.tsx`
(Read this file first to understand its current nav item structure before editing)

Replace the nav items array with:
```typescript
const navItems = [
  { path: '/cockpit',   label: 'Today',      icon: 'sun' },
  { path: '/goals',     label: 'Goals',      icon: 'target' },
  { path: '/backlog',   label: 'Backlog',    icon: 'inbox' },
  { path: '/calendar',  label: 'Calendar',   icon: 'calendar' },
  { path: '/analytics', label: 'Analytics',  icon: 'bar-chart-2' },
  { path: '/categories',label: 'Categories', icon: 'tag' },
]
```

**Note:** Use icon names from `lucide-react` which is already used in the codebase. Verify these icon names exist: `Sun`, `Target`, `Inbox`, `Calendar`, `BarChart2`, `Tag`.

**Acceptance criteria:**
- Sidebar shows 6 items in the correct order
- Active route is highlighted correctly
- Old nav items (Dashboard, Tasks, Planning) are gone

---

## Phase 3 — Daily Cockpit (Primary Screen)

### Goal
Build the primary screen. Two sections: Habits at top, Today's Tasks below. Both are binary interactions (tap to toggle done/todo). Cockpit header shows daily streak and today's date.

---

### Story 3.1 — Create `useCockpit` hook

**File to create:** `src/hooks/useCockpit.ts`

**Purpose:** Fetch everything needed for the cockpit in one place.

**Logic:**
1. Get today's date as `YYYY-MM-DD` string using `new Date().toISOString().split('T')[0]`
2. Query 1 — Habits: fetch all tasks where `task_type = 'habit'` and `deleted_at IS NULL` for the current user. Then filter client-side to only those whose recurrence places them on today (use existing `expandRecurrence()` from `src/lib/recurrence.ts`).
3. Query 2 — Today's tasks: fetch all tasks where `task_type = 'task'` AND `date = today` AND `deleted_at IS NULL`.
4. Join `habit_streaks` for each habit by querying `habit_streaks` table filtered by `task_id IN (habit ids)`.
5. Return: `{ habits, tasks, isLoading, todayStr }`

**Supabase queries to use:**
```typescript
// Habits query
supabase
  .from('tasks')
  .select(TASK_SELECT)
  .eq('user_id', user.id)
  .eq('task_type', 'habit')
  .is('deleted_at', null)

// Today tasks query
supabase
  .from('tasks')
  .select(TASK_SELECT)
  .eq('user_id', user.id)
  .eq('task_type', 'task')
  .eq('date', todayStr)
  .is('deleted_at', null)

// Habit streaks
supabase
  .from('habit_streaks')
  .select('*')
  .in('task_id', habitIds)
```

Use `useQuery` from TanStack Query. Query keys: `['cockpit-habits']`, `['cockpit-tasks', todayStr]`, `['habit-streaks', habitIds]`.

Use Supabase Realtime subscription for tasks (follow the pattern in existing `useTasks.ts`).

---

### Story 3.2 — Create `HabitRow` component

**File to create:** `src/components/cockpit/HabitRow.tsx`

**Props:**
```typescript
interface HabitRowProps {
  habit: Task
  streak: HabitStreak | null
  onToggle: (habitId: string, currentStatus: TaskStatus) => void
}
```

**Layout (single row):**
```
[checkbox]  [category dot]  [title]  [start–end time]  [🔥 streak]
```

**Behavior:**
- Checkbox is checked when `habit.status === 'done'`
- Clicking checkbox calls `onToggle(habit.id, habit.status)`
- Streak shown only if `streak.current_streak > 0`, format: `🔥 12`
- Time shown as: `formatTimeLabel(habit.time) – formatTimeLabel(habit.end_time)` (reuse existing `formatTimeLabel` from `src/components/tasks/monthly/CalendarPage.tsx`)
- If habit is done: row has muted opacity (0.6), title has strikethrough
- Use Tailwind classes only. No new CSS files.

---

### Story 3.3 — Create `TaskRow` component

**File to create:** `src/components/cockpit/TaskRow.tsx`

**Props:**
```typescript
interface TaskRowProps {
  task: Task
  onToggle: (taskId: string, currentStatus: TaskStatus) => void
  onOpen: (task: Task) => void  // opens existing AddTaskModal for edit/view
}
```

**Layout (single row):**
```
[checkbox]  [category dot]  [title]  [goal badge if linked]  [time if set]
```

**Behavior:**
- Checkbox: unchecked = `todo` or `inprogress`, checked = `done`
- Clicking checkbox: if not done → set to `done`; if done → set to `todo`
- Goal badge: small pill showing `goal.title` if `task.goal_id` is set (fetch goal title separately or pass as prop)
- Clicking the row title opens the existing `AddTaskModal` in view/edit mode
- Done tasks: muted + strikethrough

---

### Story 3.4 — Create `CockpitHeader` component

**File to create:** `src/components/cockpit/CockpitHeader.tsx`

**Props:**
```typescript
interface CockpitHeaderProps {
  todayStr: string        // "Wednesday, Feb 26"
  dailyStreak: number     // from profile.streak.current
  habitsTotal: number
  habitsDone: number
}
```

**Layout:**
```
Wednesday, February 26          🔥 7-day streak
                                 4 / 5 habits done today
```

**Behavior:**
- Format `todayStr` using `new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })`
- Show streak only if `dailyStreak > 0`
- Habit progress: `{habitsDone} / {habitsTotal} habits done` — if all done, show in emerald green

---

### Story 3.5 — Build CockpitPage

**File to edit:** `src/pages/Cockpit.tsx` (replace stub)

**Structure:**
```
<CockpitHeader />

<section>
  <h2>Habits</h2>
  {habits.map(habit => <HabitRow />)}
  {habits.length === 0 && <EmptyState>No habits yet. Add one to get started.</EmptyState>}
</section>

<section>
  <h2>Today — {formattedDate}</h2>
  {tasks.map(task => <TaskRow />)}
  {tasks.length === 0 && <EmptyState>Nothing scheduled for today.</EmptyState>}
</section>
```

**Toggle handler for habits:**
```typescript
async function toggleHabit(habitId: string, currentStatus: TaskStatus) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done'
  await supabase.from('tasks').update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }).eq('id', habitId)
  // After updating: call updateHabitStreak(habitId, newStatus) — see Phase 4 Story 4.3
  // After updating: check if ≥80% habits done → call updateStreak() from useProfile
  queryClient.invalidateQueries({ queryKey: ['cockpit-habits'] })
}
```

**Toggle handler for tasks:**
```typescript
async function toggleTask(taskId: string, currentStatus: TaskStatus) {
  const newStatus = currentStatus === 'done' ? 'todo' : 'done'
  await supabase.from('tasks').update({ status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null }).eq('id', taskId)
  queryClient.invalidateQueries({ queryKey: ['cockpit-tasks'] })
}
```

**Acceptance criteria:**
- Cockpit is the default route (`/cockpit`)
- Habits appear at top, sorted by `time` ascending
- Tasks appear below, sorted by `time` ascending then by status (`inprogress` first)
- Toggling any item updates DB and re-renders immediately (optimistic or invalidate)
- Header shows correct date and streak

---

## Phase 4 — Habits Feature

### Goal
Full habit creation, management, and streak tracking. Habits are tasks with `task_type = 'habit'`. They use the existing recurrence system. New: binary interaction, per-habit streak, end_time field.

---

### Story 4.1 — Update AddTaskModal to support Habit type

**File to edit:** `src/components/tasks/monthly/AddTaskModal.tsx`
(Read this file completely before editing — it is large and complex)

**Changes:**

1. Add a type selector at the very top of the form (before title input):
```
[  Task  ]  [  Habit  ]   ← toggle buttons
```
Controlled by local state: `const [taskType, setTaskType] = useState<TaskType>(initialTask?.task_type ?? 'task')`

2. When `taskType === 'habit'`:
   - Show **two time pickers**: "Start time" and "End time" (both `<input type="time">`)
   - Map to `time` (start) and `end_time` fields
   - **Force recurrence on** and disable the toggle (habits must recur)
   - **Hide the status selector** (habits are always created as `todo`)
   - **Hide the date range fields** (habit date is controlled by recurrence, not a one-time date — set `date` to today as the recurrence anchor)
   - Show `days_of_week` selector for weekly habits: 7 toggle buttons `S M T W T F S` (this field already exists in `RecurrenceRule` type but is not exposed in UI)

3. When `taskType === 'task'`:
   - Show **single time picker** (existing `time` field)
   - All existing fields visible as today (no change)

4. On save, always set `task_type` field in the upsert payload.

**Acceptance criteria:**
- Creating a habit saves `task_type = 'habit'`, `time`, `end_time`, and a valid `recurrence` rule
- Creating a task saves `task_type = 'task'` (or defaults — backward compatible)
- Editing an existing habit shows the correct fields pre-filled

---

### Story 4.2 — Create `useHabits` hook

**File to create:** `src/hooks/useHabits.ts`

**Purpose:** Fetch all habits for the current user (used in settings-like views, not cockpit).

```typescript
// Query: all tasks where task_type = 'habit' AND deleted_at IS NULL
// Include habit_streaks join
// Sort by time ascending
```

Query key: `['habits']`

---

### Story 4.3 — Create `useHabitStreak` hook and `updateHabitStreak` function

**File to create:** `src/hooks/useHabitStreak.ts`

**`updateHabitStreak(taskId: string, newStatus: TaskStatus, recurrence: RecurrenceRule)` function logic:**

```
IF newStatus === 'done':
  1. Fetch current row from habit_streaks WHERE task_id = taskId
  2. Get today's date
  3. IF last_completed_date = yesterday:
       current_streak += 1
     ELSE IF last_completed_date = today:
       no change (already counted)
     ELSE:
       current_streak = 1  (streak broken, restart)
  4. longest_streak = MAX(current_streak, longest_streak)
  5. last_completed_date = today
  6. UPSERT into habit_streaks

IF newStatus === 'todo' (unchecking):
  1. IF last_completed_date = today:
       Decrement current_streak by 1 (min 0)
       last_completed_date = yesterday (or null if streak was 1)
  2. UPSERT into habit_streaks
```

**Daily global streak (80% threshold) — call from cockpit after any habit toggle:**
```
1. Count total habits scheduled for today
2. Count habits with status = 'done' for today
3. IF done/total >= 0.8:
     Call updateStreak() from useProfile.ts  ← already exists, just needs to be called
```

The `updateStreak()` function in `src/hooks/useProfile.ts` already exists and correctly handles consecutive day logic. It just isn't called anywhere — wire it here.

---

### Story 4.4 — Add "Manage Habits" section to Cockpit

At the bottom of the Habits section in `CockpitPage.tsx`, add a small `+ Add Habit` button that opens `AddTaskModal` pre-configured with `taskType = 'habit'`.

---

## Phase 5 — Goals Feature

### Goal
Build Goals as a first-class screen. Goals contain tasks. Tasks can be linked to a goal at creation or later. Progress is derived from task completion.

---

### Story 5.1 — Create `useGoals` hook

**File to create:** `src/hooks/useGoals.ts`

```typescript
// Query: SELECT * FROM goals WHERE user_id = auth.uid() AND deleted_at IS NULL ORDER BY sort_order, created_at
// Also fetch tasks per goal for progress:
//   SELECT goal_id, COUNT(*), COUNT(*) FILTER (WHERE status = 'done') FROM tasks WHERE goal_id IS NOT NULL GROUP BY goal_id
// Merge progress onto each Goal object: { ...goal, task_count, completed_task_count, progress }
```

Query key: `['goals']`

Use `GOAL_SELECT` constant from `src/lib/constants.ts`.

---

### Story 5.2 — Create `useGoalDetail` hook

**File to create:** `src/hooks/useGoalDetail.ts`

**Props:** `goalId: string`

```typescript
// Query 1: SELECT * FROM goals WHERE id = goalId AND user_id = auth.uid()
// Query 2: SELECT TASK_SELECT FROM tasks WHERE goal_id = goalId AND deleted_at IS NULL ORDER BY date ASC NULLS LAST, created_at ASC
```

Returns: `{ goal, tasks, isLoading }`

---

### Story 5.3 — Create `GoalCard` component

**File to create:** `src/components/goals/GoalCard.tsx`

**Props:** `{ goal: Goal, onClick: () => void }`

**Layout:**
```
[color accent bar on left]
[Title]                    [status badge: Active / Completed]
[Feb 1 – May 31]           [3 / 8 tasks  ████░░░░  37%]
```

- Progress bar: Tailwind `bg-emerald-500` fill, `bg-slate-100` track
- Clicking the card navigates to `/goals/:id`
- Color accent bar uses `goal.color` if set, else default slate

---

### Story 5.4 — Build GoalsPage

**File to edit:** `src/pages/Goals.tsx` (replace stub)

**Structure:**
```
[+ New Goal button]         [filter: Active | All | Completed]

{goals.map(goal => <GoalCard />)}

{goals.length === 0 && <EmptyState>No goals yet.</EmptyState>}
```

**New Goal modal/drawer:** Can reuse the existing drawer/modal pattern from `AddTaskModal`. Create a simple `GoalFormModal.tsx` with fields:
- Title (required)
- Description (optional)
- Start date, End date (date pickers)
- Color picker (small swatches, use `CATEGORY_PALETTE` hex values from `src/lib/constants.ts`)

**Save handler:**
```typescript
supabase.from('goals').insert({ title, description, start_date, end_date, color, user_id })
queryClient.invalidateQueries({ queryKey: ['goals'] })
```

---

### Story 5.5 — Build GoalDetailPage

**File to edit:** `src/pages/GoalDetail.tsx` (replace stub)

**Structure:**
```
[← Back to Goals]

[Goal title]   [Edit button]   [status badge]
[Date range]   [Progress bar: X/Y tasks, N%]

── Tasks ──────────────────────────────
[+ Add task to this goal]

[TaskRow for each task]
  — scheduled tasks show date
  — unscheduled tasks show "No date"
```

**Add task to goal behavior:**
- Opens `AddTaskModal` with `goal_id` pre-filled and hidden from user
- User can set a date (scheduled) or leave blank (stays in goal but not in cockpit until scheduled)

**TaskRow in goal context:**
- Same `TaskRow` component from Phase 3
- Status toggle works the same way
- Clicking opens `AddTaskModal` in edit mode
- Show date if set, "No date" if null

**Progress recalculation:** Re-fetch after any task status change. Invalidate `['goals']` and `['goal-detail', goalId]` query keys.

---

### Story 5.6 — Link tasks to goals from AddTaskModal

**File to edit:** `src/components/tasks/monthly/AddTaskModal.tsx`

**For `taskType === 'task'` only:**

Add a "Goal" dropdown field below the category selector:
```
Goal (optional)
[Select a goal...  ▾]   ← dropdown of active goals
```

- Populate with `useGoals()` data (active goals only)
- Saves `goal_id` on the task
- If `AddTaskModal` is opened from `GoalDetailPage`, pre-fill and lock this field

---

## Phase 6 — Backlog Page

### Goal
A clean, focused screen for unscheduled tasks. The existing `useBacklogTasks` hook already provides this data. This is mostly a new UI layout.

---

### Story 6.1 — Build BacklogPage

**File to edit:** `src/pages/Backlog.tsx` (replace stub)

**Data:** Use existing `useBacklogTasks()` hook from `src/hooks/useBacklogTasks.ts`. Filter to `task_type = 'task'` only (habits are never in backlog).

**Structure:**
```
[Backlog]                    [+ Add task]

[search input]               [filter: All | linked to goal | no goal]

{tasks.map(task => <BacklogTaskRow />)}
```

**BacklogTaskRow component** (create inline or as `src/components/backlog/BacklogTaskRow.tsx`):

Layout per row:
```
[title]   [goal badge]   [Schedule]   [•••]
```

Actions:
- **Schedule:** opens a small date-picker popover; on date select, sets `task.date` → task moves out of backlog and appears in cockpit on that day
- **Link to goal:** opens a dropdown of active goals; sets `task.goal_id`
- **Delete:** soft delete (`deleted_at = now()`)
- **•••** context menu: Edit (opens AddTaskModal), Delete

**Note:** When a backlog task gets a date assigned, it is NOT removed from backlog view immediately — wait for the query to re-fetch. Do not manually splice from the array.

**Acceptance criteria:**
- Only tasks with `date IS NULL` and `task_type = 'task'` appear
- Scheduling a task assigns a date and removes it from the list on next query refresh
- No habits appear in backlog

---

## Phase 7 — Calendar Heatmap

### Goal
Replace the full calendar task manager with a read-only monthly heatmap showing daily completion percentage. No task creation or management happens here.

---

### Story 7.1 — Create `useCalendarHeatmap` hook

**File to create:** `src/hooks/useCalendarHeatmap.ts`

**Props:** `{ year: number, month: number }` (0-indexed month)

**Logic:**
1. Fetch all tasks for the user where `date` falls within the given month AND `task_type = 'task'` AND `deleted_at IS NULL`
2. Fetch all habit occurrences for that month by expanding recurrence client-side (use existing `expandRecurrence()`)
3. For each day in the month, compute:
   ```
   total = tasks on that day + habits scheduled that day
   done  = tasks with status='done' + habits with status='done' on that day
   pct   = total > 0 ? done / total : null
   ```
4. Return a map: `Record<string, { total: number, done: number, pct: number | null }>`
   Keys are `"YYYY-MM-DD"` strings.

---

### Story 7.2 — Create `HeatmapCalendar` component

**File to create:** `src/components/calendar/HeatmapCalendar.tsx`

**Props:** `{ data: Record<string, { pct: number | null }>, year: number, month: number }`

**Layout:** Standard 7-column grid (Sun–Sat), 5–6 rows.

**Cell coloring:**
```
pct === null (future or no tasks) → bg-slate-100, text-slate-300 (faded)
pct >= 0.8                        → bg-emerald-500 text-white
pct >= 0.5                        → bg-amber-400 text-white
pct > 0                           → bg-red-400 text-white
pct === 0 (had tasks, none done)  → bg-slate-200 text-slate-500
```

**Today's cell:** Add a subtle ring: `ring-2 ring-slate-400`

**Interaction:** Clicking a past date shows a small tooltip/popover with: `"Feb 14 — 4/5 done (80%)"`. No navigation. Read-only.

**Month navigation:** Previous/Next month arrows at the top.

---

### Story 7.3 — Build CalendarHeatmapPage

**File to edit:** `src/pages/CalendarHeatmap.tsx` (replace stub)

**Structure:**
```
[Calendar]

[← February 2026 →]

<HeatmapCalendar />

Legend:  ● 80%+  ● 50–80%  ● <50%  ○ No tasks
```

**Acceptance criteria:**
- Calendar is purely visual — no task creation
- Future dates are visually faded
- Colors reflect daily completion percentage
- Month navigation works

---

## Phase 8 — Analytics Update

### Goal
Update the Analytics page to reflect the new entity model. Remove calendar-sync stats. Add habit and goal analytics.

---

### Story 8.1 — Update Analytics page content

**File to edit:** `src/pages/Analytics.tsx`
(Read this file before editing to understand current chart structure)

**Remove:**
- Any calendar sync / Google Calendar stats sections
- Planning cockpit stats if present

**Add these sections:**

**Section 1 — Habit Performance (last 30 days)**
- Bar chart (use existing Recharts): X = last 30 days (grouped by week), Y = % habits completed
- Data source: query tasks where `task_type = 'habit'` + completion history

**Section 2 — Goal Progress**
- List of active goals each with a horizontal progress bar
- Reuse the `GoalCard` progress bar logic
- Data from `useGoals()` hook

**Section 3 — Streak Summary**
- Global streak: current and longest (from `profile.streak` — already exists)
- Top 3 habits by current streak (from `habit_streaks` table)

**Keep existing sections:**
- Task completion rate chart
- Category breakdown

---

---

## Phase 9 — AI Integration

### Goal
Embed OpenAI (GPT-4o) into Tasky as an intelligent assistant accessible via the existing `Cmd+K` command palette. AI features are split into two classes:
- **Read** — query and analyse user data, answer questions, surface insights (no confirmation needed)
- **Write** — generate and schedule tasks, plan the day, rearrange tasks (always show a preview, user confirms before any DB write)

**Golden rule: The AI never writes to the database directly. It proposes. The user confirms.**

---

### AI Architecture Overview

```
User types in Cmd+K
        ↓
AICommandBar detects intent (slash command vs natural language)
        ↓
Natural language → send to OpenAI API (gpt-4o or gpt-4o-mini)
  with: system message + tool schemas + conversation history
        ↓
OpenAI returns finish_reason: 'tool_calls' OR 'stop'
        ↓
If 'tool_calls' → parse message.tool_calls[]
               → execute tool function client-side (Supabase query, RLS enforced)
               → append role:'tool' results, loop again
        ↓
If tool is a WRITE tool → show AIConfirmationPanel (preview)
                       → user confirms → execute DB write
                       → user cancels → discard
        ↓
If 'stop' → display plain text response in command bar panel
```

**Model selection:**
- Quick queries and task creation: `gpt-4o-mini` (fast, cheap)
- Goal decomposition and day planning: `gpt-4o` (better reasoning)

---

### Story 9.1 — Install OpenAI SDK and configure environment

**Package to install:**
```bash
npm install openai
```

**Environment variable to add to `.env` and `.env.example`:**
```
VITE_OPENAI_API_KEY=sk-...
```

> **Security note:** For a personal single-user app this is acceptable. The key is protected by Supabase Auth (no auth = no app access) and Vite embeds it at build time. Do NOT commit the `.env` file. Add `.env` to `.gitignore` if not already there. If this app ever becomes multi-user, move all OpenAI calls to a Supabase Edge Function proxy.

**Create `src/lib/ai.ts`:**

```typescript
import OpenAI from 'openai'

// Client is instantiated once, reused across the app
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // required for browser usage
})

export const AI_MODELS = {
  fast: 'gpt-4o-mini',   // quick queries, task parsing
  smart: 'gpt-4o',       // goal decomposition, day planning
} as const
```

**Acceptance criteria:**
- `npm run build` succeeds with the new dependency
- `openai` can be imported from `src/lib/ai.ts` without TypeScript errors

---

### Story 9.2 — Define AI tool schemas

**File to create:** `src/lib/aiToolSchemas.ts`

This file defines the function schemas OpenAI uses to request data. The actual execution logic lives separately (Story 9.3). Tools are split into READ and WRITE categories.

OpenAI uses `{ type: 'function', function: { name, description, parameters } }` format — different from Anthropic's `input_schema` format.

```typescript
import type { ChatCompletionTool } from 'openai/resources/chat/completions'

// ─── READ TOOLS ───────────────────────────────────────────────────────────────

export const queryTasksTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'query_tasks',
    description: "Query the user's tasks. Use for analytics questions, finding tasks, checking completion rates.",
    parameters: {
      type: 'object',
      properties: {
        date_from:      { type: 'string', description: 'Start date filter YYYY-MM-DD (optional)' },
        date_to:        { type: 'string', description: 'End date filter YYYY-MM-DD (optional)' },
        task_type:      { type: 'string', enum: ['habit', 'task'], description: 'Filter by type (optional)' },
        status:         { type: 'string', enum: ['todo', 'inprogress', 'done'], description: 'Filter by status (optional)' },
        category_name:  { type: 'string', description: 'Filter by category name, case-insensitive partial match (optional)' },
        title_contains: { type: 'string', description: 'Filter tasks whose title contains this string, case-insensitive (optional)' },
        goal_id:        { type: 'string', description: 'Filter tasks linked to a specific goal id (optional)' },
        limit:          { type: 'number', description: 'Max rows to return, default 100' },
      },
      required: [],
    },
  },
}

export const queryGoalsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'query_goals',
    description: "Fetch all of the user's goals with progress data (task counts, completion %). Use when answering goal questions or generating tasks for a goal.",
    parameters: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'abandoned'], description: 'Filter by goal status (optional)' },
      },
      required: [],
    },
  },
}

export const queryHabitsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'query_habits',
    description: 'Fetch all habits with their streak data. Use to answer streak questions or when planning a day around habits.',
    parameters: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
}

export const getAvailableSlotsTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'get_available_slots',
    description: 'Get days within a date range that have capacity for more tasks (fewer than 3 scheduled tasks). Use when scheduling generated tasks.',
    parameters: {
      type: 'object',
      properties: {
        date_from: { type: 'string', description: 'Start of range YYYY-MM-DD' },
        date_to:   { type: 'string', description: 'End of range YYYY-MM-DD' },
      },
      required: ['date_from', 'date_to'],
    },
  },
}

// ─── WRITE TOOLS (always intercepted for user confirmation) ───────────────────

export const proposeTasksTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'propose_tasks',
    description: 'Propose a list of tasks to create. ALWAYS use this function when you want to create, schedule, or suggest tasks — never just describe them in text. The user will review before anything is saved.',
    parameters: {
      type: 'object',
      properties: {
        tasks: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title:       { type: 'string' },
              description: { type: 'string' },
              date:        { type: 'string', description: 'YYYY-MM-DD, omit if unscheduled' },
              time:        { type: 'string', description: 'HH:MM 24-hour start time, optional' },
              goal_id:     { type: 'string', description: 'Goal UUID to link this task to, optional' },
              priority:    { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
            },
            required: ['title'],
          },
        },
        summary: { type: 'string', description: 'A brief explanation of why you are proposing these tasks' },
      },
      required: ['tasks', 'summary'],
    },
  },
}

export const proposeRescheduleTool: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'propose_reschedule',
    description: 'Propose rescheduling or reordering existing tasks. Use for day planning. The user will review before anything changes.',
    parameters: {
      type: 'object',
      properties: {
        changes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task_id:  { type: 'string' },
              new_date: { type: 'string', description: 'YYYY-MM-DD' },
              new_time: { type: 'string', description: 'HH:MM 24-hour' },
              reason:   { type: 'string', description: 'Why this change is suggested' },
            },
            required: ['task_id', 'reason'],
          },
        },
        summary: { type: 'string' },
      },
      required: ['changes', 'summary'],
    },
  },
}

// ─── Tool collections by use case ─────────────────────────────────────────────

export const READ_TOOLS = [queryTasksTool, queryGoalsTool, queryHabitsTool, getAvailableSlotsTool]
export const ALL_TOOLS  = [...READ_TOOLS, proposeTasksTool, proposeRescheduleTool]

export const WRITE_TOOL_NAMES = new Set(['propose_tasks', 'propose_reschedule'])
```

---

### Story 9.3 — Build the AI Command Bar

**Context:** The app already has a `Cmd+K` command palette. Read the existing command palette component file before editing. It is referenced in `CalendarPage.tsx` keyboard shortcuts. Find its file path by searching for `CommandPalette` or `cmdk` in the codebase.

**Changes to existing command palette:**
- Keep all existing slash commands (`/new`, `/search`, etc.) unchanged
- When the input does not start with `/` and is longer than 3 characters, route to AI mode
- Add an AI mode indicator: show a small `✦ AI` badge in the input when in AI mode

**New file to create:** `src/components/ai/AICommandBar.tsx`

This component wraps the OpenAI API interaction and manages conversation state.

**State:**
```typescript
const [messages, setMessages]           = useState<ConversationMessage[]>([])
const [isThinking, setIsThinking]       = useState(false)
const [pendingProposal, setPendingProposal] = useState<Proposal | null>(null)
```

**`ConversationMessage` type** (add to `src/types.ts`):
```typescript
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
```

**`Proposal` type** (add to `src/types.ts`):
```typescript
export type ProposalType = 'create_tasks' | 'reschedule_tasks'

export interface Proposal {
  type: ProposalType
  summary: string
  items: ProposedTask[] | ProposedReschedule[]
}

export interface ProposedTask {
  title: string
  description?: string
  date?: string | null
  time?: string | null
  goal_id?: string | null
  priority?: TaskPriority
}

export interface ProposedReschedule {
  task_id: string
  task_title: string   // for display only
  new_date?: string
  new_time?: string
  reason: string
}
```

**`sendMessage(userText: string)` function inside AICommandBar:**

OpenAI uses `finish_reason === 'tool_calls'` and `message.tool_calls[]` — different from Anthropic's `stop_reason` and `content` blocks. Tool results are sent as `role: 'tool'` messages.

```typescript
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions'

async function sendMessage(userText: string) {
  setIsThinking(true)

  const updatedMessages = [...messages, { role: 'user', content: userText, timestamp: new Date().toISOString() }]
  setMessages(updatedMessages)

  const systemPrompt = buildSystemPrompt(todayStr, goals, habits)

  // OpenAI message format
  let oaiMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...updatedMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
  ]

  // Agentic loop: keep calling until finish_reason is 'stop' (no more tool calls)
  while (true) {
    const response = await openai.chat.completions.create({
      model: AI_MODELS.fast,
      tools: ALL_TOOLS,
      messages: oaiMessages,
    })

    const choice = response.choices[0]

    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      // Append the assistant message (with tool_calls) to history
      oaiMessages.push(choice.message)

      const toolResultMessages: ChatCompletionMessageParam[] = []

      for (const toolCall of choice.message.tool_calls) {
        const name  = toolCall.function.name
        const input = JSON.parse(toolCall.function.arguments) as Record<string, unknown>

        if (WRITE_TOOL_NAMES.has(name)) {
          // Write tool — intercept, show confirmation panel, stop loop
          setPendingProposal(parseProposal(name, input))
          setIsThinking(false)
          return
        }

        // Read tool — execute against Supabase immediately
        const result = await executeReadTool(name, input)
        toolResultMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }

      // Append all tool results, then loop again
      oaiMessages = [...oaiMessages, ...toolResultMessages]

    } else {
      // finish_reason === 'stop' — plain text response, we're done
      const assistantText = choice.message.content ?? ''
      setMessages(prev => [...prev, { role: 'assistant', content: assistantText, timestamp: new Date().toISOString() }])
      setIsThinking(false)
      break
    }
  }
}
```

**Story 9.3a — System prompt builder**

**File to create:** `src/lib/aiSystemPrompt.ts`

```typescript
export function buildSystemPrompt(todayStr: string, goals: Goal[], habits: Task[]): string {
  const goalsSummary = goals.map(g =>
    `- "${g.title}" (${g.start_date} to ${g.end_date}, ${g.progress ?? 0}% done, id: ${g.id})`
  ).join('\n')

  const habitsSummary = habits.map(h =>
    `- "${h.title}" at ${h.time}–${h.end_time}, streak: ${h.streak?.current ?? 0} days`
  ).join('\n')

  return `You are a personal productivity assistant embedded in Tasky, a habit and goal tracking app.
Today is ${todayStr}.

The user's active goals:
${goalsSummary || 'None yet.'}

The user's habits:
${habitsSummary || 'None yet.'}

Your behaviour rules:
1. Be concise. No lengthy preambles.
2. When asked to create or schedule tasks, ALWAYS use the propose_tasks tool — never just list them in text.
3. When asked to reschedule or plan, ALWAYS use the propose_reschedule tool.
4. For analytics questions, use query_tasks then compute the answer yourself — do not ask the user to calculate.
5. Never invent task IDs. Always fetch real IDs using query tools before proposing reschedules.
6. When generating tasks for a goal, distribute them sensibly over the goal's date range. Do not schedule more than 2 goal tasks on the same day.
7. Respect existing habits when scheduling — do not schedule heavy tasks in the same time blocks as habits.
8. If you don't have enough information, ask one clarifying question — not multiple.`
}
```

**Story 9.3b — Read tool executor**

**File to create:** `src/lib/aiToolExecutor.ts`

```typescript
// Executes read-only tool calls against Supabase using the authenticated client
// RLS ensures the user only ever sees their own data

export async function executeReadTool(toolName: string, input: Record<string, unknown>) {
  switch (toolName) {
    case 'query_tasks':     return executeQueryTasks(input)
    case 'query_goals':     return executeQueryGoals(input)
    case 'query_habits':    return executeQueryHabits()
    case 'get_available_slots': return executeGetAvailableSlots(input)
    default: return { error: `Unknown tool: ${toolName}` }
  }
}

async function executeQueryTasks(input) {
  let query = supabase
    .from('tasks')
    .select('id,title,status,task_type,date,time,priority,goal_id,category:categories(name),completed_at')
    .is('deleted_at', null)

  if (input.date_from)      query = query.gte('date', input.date_from)
  if (input.date_to)        query = query.lte('date', input.date_to)
  if (input.task_type)      query = query.eq('task_type', input.task_type)
  if (input.status)         query = query.eq('status', input.status)
  if (input.goal_id)        query = query.eq('goal_id', input.goal_id)
  if (input.title_contains) query = query.ilike('title', `%${input.title_contains}%`)
  if (input.limit)          query = query.limit(input.limit)

  const { data, error } = await query
  if (error) return { error: error.message }
  return { tasks: data, count: data?.length ?? 0 }
}

async function executeQueryGoals(input) {
  let query = supabase.from('goals').select(GOAL_SELECT)
  if (input.status) query = query.eq('status', input.status)
  const { data, error } = await query
  if (error) return { error: error.message }
  // Attach progress data
  // (reuse computeGoalProgress logic from useGoals hook)
  return { goals: data }
}

async function executeQueryHabits() {
  const { data: habits, error } = await supabase
    .from('tasks')
    .select(`${TASK_SELECT}, habit_streaks(current_streak, longest_streak, last_completed_date)`)
    .eq('task_type', 'habit')
    .is('deleted_at', null)
  if (error) return { error: error.message }
  return { habits }
}

async function executeGetAvailableSlots(input) {
  const { data, error } = await supabase
    .from('tasks')
    .select('date')
    .gte('date', input.date_from)
    .lte('date', input.date_to)
    .is('deleted_at', null)
    .neq('task_type', 'habit')

  if (error) return { error: error.message }

  // Count tasks per date, return dates with fewer than 3 tasks
  const counts: Record<string, number> = {}
  for (const t of data ?? []) {
    if (t.date) counts[t.date] = (counts[t.date] ?? 0) + 1
  }

  // Generate all dates in range
  const slots: string[] = []
  let cursor = new Date(input.date_from)
  const end  = new Date(input.date_to)
  while (cursor <= end) {
    const dateStr = cursor.toISOString().split('T')[0]
    if ((counts[dateStr] ?? 0) < 3) slots.push(dateStr)
    cursor.setDate(cursor.getDate() + 1)
  }

  return { available_dates: slots }
}
```

**Story 9.3c — AI Confirmation Panel**

**File to create:** `src/components/ai/AIConfirmationPanel.tsx`

**Props:**
```typescript
interface AIConfirmationPanelProps {
  proposal: Proposal
  onConfirm: (proposal: Proposal) => Promise<void>
  onCancel: () => void
}
```

**Layout for `create_tasks` proposal:**
```
✦ AI wants to create 8 tasks for "Learn Backend"

[✓] Learn Node.js basics            Mar 3  (Mon)
[✓] Build first Express server       Mar 5  (Wed)
[✓] Understand REST principles       Mar 7  (Fri)
... (each item is an editable row — user can uncheck or change date)

[Confirm all]   [Cancel]
```

**Layout for `reschedule_tasks` proposal:**
```
✦ AI suggests these changes for your 3-hour window

[✓] Learn JWT auth    → move to 2:00 PM    (was 4:00 PM)   "High priority, goal deadline near"
[✓] Read 5 pages      → move to 8:00 PM    (was 2:00 PM)   "Low effort, end of day"
[ ] Team standup      → no change suggested

[Confirm checked]   [Cancel]
```

**On confirm:** iterate checked items, execute the appropriate Supabase writes (INSERT for tasks, UPDATE for reschedules), invalidate relevant query keys, show `toast.success()`.

---

### Story 9.4 — Natural Language Task Creation

**Trigger:** User types something like: *"add watch LangChain tutorial on Saturday afternoon linked to my AI expert goal"*

**How Claude handles it:** Claude uses `query_goals` to find the goal ID, then calls `propose_tasks` with one task, pre-filled fields.

**What the implementer must do:**
- No new UI needed beyond Story 9.3 — the AICommandBar + AIConfirmationPanel handle everything
- Test these natural language patterns to verify correct field parsing:
  - `"add [title] on [date]"` → correct date
  - `"add [title] at [time]"` → correct time field
  - `"add [title] linked to [goal name]"` → correct goal_id via query_goals tool call
  - `"add [title] tomorrow"` → resolves to tomorrow's date
  - `"add [title]"` (no date) → creates unscheduled task in backlog

**Acceptance criteria:**
- A confirmed proposal from `propose_tasks` with one item correctly creates a task in Supabase
- The task appears in the cockpit on its scheduled date after query invalidation
- Unscheduled tasks appear in backlog

---

### Story 9.5 — Natural Language Analytics Queries

**Trigger:** User types a question like: *"what percentage of gym tasks done last 3 weeks?"*

**Flow:**
1. Claude calls `query_tasks` with `{ title_contains: "gym", date_from: "3 weeks ago", date_to: "today" }`
2. Receives task list
3. Computes: `done_count / total_count * 100`
4. Responds in plain text: *"You completed 14 out of 18 gym sessions in the last 3 weeks — 78%."*

**No confirmation panel needed** — this is purely read + respond.

**Test these query patterns** (verify Claude produces correct tool calls for each):
- `"how many times did I skip AI learning this month?"`
- `"which goal am I most behind on?"`
- `"what's my most productive day of the week?"`
- `"how many tasks have I completed in total?"`
- `"show me everything due this week"`

**Acceptance criteria:**
- Query returns real data from the user's Supabase instance
- Numbers in the response match what a manual Supabase query would return
- Response is in plain English, not raw JSON

---

### Story 9.6 — Goal Task Generation + Auto-Schedule Preview

**Trigger:** User types: *"generate tasks for my backend goal"* or *"break down the AI expert goal into tasks"*

**Flow:**
1. Claude calls `query_goals` → gets the matching goal with `id`, `start_date`, `end_date`
2. Claude calls `get_available_slots` for the goal's date range
3. Claude calls `propose_tasks` with a structured breakdown spread across available slots
4. AIConfirmationPanel shows all proposed tasks — user can uncheck, edit dates, or edit titles inline before confirming

**Task generation quality rules** (enforce via system prompt — already included in Story 9.3a):
- Maximum 2 goal tasks per day
- Tasks distributed progressively (fundamentals first, advanced tasks later in the date range)
- Each task has a realistic scope for one sitting (1–2 hours)
- At least 20% buffer at the end of the date range (no tasks in last 2 weeks)
- Never schedule on the same time block as an existing habit

**Acceptance criteria:**
- For a 4-month goal, AI generates 15–25 tasks
- Tasks are distributed across the date range — not all in week 1
- All tasks are linked to the correct `goal_id`
- Confirmed tasks appear in the Goal detail page and in cockpit on their dates

---

### Story 9.7 — Day Planning ("I have 3 hours today")

**Trigger:** User types: *"I have 3 hours today, plan my day"* or *"rearrange my tasks for today"*

**Flow:**
1. Claude calls `query_habits` → gets today's habits + their time blocks
2. Claude calls `query_tasks` with `{ date: today }` → gets today's tasks
3. Claude calls `query_goals` → gets goal deadlines and progress (to prioritise tasks linked to near-deadline goals)
4. Claude computes a ranked order and time assignments that:
   - Respect existing habit time blocks (no overlap)
   - Put highest-priority / goal-deadline tasks first
   - Fit within the stated hours
5. Claude calls `propose_reschedule` with time changes for today's tasks
6. AIConfirmationPanel shows proposed time changes
7. User confirms → UPDATE tasks SET time = new_time for each confirmed change

**Input variations to handle:**
- *"I only have 3 hours today"* → Claude selects top N tasks that fit 3 hours
- *"I'm tired today"* → Claude selects `priority = 'low'` or short tasks only
- *"Plan tomorrow"* → same flow but for tomorrow's date

**Acceptance criteria:**
- Proposed schedule respects all existing habit time blocks
- Tasks that don't fit in the stated time are excluded from proposal with a note
- Confirmed reschedules update `time` field in Supabase and cockpit reflects new order

---

### Story 9.8 — Weekly Goal Health Check

**Trigger:** Manual — a "Weekly Review" button in the Goals page header. Not automatic.

**File to edit:** `src/pages/Goals.tsx` — add a `Weekly Review` button next to `+ New Goal`.

**Flow:**
1. Clicking the button opens a full-screen or large modal: `AIWeeklyReviewPanel`
2. Panel calls `sendMessage("Generate my weekly goal health check")` automatically on open
3. Claude calls `query_goals` + `query_tasks` for the past 7 days + `query_habits` for streak data
4. Claude computes for each active goal:
   - Tasks completed this week vs expected pace (total_tasks / total_weeks = expected per week)
   - On track / behind / ahead status
5. Claude responds in structured plain text (no tool needed for the response itself):

```
Weekly Review — Feb 24–26

Backend Goal (ends July)
  ✓ On track — 3/3 planned tasks done this week
  Pace: completing 3 tasks/week, need 2.5/week to finish on time

AI Expert Goal (ends May)
  ⚠ Behind — 0/3 planned tasks done this week
  At this pace, you'll miss your May 31 deadline by ~3 weeks.
  → Schedule 4 tasks next week to recover? [Generate plan]

Gym habit — 🔥 12 day streak
  Missed: Wednesday (you had a heavy day)
  Pattern: you often miss Wednesdays — consider moving gym to 8 PM Wed
```

6. If the user clicks `[Generate plan]` inline, it triggers Story 9.6 flow for that goal.

**File to create:** `src/components/ai/AIWeeklyReviewPanel.tsx`

---

### Story 9.9 — Streak Protection Nudge

**Location:** `CockpitPage.tsx` (cockpit header area)

**Trigger condition (computed client-side, no AI call):**
- Current time is after 5 PM
- User has a habit with `current_streak >= 7` days
- That habit's `status !== 'done'` for today
- User has not dismissed the nudge today (store dismissal in `localStorage` keyed by `habit_id + today_date`)

**UI:** A dismissible amber banner below `CockpitHeader`:
```
⚡ Gym streak at risk — 12 days. You haven't logged it yet today.
   [Mark done]   [Dismiss]
```

- `[Mark done]` calls the same `toggleHabit` function from Story 3.5 — marks the habit done directly
- `[Dismiss]` writes `dismissed_{habitId}_{todayDate} = true` to `localStorage`, hides banner for the day

**No AI call needed** — this is pure client-side logic derived from habit streak data already loaded in the cockpit.

**Acceptance criteria:**
- Banner only appears after 5 PM
- Banner only appears when streak >= 7 days and habit is not done
- Dismissing hides it for the rest of the day (persists across page refreshes via localStorage)
- Multiple at-risk habits: show one banner per habit (stacked)

---

## Global Constraints & Conventions

### Do not break these things
1. **Supabase RLS** — every new table must have RLS enabled with user-scoped policies. Never disable RLS.
2. **Soft deletes** — tasks use `deleted_at` for soft deletion. Never hard-delete tasks. All task queries must include `.is('deleted_at', null)`.
3. **TanStack Query patterns** — all server state goes through `useQuery` / `useMutation`. No raw `useState` for server data.
4. **TypeScript strict mode** — no `any` types. All new interfaces go in `src/types.ts`.
5. **Tailwind only** — no new CSS files. Use only Tailwind utility classes.
6. **Recurrence** — habits use the existing `RecurrenceRule` and `expandRecurrence()` from `src/lib/recurrence.ts`. Do not create a parallel recurrence system.
7. **Backward compatibility** — existing tasks without `task_type` default to `'task'` at the DB level. No migration of existing data needed beyond the ALTER TABLE statements.

### AI-specific constraints (Phase 9)
8. **AI never writes directly** — all `propose_tasks` and `propose_reschedule` tool calls must be intercepted and shown in `AIConfirmationPanel` before any DB write. The agentic loop must stop when a write tool is encountered and wait for user action.
9. **Read tools only query authenticated user's data** — all Supabase calls in `aiToolExecutor.ts` use the authenticated `supabase` client. RLS enforces data isolation automatically. Never pass `user_id` as a filter parameter from AI input — it is always injected server-side by RLS.
10. **No `any` in AI tool input parsing** — tool inputs from Claude are typed as `Record<string, unknown>`. Access fields with type guards, not casting.
11. **API key never in source control** — `VITE_OPENAI_API_KEY` lives only in `.env`. Verify `.env` is in `.gitignore` before implementing Phase 9.
12. **AI model selection** — use `gpt-4o-mini` for quick queries (stories 9.4, 9.5). Use `gpt-4o` for goal decomposition and day planning (stories 9.6, 9.7, 9.8). This controls cost.
13. **Conversation history** — the AICommandBar keeps message history in component state only. It is NOT persisted to Supabase. History resets when the command bar closes.

### Code patterns to follow
- Auth: `const { user } = useAuth()` from `src/contexts/AuthContext.tsx`
- Supabase client: `import { supabase } from '../lib/supabase'` (verify this import path in existing hooks)
- Toast notifications: `import { toast } from 'sonner'` — `toast.success()`, `toast.error()`
- Query invalidation: `const queryClient = useQueryClient()` then `queryClient.invalidateQueries({ queryKey: [...] })`
- Modal pattern: study `AddTaskModal.tsx` for the existing open/close/overlay pattern before creating new modals
- Empty states: study existing empty state components in `src/components/ui/` before creating new ones

### Execution order
Phases must be executed in order. Each phase is independently shippable and should not leave the app in a broken state. A phase is complete only when:
1. TypeScript compiles with no errors
2. The new screen/feature renders without runtime errors
3. Existing screens that were not modified still work

---

---

## Phase 9 — Story Summary

| Story | Feature | AI call? | Writes DB? | Confirmation needed? |
|---|---|---|---|---|
| 9.1 | Claude SDK setup | — | — | — |
| 9.2 | Tool schemas | — | — | — |
| 9.3 | AI command bar + agentic loop | Yes | Via confirmation only | — |
| 9.4 | Natural language task creation | Yes | Yes | Yes — AIConfirmationPanel |
| 9.5 | Analytics queries | Yes | No | No |
| 9.6 | Goal task generation | Yes | Yes | Yes — AIConfirmationPanel |
| 9.7 | Day planning | Yes | Yes | Yes — AIConfirmationPanel |
| 9.8 | Weekly health check | Yes | No (read + display) | No — generates link to 9.6 |
| 9.9 | Streak protection nudge | No | Via existing toggle | No — direct action |

---

*End of Blueprint — Last updated: 2026-02-26*
