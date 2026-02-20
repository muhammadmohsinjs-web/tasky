# Tasky - Consolidated Product, Architecture, and Roadmap

Last consolidated: February 20, 2026

This document merges current implementation details with product strategy and future execution from:
- `AGENTS.md`
- `PRODUCT_ANALYSIS.md`
- `IMPLEMENTATION_BLUEPRINT.md`
- `GOOGLE_CALENDAR_INTEGRATION_PLAN.md`
- `USER_STORIES.md`
- `PRODUCTION_READINESS_REVIEW.md`
- Current source code under `src/` and `supabase/`

## 1. Product Summary

Tasky is a calendar-first task management app designed for focused execution.

Core product positioning captured across docs:
- Calendar-native planning and execution
- Clear task lifecycle (To Do -> In Progress -> Done)
- Category-based organization with visual signals
- Built-in productivity insights
- Lightweight workflow for individuals and small teams

Suggested positioning in analysis docs:
- "The simplest calendar-first task manager for learners and solopreneurs"
- Focus on clarity, consistency, and low-friction execution

## 2. Current Project Structure

Top-level structure:
- `src/`: React + TypeScript app source
- `src/components/`: UI building blocks and task modules
- `src/pages/`: Route-level pages (`Landing`, `Dashboard`, `Tasks`, `Categories`, `Analytics`, etc.)
- `src/hooks/`: Domain hooks (`useTasks`, `useBacklogTasks`, `useCategories`, `useProfile`, etc.)
- `src/contexts/`: Auth state and provider
- `src/lib/`: Shared logic (Supabase client, recurrence, offline queue, constants, SW registration)
- `src/test/`: Vitest setup/tests
- `public/`: static assets + service worker (`sw.js`)
- `supabase/`: schema + migrations
- `dist/`: build output

Build/runtime stack:
- React 18 + TypeScript + Vite
- React Router
- TanStack Query
- Supabase (Auth, Postgres, Storage, RLS)
- Recharts
- dnd-kit (installed)
- Vitest + Testing Library

## 3. Application Architecture (Implemented)

### 3.1 Frontend composition
- Entry: `src/main.tsx`
- Providers: `BrowserRouter`, `QueryClientProvider`, `AuthProvider`
- Router in `src/App.tsx`:
  - Public: `/`, `/welcome`
  - Protected: `/dashboard`, `/tasks`, `/categories`, `/analytics`

### 3.2 Auth architecture
- `AuthContext` manages session/user and exposes:
  - `authenticated`, `loading`, `user`
  - `signInWithGoogle()` via Supabase OAuth
  - `signOut()`
- Route protection enforced by `ProtectedRoute`

### 3.3 Data + state architecture
- Supabase client from env vars (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- TanStack Query for server-state caching and invalidation
- Query defaults:
  - `staleTime: 30s`
  - `refetchInterval: 60s`
  - `refetchOnWindowFocus: true`

### 3.4 Offline architecture
- IndexedDB queue (`src/lib/offlineQueue.ts`) stores mutations:
  - `insert`, `update`, `delete`, `bulk_update`, `bulk_delete`
- `useOfflineSync` replays queue on reconnect and invalidates task queries
- Service worker (`public/sw.js`) caches app shell + GET responses

### 3.5 Realtime architecture
- `useTasks` and `useBacklogTasks` subscribe to Supabase Realtime `postgres_changes` on `tasks` filtered by `user_id`
- Query invalidation keeps UI synced across tabs/sessions

## 4. Data Model and Business Logic

### 4.1 Core entities
- `Task`
  - Scheduling: `date`, `end_date`, `recurrence`, `source_task_id`
  - Workflow: `status`, `priority`, `sort_order`
  - Metadata: `description`, `notes`, `links`, timestamps
- `Category`
  - Visual taxonomy: `color`, `accent`, `short_label`, `icon`, `sort_order`
- `Profile`
  - User info + streak tracking (`streak` JSON)
- `TaskAttachment`
  - File metadata + user-scoped ownership

### 4.2 Database and RLS
`supabase/schema.sql` and `supabase/migrations/phase2.sql` establish:
- Tables: `tasks`, `categories`, `profiles`, `task_attachments`
- User ownership via `user_id`
- User-scoped RLS policies for read/write/delete
- Triggered profile creation from `auth.users`
- Indexes for date/category/status/user and advanced fields
- Phase 2 schema maturity:
  - `updated_at`
  - `sort_order`
  - `end_date`
  - `recurrence`
  - `source_task_id`
  - profile streak JSONB

### 4.3 Business workflow logic
- Task lifecycle:
  - status transitions through a three-state cycle
- Planning modes:
  - scheduled month tasks
  - backlog tasks (`date = null`)
- Bulk ops:
  - bulk status update
  - bulk reschedule
  - bulk move to backlog
  - bulk delete
- Concurrency safeguard:
  - optimistic update with `updated_at` match check in `useTasks.updateTask`
- Recurrence support:
  - recurrence expansion utilities in `src/lib/recurrence.ts`
- Suggestions logic:
  - overdue/today overload/urgent backlog suggestions via `useSuggestions`
- Attachments:
  - upload to Supabase storage + metadata row creation

## 5. Current Product Features (Implemented)

- Landing page with product messaging and CTA flow
- Google OAuth sign-in via Supabase
- Protected application shell/navigation
- Calendar/List/Backlog task workflow (`CalendarPage`)
- Task CRUD with optimistic UI patterns
- Task status + priority management
- Category CRUD with icon/color taxonomy
- Search and filtering in task views
- Task analytics dashboards (status, category, trend charts)
- Profile-based streak stats on dashboard
- Task attachments upload/delete hooks
- Offline mutation queue and sync replay
- Service worker caching for offline resilience

## 6. SaaS Feature State

### 6.1 Already present (partial SaaS foundation)
- Auth provider integration (Supabase Auth)
- User-scoped data model + RLS policies
- Multi-page product shell + marketing landing page
- Analytics and engagement surfaces (dashboard, insights)
- Initial tests and lint/test scripts

### 6.2 Missing or incomplete for full SaaS launch
Recurring blockers documented in readiness analysis and user stories:
- Full auth surface (email/password, reset, verification, sessions hardening)
- Billing/subscriptions (Stripe + entitlement checks)
- Legal pages (Privacy Policy, Terms)
- CI/CD + observability (Sentry, uptime, analytics instrumentation)
- Higher test coverage across critical flows
- Account settings, export, notification system, compliance workflows

## 7. Product Ideas and Strategic Directions

From product and readiness docs:
- Keep product intentionally simple; avoid becoming a general all-in-one tool
- Lead with calendar-native workflow and built-in analytics
- Lean into learning/solopreneur use cases
- Tiered pricing strategy proposed:
  - Free: limited usage
  - Pro: unlimited + premium sync/insights/features

Future idea pool across docs:
- Email reminders/digests
- Recurring tasks and advanced scheduling
- Keyboard shortcuts + command palette expansion
- Export and account controls
- Team/workspace collaboration
- PWA improvements and mobile depth
- Integrations (Google Calendar, Slack, Zapier)
- AI suggestions and behavioral nudges

## 8. Future Plans (Phased)

Two major roadmap tracks are present.

### 8.1 SaaS launch-readiness track
From `PRODUCT_ANALYSIS.md`, `PRODUCTION_READINESS_REVIEW.md`, and `USER_STORIES.md`:
- P0: auth, multi-tenancy hardening, billing, infrastructure, security, legal
- P1/P2: account mgmt, notifications, onboarding, testing, performance, accessibility
- P3: advanced features, collaboration, integrations

Estimated ranges in docs:
- Beta baseline: ~5 days
- SaaS MVP baseline: ~15-20 days
- Full broader backlog: 7-10 weeks depending on scope

### 8.2 Google sync platform track
From `GOOGLE_CALENDAR_INTEGRATION_PLAN.md`:
- Phase 0: foundation (multi-tenant connection model, canonical schema, token security, jobs)
- Phase 1: OAuth + one-way import
- Phase 2: bidirectional sync MVP + conflicts/tombstones
- Phase 3: reliability/scale (webhook + polling, recurrence edge cases, rate limits)
- Phase 4: monetization/product controls (direction modes, entitlements, admin audit)
- Phase 5: enterprise controls + provider abstraction + migration safety

Critical path for bidirectional GA includes FP-0.1 through FP-3.4 with explicit dependencies and risk register.

## 9. Architecture Vision from Implementation Blueprint

The redesign blueprint defines a mature target architecture:
- Information architecture with clear planning/execution/configuration/reflection routes
- Calendar overflow model (`+N more`) + task drawer patterns
- Multi-day and recurrence projection model
- Accessibility standard (contrast, keyboard, SR labels, target sizes)
- Performance model (constant month-grid nodes, virtualization thresholds)
- Behavioral layer (streaks, overdue nudges, completion reinforcement)
- Mobile strategy (week strip, full-screen drawer, gesture interactions)

Roadmap status in blueprint:
- Phase 1 marked completed
- Phase 2 and 3 define current maturation/optimization backlog

## 10. Key Risks and Constraints

Cross-document high-priority risks:
- Security/compliance drift if auth/billing/legal/testing lag behind feature delivery
- Data consistency risks in sync/conflict scenarios (future Google integration)
- Rate-limit and webhook reliability challenges in external provider integrations
- Scope creep between "simple task app" and enterprise sync platform ambitions

Execution constraints explicitly assumed in planning docs:
- 2-week sprints
- small team model (2 full-stack + part-time QA)
- feature flags for risky sync paths

## 11. Recommended Consolidated Execution Order

1. Stabilize SaaS fundamentals first (auth hardening, billing, legal, CI/CD, monitoring, tests).
2. Complete phase-2/phase-3 app maturity work already outlined in `IMPLEMENTATION_BLUEPRINT.md`.
3. Start Google sync roadmap only after baseline SaaS reliability/security gates are met.
4. Use FP-0/FP-1 ticket set as immediate backlog seed for integration work.

## 12. Quick Reference: What Tasky Is Today

Today, Tasky is a strong calendar-first productivity app with:
- clean React/TS architecture
- user-scoped Supabase backend + RLS
- core task/category/analytics workflows
- offline-first mutation queue + realtime syncing

It is close to a private beta-ready SaaS baseline, but still requires full monetization, legal, observability, and testing hardening for public commercial launch.
