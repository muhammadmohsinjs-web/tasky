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
| 9 | AI integration | Medium — Python FastAPI server + OpenAI API |

**Each phase must be independently deployable.** Do not mix phases in a single commit.

### Phase 9 Sub-phases (execute in order)
| Sub-phase | Stories | What | Where |
|---|---|---|---|
| 9-A | 9.1–9.3c | Python server: setup, schemas, agentic loop, Supabase executor, routes | Python |
| 9-B | 9.3d–9.3e | Frontend: AIConfirmationPanel + AICommandBar (calls Python) | Frontend |
| 9-C | 9.4–9.5 | Read-only AI features: task creation, analytics queries | Both |
| 9-D | 9.6–9.7 | Write features with confirmation: goal generation, day planning | Both |
| 9-E | 9.8–9.9 | Proactive features: weekly health check, streak nudge | Both |

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
Embed OpenAI (GPT-4o) into Tasky via a **Python FastAPI backend server**. The frontend never calls OpenAI directly. All AI logic — the agentic loop, tool execution, Supabase reads — runs in Python. The frontend sends messages, receives responses or proposals, and handles user confirmation before writing to Supabase.

AI features split into two classes:
- **Read** — query and analyse user data, answer questions in plain English (no confirmation needed)
- **Write** — generate tasks, schedule, plan the day (always returns a proposal; user confirms before any DB write)

**Golden rule: The Python server never writes to the database. It proposes. The frontend confirms and writes.**

---

### AI Architecture Overview

```
User types in Cmd+K
        ↓
AICommandBar (React) — detects AI intent
        ↓
POST /api/chat  →  Python FastAPI server
  body: { messages, user_id, today }
  header: X-API-Key: <server_secret>
        ↓
Python: agentic loop with OpenAI
  → tool_calls? → execute against Supabase (service role, user_id scoped)
  → write tool? → stop loop, return { type: 'proposal', ... }
  → stop?       → return { type: 'text', content: '...' }
        ↓
Frontend receives response
  → type='text'     → display in command bar
  → type='proposal' → show AIConfirmationPanel
        ↓
User confirms proposal
  → Frontend writes to Supabase directly (JS client, RLS enforced)
  → Invalidate TanStack Query keys
```

**Model selection:**
- Quick queries and task creation: `gpt-4o-mini` (fast, cheap)
- Goal decomposition and day planning: `gpt-4o` (better reasoning)

**Server location:** `ai-server/` folder at the project root (sibling to `src/`)

---

### Story 9.1 — Set up Python FastAPI server

**Folder to create:** `ai-server/` at the project root

**File structure:**
```
ai-server/
  main.py                  # FastAPI app, routes
  tools/
    __init__.py
    schemas.py             # OpenAI tool schema dicts
    executor.py            # Supabase read tool execution
  ai/
    __init__.py
    chat.py                # agentic loop
    system_prompt.py       # system prompt builder
  .env                     # secrets (never committed)
  .env.example             # template
  requirements.txt
```

**`requirements.txt`:**
```
fastapi==0.115.0
uvicorn[standard]==0.30.0
openai==1.50.0
supabase==2.7.0
python-dotenv==1.0.0
pydantic==2.9.0
```

**`ai-server/.env`:**
```
OPENAI_API_KEY=sk-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # service role key from Supabase dashboard
SERVER_API_KEY=some-random-secret  # used to authenticate requests from the frontend
```

**`ai-server/.env.example`:**
```
OPENAI_API_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SERVER_API_KEY=
```

> **Security note:** The service role key bypasses RLS. This is safe here because all queries in `executor.py` explicitly filter by `user_id` extracted from the request body. Never expose the service role key to the browser. Add `ai-server/.env` to `.gitignore`.

**Add to root `.gitignore`:**
```
ai-server/.env
ai-server/__pycache__/
ai-server/.venv/
```

**Run command (development):**
```bash
cd ai-server && uvicorn main:app --reload --port 8000
```

**Frontend env var to add to root `.env`:**
```
VITE_AI_SERVER_URL=http://localhost:8000
VITE_AI_SERVER_KEY=some-random-secret   # must match SERVER_API_KEY in ai-server/.env
```

**Acceptance criteria:**
- `uvicorn main:app --reload` starts without errors
- `GET http://localhost:8000/health` returns `{"status": "ok"}`

---

### Story 9.2 — Define tool schemas in Python

**File to create:** `ai-server/tools/schemas.py`

OpenAI tool format in Python is a plain dict with `type: 'function'` and a nested `function` key.

```python
from typing import Final

# ─── READ TOOLS ────────────────────────────────────────────────────────────────

QUERY_TASKS_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "query_tasks",
        "description": "Query the user's tasks. Use for analytics questions, finding tasks, checking completion rates.",
        "parameters": {
            "type": "object",
            "properties": {
                "date_from":      {"type": "string", "description": "Start date filter YYYY-MM-DD (optional)"},
                "date_to":        {"type": "string", "description": "End date filter YYYY-MM-DD (optional)"},
                "task_type":      {"type": "string", "enum": ["habit", "task"]},
                "status":         {"type": "string", "enum": ["todo", "inprogress", "done"]},
                "title_contains": {"type": "string", "description": "Case-insensitive partial match on title"},
                "goal_id":        {"type": "string", "description": "Filter by linked goal UUID"},
                "limit":          {"type": "integer", "description": "Max rows, default 100"},
            },
            "required": [],
        },
    },
}

QUERY_GOALS_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "query_goals",
        "description": "Fetch the user's goals with progress data. Use for goal questions or when generating tasks.",
        "parameters": {
            "type": "object",
            "properties": {
                "status": {"type": "string", "enum": ["active", "completed", "abandoned"]},
            },
            "required": [],
        },
    },
}

QUERY_HABITS_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "query_habits",
        "description": "Fetch all habits with streak data. Use for streak questions or day planning.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    },
}

GET_AVAILABLE_SLOTS_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "get_available_slots",
        "description": "Return dates in a range that have fewer than 3 scheduled tasks. Use when scheduling generated tasks.",
        "parameters": {
            "type": "object",
            "properties": {
                "date_from": {"type": "string", "description": "YYYY-MM-DD"},
                "date_to":   {"type": "string", "description": "YYYY-MM-DD"},
            },
            "required": ["date_from", "date_to"],
        },
    },
}

# ─── WRITE TOOLS (returned as proposals, never executed server-side) ───────────

PROPOSE_TASKS_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "propose_tasks",
        "description": "Propose tasks to create. ALWAYS use this when asked to create or schedule tasks. Never list tasks in plain text.",
        "parameters": {
            "type": "object",
            "properties": {
                "tasks": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "title":       {"type": "string"},
                            "description": {"type": "string"},
                            "date":        {"type": "string", "description": "YYYY-MM-DD, omit if unscheduled"},
                            "time":        {"type": "string", "description": "HH:MM 24-hour"},
                            "goal_id":     {"type": "string"},
                            "priority":    {"type": "string", "enum": ["low", "medium", "high", "urgent"]},
                        },
                        "required": ["title"],
                    },
                },
                "summary": {"type": "string"},
            },
            "required": ["tasks", "summary"],
        },
    },
}

PROPOSE_RESCHEDULE_TOOL: Final = {
    "type": "function",
    "function": {
        "name": "propose_reschedule",
        "description": "Propose rescheduling existing tasks. Use for day planning. Never execute directly.",
        "parameters": {
            "type": "object",
            "properties": {
                "changes": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "task_id":  {"type": "string"},
                            "new_date": {"type": "string", "description": "YYYY-MM-DD"},
                            "new_time": {"type": "string", "description": "HH:MM 24-hour"},
                            "reason":   {"type": "string"},
                        },
                        "required": ["task_id", "reason"],
                    },
                },
                "summary": {"type": "string"},
            },
            "required": ["changes", "summary"],
        },
    },
}

# ─── Collections ────────────────────────────────────────────────────────────────

READ_TOOLS  = [QUERY_TASKS_TOOL, QUERY_GOALS_TOOL, QUERY_HABITS_TOOL, GET_AVAILABLE_SLOTS_TOOL]
ALL_TOOLS   = READ_TOOLS + [PROPOSE_TASKS_TOOL, PROPOSE_RESCHEDULE_TOOL]
WRITE_TOOL_NAMES = {"propose_tasks", "propose_reschedule"}
```

---

### Story 9.3 — Build the agentic loop in Python

**File to create:** `ai-server/ai/chat.py`

This is the core agentic loop. It runs entirely server-side.

```python
import json
from openai import OpenAI
from tools.schemas import ALL_TOOLS, WRITE_TOOL_NAMES
from tools.executor import execute_read_tool
from ai.system_prompt import build_system_prompt

client = OpenAI()  # reads OPENAI_API_KEY from environment

def run_chat(messages: list[dict], user_id: str, today: str, goals: list, habits: list) -> dict:
    """
    Run the agentic loop.
    Returns either:
      {"type": "text", "content": "..."}
      {"type": "proposal", "proposal_type": "create_tasks"|"reschedule_tasks", "items": [...], "summary": "..."}
    """
    system_prompt = build_system_prompt(today, goals, habits)

    oai_messages = [
        {"role": "system", "content": system_prompt},
        *messages,  # already in {"role": ..., "content": ...} format
    ]

    while True:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            tools=ALL_TOOLS,
            messages=oai_messages,
        )

        choice = response.choices[0]

        if choice.finish_reason == "tool_calls":
            oai_messages.append(choice.message)  # append assistant message with tool_calls

            tool_results = []

            for tool_call in choice.message.tool_calls:
                name  = tool_call.function.name
                args  = json.loads(tool_call.function.arguments)

                if name in WRITE_TOOL_NAMES:
                    # Write tool — stop loop, return proposal to frontend
                    proposal_type = "create_tasks" if name == "propose_tasks" else "reschedule_tasks"
                    return {
                        "type": "proposal",
                        "proposal_type": proposal_type,
                        "items": args.get("tasks") or args.get("changes"),
                        "summary": args.get("summary", ""),
                    }

                # Read tool — execute against Supabase, scoped to user_id
                result = execute_read_tool(name, args, user_id)
                tool_results.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": json.dumps(result),
                })

            oai_messages.extend(tool_results)

        else:
            # finish_reason == "stop" — plain text response
            return {
                "type": "text",
                "content": choice.message.content or "",
            }
```

**Note on model selection:** For stories 9.6 and 9.7 (goal generation, day planning), the calling code in `main.py` should pass `model="gpt-4o"` to `client.chat.completions.create`. For quick queries, use `"gpt-4o-mini"`. Refactor `run_chat` to accept a `model` parameter.

---

### Story 9.3a — System prompt builder in Python

**File to create:** `ai-server/ai/system_prompt.py`

```python
def build_system_prompt(today: str, goals: list[dict], habits: list[dict]) -> str:
    goals_summary = "\n".join(
        f'- "{g["title"]}" ({g.get("start_date")} to {g.get("end_date")}, '
        f'{g.get("progress", 0):.0f}% done, id: {g["id"]})'
        for g in goals
    ) or "None yet."

    habits_summary = "\n".join(
        f'- "{h["title"]}" at {h.get("time", "?")}–{h.get("end_time", "?")}, '
        f'streak: {h.get("habit_streaks", {}).get("current_streak", 0)} days'
        for h in habits
    ) or "None yet."

    return f"""You are a personal productivity assistant embedded in Tasky.
Today is {today}.

The user's active goals:
{goals_summary}

The user's habits:
{habits_summary}

Rules:
1. Be concise. No lengthy preambles.
2. When asked to create or schedule tasks, ALWAYS use propose_tasks — never list in plain text.
3. When asked to reschedule or plan a day, ALWAYS use propose_reschedule.
4. For analytics questions, use query_tasks then compute the answer yourself.
5. Never invent task IDs. Fetch real IDs with query tools before proposing reschedules.
6. When generating tasks for a goal, distribute across the date range. Max 2 goal tasks per day.
7. Never schedule tasks in the same time block as an existing habit.
8. If you need clarification, ask one question — not multiple."""
```

---

### Story 9.3b — Supabase read tool executor in Python

**File to create:** `ai-server/tools/executor.py`

Uses the service role key but scopes every query to `user_id`. This preserves data isolation without relying on RLS (service role bypasses it, so we enforce it manually in every query).

```python
import os
from datetime import date, timedelta
from supabase import create_client, Client

def get_supabase() -> Client:
    return create_client(
        os.environ["SUPABASE_URL"],
        os.environ["SUPABASE_SERVICE_ROLE_KEY"],
    )

def execute_read_tool(tool_name: str, args: dict, user_id: str) -> dict:
    match tool_name:
        case "query_tasks":         return query_tasks(args, user_id)
        case "query_goals":         return query_goals(args, user_id)
        case "query_habits":        return query_habits(user_id)
        case "get_available_slots": return get_available_slots(args, user_id)
        case _:                     return {"error": f"Unknown tool: {tool_name}"}

def query_tasks(args: dict, user_id: str) -> dict:
    sb = get_supabase()
    q = (
        sb.table("tasks")
        .select("id,title,status,task_type,date,time,priority,goal_id,completed_at,categories(name)")
        .eq("user_id", user_id)
        .is_("deleted_at", "null")
    )
    if args.get("date_from"):      q = q.gte("date", args["date_from"])
    if args.get("date_to"):        q = q.lte("date", args["date_to"])
    if args.get("task_type"):      q = q.eq("task_type", args["task_type"])
    if args.get("status"):         q = q.eq("status", args["status"])
    if args.get("goal_id"):        q = q.eq("goal_id", args["goal_id"])
    if args.get("title_contains"): q = q.ilike("title", f'%{args["title_contains"]}%')
    if args.get("limit"):          q = q.limit(args["limit"])

    result = q.execute()
    return {"tasks": result.data, "count": len(result.data)}

def query_goals(args: dict, user_id: str) -> dict:
    sb = get_supabase()
    q = (
        sb.table("goals")
        .select("id,title,start_date,end_date,status,color")
        .eq("user_id", user_id)
    )
    if args.get("status"): q = q.eq("status", args["status"])
    goals = q.execute().data

    # Attach task counts for progress
    for goal in goals:
        tasks = (
            sb.table("tasks")
            .select("status")
            .eq("goal_id", goal["id"])
            .eq("user_id", user_id)
            .is_("deleted_at", "null")
            .execute()
            .data
        )
        total = len(tasks)
        done  = sum(1 for t in tasks if t["status"] == "done")
        goal["task_count"] = total
        goal["completed_task_count"] = done
        goal["progress"] = round(done / total * 100) if total > 0 else 0

    return {"goals": goals}

def query_habits(user_id: str) -> dict:
    sb = get_supabase()
    habits = (
        sb.table("tasks")
        .select("id,title,time,end_time,recurrence,habit_streaks(current_streak,longest_streak,last_completed_date)")
        .eq("user_id", user_id)
        .eq("task_type", "habit")
        .is_("deleted_at", "null")
        .execute()
        .data
    )
    return {"habits": habits}

def get_available_slots(args: dict, user_id: str) -> dict:
    sb = get_supabase()
    tasks = (
        sb.table("tasks")
        .select("date")
        .eq("user_id", user_id)
        .gte("date", args["date_from"])
        .lte("date", args["date_to"])
        .is_("deleted_at", "null")
        .neq("task_type", "habit")
        .execute()
        .data
    )

    counts: dict[str, int] = {}
    for t in tasks:
        if t["date"]:
            counts[t["date"]] = counts.get(t["date"], 0) + 1

    # Return all dates with fewer than 3 tasks
    slots = []
    cursor = date.fromisoformat(args["date_from"])
    end    = date.fromisoformat(args["date_to"])
    while cursor <= end:
        ds = cursor.isoformat()
        if counts.get(ds, 0) < 3:
            slots.append(ds)
        cursor += timedelta(days=1)

    return {"available_dates": slots}
```

---

### Story 9.3c — FastAPI main routes

**File to create:** `ai-server/main.py`

```python
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from ai.chat import run_chat
from tools.executor import query_goals, query_habits

SERVER_API_KEY = os.environ["SERVER_API_KEY"]

app = FastAPI()

@app.get("/health")
def health():
    return {"status": "ok"}

class ChatRequest(BaseModel):
    messages: list[dict]   # [{"role": "user"|"assistant", "content": "..."}]
    user_id: str
    today: str             # "YYYY-MM-DD"
    use_smart_model: bool = False  # True for goal generation, day planning

@app.post("/api/chat")
def chat(req: ChatRequest, x_api_key: str = Header()):
    if x_api_key != SERVER_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Pre-load goals and habits for the system prompt
    goals  = query_goals({}, req.user_id).get("goals", [])
    habits = query_habits(req.user_id).get("habits", [])

    result = run_chat(
        messages=req.messages,
        user_id=req.user_id,
        today=req.today,
        goals=goals,
        habits=habits,
        model="gpt-4o" if req.use_smart_model else "gpt-4o-mini",
    )
    return result
```

**Update `ai/chat.py`** to accept `model` parameter:
```python
def run_chat(messages, user_id, today, goals, habits, model="gpt-4o-mini") -> dict:
    ...
    response = client.chat.completions.create(
        model=model,   # use the passed model
        ...
    )
```

---

### Story 9.3d — AI Confirmation Panel (frontend, unchanged concept)

**File to create:** `src/components/ai/AIConfirmationPanel.tsx`

This component is frontend-only and does not change from the original design. The Python server returns a proposal; the frontend renders it for review; on confirm the frontend writes to Supabase directly using the existing JS client (RLS enforced by user's JWT session).

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

[✓] Learn Node.js basics         Mar 3   (Mon)   ← date is editable inline
[✓] Build first Express server   Mar 5   (Wed)
[✓] REST principles              Mar 7   (Fri)

[Confirm all]   [Cancel]
```

**Layout for `reschedule_tasks` proposal:**
```
✦ AI suggests these changes for your 3-hour window

[✓] Learn JWT auth   → 2:00 PM  (was 4:00 PM)   "Goal deadline near"
[✓] Read 5 pages     → 8:00 PM  (was 2:00 PM)   "Low effort, end of day"

[Confirm checked]   [Cancel]
```

**On confirm:** iterate checked items, `supabase.from('tasks').insert(...)` for new tasks, `.update(...)` for reschedules. Invalidate `['cockpit-tasks']` and `['goals']` query keys. Show `toast.success()`.

---

### Story 9.3e — AI Command Bar (frontend, calls Python server)

**File to create:** `src/components/ai/AICommandBar.tsx`

This is now a thin client. It sends messages to the Python server and handles the response. All agentic logic is gone from the frontend.

**Types to add to `src/types.ts`:**
```typescript
export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

export type ProposalType = 'create_tasks' | 'reschedule_tasks'

export interface Proposal {
  type: 'proposal'
  proposal_type: ProposalType
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
  task_title: string
  new_date?: string
  new_time?: string
  reason: string
}
```

**`sendMessage` function (frontend, calls Python server):**
```typescript
const AI_SERVER_URL = import.meta.env.VITE_AI_SERVER_URL  // http://localhost:8000
const AI_SERVER_KEY = import.meta.env.VITE_AI_SERVER_KEY

async function sendMessage(userText: string) {
  setIsThinking(true)

  const updatedMessages = [
    ...messages,
    { role: 'user', content: userText, timestamp: new Date().toISOString() },
  ]
  setMessages(updatedMessages)

  const response = await fetch(`${AI_SERVER_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': AI_SERVER_KEY,
    },
    body: JSON.stringify({
      messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
      user_id: user.id,                                // from useAuth()
      today: new Date().toISOString().split('T')[0],
      use_smart_model: isComplexRequest(userText),     // see note below
    }),
  })

  const data = await response.json()

  if (data.type === 'text') {
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: data.content,
      timestamp: new Date().toISOString(),
    }])
  } else if (data.type === 'proposal') {
    setPendingProposal(data)
  }

  setIsThinking(false)
}

// Use smart model for goal/day planning requests
function isComplexRequest(text: string): boolean {
  const complexKeywords = ['generate tasks', 'break down', 'plan my day', 'weekly review', 'rearrange']
  return complexKeywords.some(k => text.toLowerCase().includes(k))
}
```

**Acceptance criteria:**
- Typing a question calls `POST /api/chat` and displays the text response
- Typing a task creation request triggers the `AIConfirmationPanel`
- Server returns 401 if `X-API-Key` is wrong

---

### Story 9.4 — Natural Language Task Creation

**No changes from original design.** The Python server handles the agentic loop; the frontend `AICommandBar` and `AIConfirmationPanel` handle display and confirmation.

**Test these patterns** by running the Python server and typing in the command bar:
- `"add watch LangChain tutorial on Saturday at 3pm linked to AI expert goal"` → proposal with 1 task
- `"add fix resume"` (no date) → proposal with 1 unscheduled task
- `"add call dentist tomorrow"` → proposal with date = tomorrow

**Acceptance criteria:**
- Server correctly identifies goal_id by calling `query_goals` tool internally
- Confirmed proposal creates the task in Supabase via frontend JS client
- Task appears in cockpit on its date

---

### Story 9.5 — Natural Language Analytics Queries

**No changes from original design.** Python server runs the query, computes the answer, returns `type: 'text'`.

**Test these** by typing directly in the command bar with the Python server running:
- `"what % of gym tasks done last 3 weeks?"` → text response with computed number
- `"which goal am I most behind on?"` → text response comparing goal paces
- `"how many tasks completed this month?"` → count query + text answer

**Acceptance criteria:**
- No proposal panel shown — just text response in command bar
- Numbers match a manual Supabase query for the same date range

---

### Story 9.6 — Goal Task Generation + Auto-Schedule Preview

**Frontend change:** pass `use_smart_model: true` when the input contains goal generation keywords (handled by `isComplexRequest()` in Story 9.3e).

**Python server** runs the multi-step agentic loop:
1. `query_goals` → find goal
2. `get_available_slots` → find free dates in goal's range
3. `propose_tasks` → return proposal

**Frontend** receives `type: 'proposal'` and shows `AIConfirmationPanel` with all generated tasks.

**Acceptance criteria:** same as original — 15–25 tasks for a 4-month goal, distributed across the range, linked to correct `goal_id`.

---

### Story 9.7 — Day Planning ("I have 3 hours today")

**Frontend change:** `use_smart_model: true` for inputs containing "plan my day", "rearrange", "hours today".

**Python server** runs:
1. `query_habits` → time blocks to avoid
2. `query_tasks` (date = today) → current tasks
3. `query_goals` → deadlines for prioritisation
4. `propose_reschedule` → return proposal

**Frontend** receives `type: 'proposal'` and shows `AIConfirmationPanel` with time changes.

**Acceptance criteria:** same as original.

---

### Story 9.8 — Weekly Goal Health Check

**Trigger:** "Weekly Review" button in Goals page → opens `AIWeeklyReviewPanel`.

**`AIWeeklyReviewPanel`** sends `"Generate my weekly goal health check"` with `use_smart_model: true` on mount.

**Python server** calls `query_goals` + `query_tasks` (last 7 days) + `query_habits`, computes pace, returns `type: 'text'` with the structured report.

**Frontend** renders the text response as formatted markdown inside the panel.

---

### Story 9.9 — Streak Protection Nudge

**No Python involvement.** Pure client-side logic in `CockpitPage.tsx`.

Trigger conditions:
- After 5 PM
- Habit with `current_streak >= 7` and `status !== 'done'` today
- Not dismissed today (check `localStorage` key `dismissed_{habitId}_{todayDate}`)

**UI:**
```
⚡ Gym streak at risk — 12 days. You haven't logged it yet today.
   [Mark done]   [Dismiss]
```

No API call to Python server needed.

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
8. **Python server never writes to DB** — `propose_tasks` and `propose_reschedule` are intercepted in `chat.py` and returned as proposals. The Python server has no INSERT/UPDATE code. All writes happen in the frontend via the Supabase JS client after user confirmation.
9. **Service role key is server-side only** — `SUPABASE_SERVICE_ROLE_KEY` lives only in `ai-server/.env`. Never put it in the React app's env vars. The frontend uses only the user's session JWT via the existing Supabase JS client.
10. **All Python Supabase queries must filter by `user_id`** — since the service role key bypasses RLS, every query in `executor.py` must include `.eq("user_id", user_id)`. This is mandatory. Never query without this filter.
11. **Python API key authentication** — every request to the FastAPI server must include `X-API-Key` matching `SERVER_API_KEY` in `ai-server/.env`. The server returns 401 if the key is missing or wrong. `VITE_AI_SERVER_KEY` in the frontend must match `SERVER_API_KEY` in the server.
12. **AI model selection** — use `gpt-4o-mini` for quick queries (stories 9.4, 9.5, 9.9 N/A). Use `gpt-4o` for goal decomposition and day planning (stories 9.6, 9.7, 9.8). Controlled via `use_smart_model` flag in the request.
13. **Conversation history** — the `AICommandBar` keeps message history in React component state only. Not persisted to Supabase or sent to Python beyond the current session. Resets when the command bar closes.
14. **Python server is local during development** — run it with `uvicorn main:app --reload --port 8000` from `ai-server/`. The frontend points to `http://localhost:8000` via `VITE_AI_SERVER_URL`. For production, deploy the FastAPI server separately (Railway, Fly.io, Render) and update `VITE_AI_SERVER_URL`.

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

| Story | Where | Feature | OpenAI call? | Writes DB? | Confirmation? |
|---|---|---|---|---|---|
| 9.1 | Python | FastAPI server setup, `requirements.txt`, env | — | — | — |
| 9.2 | Python | Tool schemas (`schemas.py`) | — | — | — |
| 9.3 | Python | Agentic loop (`chat.py`) + route (`main.py`) | Yes | No | — |
| 9.3a | Python | System prompt builder | — | — | — |
| 9.3b | Python | Supabase read tool executor | — | No | — |
| 9.3c | Python | FastAPI `/api/chat` route | — | — | — |
| 9.3d | Frontend | `AIConfirmationPanel` component | No | Yes (on confirm) | Yes |
| 9.3e | Frontend | `AICommandBar` — calls Python server | No | No | — |
| 9.4 | Both | Natural language task creation | Python | Frontend | Yes |
| 9.5 | Both | Analytics queries ("% gym done") | Python | No | No |
| 9.6 | Both | Goal task generation + schedule | Python (smart) | Frontend | Yes |
| 9.7 | Both | Day planning ("3 hours today") | Python (smart) | Frontend | Yes |
| 9.8 | Both | Weekly health check panel | Python (smart) | No | No |
| 9.9 | Frontend | Streak protection nudge | No | Via toggle | No |

---

*End of Blueprint — Last updated: 2026-02-26*
