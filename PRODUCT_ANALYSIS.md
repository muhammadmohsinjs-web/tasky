# Tasky — Product & Market Readiness Analysis

> Prepared by: Strategic Product Review
> Date: February 11, 2026
> Scope: SaaS launch readiness for Tasky — a task management calendar app

---

## 1. EXECUTIVE SUMMARY

Tasky is a clean, well-designed personal task management app with a calendar-first UX. The frontend craftsmanship is solid — responsive design, good component architecture, TypeScript throughout, and polished visuals with Recharts analytics.

**However, it is currently a single-user personal tool, not a SaaS product.** The gap between where it is and where it needs to be for a paid SaaS launch is significant but bridgeable. This document lays out exactly what's missing, what's critical, and what can wait.

---

## 2. WHAT YOU HAVE TODAY (Current State)

| Area | Status |
|------|--------|
| Calendar-based task view | Done |
| Task CRUD (create, read, update, delete) | Done |
| Category management with color coding | Done |
| Status cycling (To Do → In Progress → Done) | Done |
| Analytics dashboard with charts | Done |
| Responsive mobile layout | Done |
| Supabase backend (PostgreSQL + RLS) | Done |
| PIN-based auth (single user) | Done |
| Search and filtering | Done |
| List view + Calendar view toggle | Done |

**Verdict:** Strong MVP shell. Good enough for a demo or personal use. Not shippable as SaaS.

---

## 3. CRITICAL ISSUES WITH THE CURRENT MODEL

### Issue #1: Authentication is Not Production-Ready
- **Problem:** PIN stored in a client-side env variable (`VITE_ADMIN_PIN=572000`). Anyone who inspects the browser bundle can extract it. No user accounts, no sessions, no password hashing.
- **Impact:** Dealbreaker. Cannot have multiple users. Cannot charge for access. Zero security.
- **Mitigation:** Implement Supabase Auth (email/password + OAuth). It's free, built-in, and handles sessions, JWTs, and password hashing out of the box.

### Issue #2: No Multi-Tenancy / User Isolation
- **Problem:** There's a single shared database. No `user_id` column on tasks or categories. Every user would see everyone else's data.
- **Impact:** Dealbreaker. A SaaS product requires data isolation per user.
- **Mitigation:** Add `user_id` (UUID FK to `auth.users`) to both `tasks` and `categories` tables. Update RLS policies to filter by `auth.uid()`. Update all queries to scope by authenticated user.

### Issue #3: No Billing / Monetization
- **Problem:** No payment integration. No concept of plans, trials, or subscriptions.
- **Impact:** You can't make money. A SaaS without billing is a free tool.
- **Mitigation:** Integrate Stripe (or LemonSqueezy for simplicity). Start with a simple free tier + paid plan model. You don't need complex pricing at launch.

### Issue #4: No Tests
- **Problem:** Zero test files. No unit tests, no integration tests, no E2E tests.
- **Impact:** High risk of regressions when you start adding features. You'll break things and not know until users complain.
- **Mitigation:** Add Vitest for unit/integration tests. Add Playwright for critical E2E flows (login, create task, delete task). You don't need 100% coverage — cover the happy paths.

### Issue #5: No Error Boundaries or Graceful Failure
- **Problem:** If a component throws, the entire app white-screens. Errors are only logged to console. Users see nothing useful.
- **Impact:** Terrible user experience. Users will churn after the first crash.
- **Mitigation:** Add React Error Boundaries at the page level. Add a global error fallback UI. Surface meaningful error messages to users.

### Issue #6: Supabase Keys Exposed in Frontend
- **Problem:** The Supabase anon key and URL are baked into the client bundle (via `VITE_` prefix). While the anon key is designed to be public, combined with weak RLS policies, this is risky.
- **Impact:** Anyone can call your Supabase API directly. If RLS has gaps, data leaks.
- **Mitigation:** Audit and tighten all RLS policies. Consider adding a thin API layer (Supabase Edge Functions or a lightweight backend) for sensitive operations.

### Issue #7: No CI/CD Pipeline
- **Problem:** No GitHub Actions, no automated deployment, no build validation.
- **Impact:** Manual deploys are error-prone. You'll ship broken builds.
- **Mitigation:** Add a basic GitHub Actions workflow: lint → typecheck → test → build → deploy. Connect to Vercel/Netlify for automatic preview deploys on PRs.

### Issue #8: No Rate Limiting or Abuse Protection
- **Problem:** No rate limiting on any operation. No CAPTCHA. No brute-force protection.
- **Impact:** Bots can spam your database. Bad actors can abuse the system.
- **Mitigation:** Use Supabase's built-in rate limiting. Add CAPTCHA on signup. Implement request throttling on the client side for rapid-fire actions.

---

## 4. BARE MINIMUM FEATURES TO SHIP AS SaaS

These are listed in priority order. Ship all of these before charging users.

### Tier 1: ABSOLUTE MUST-HAVE (No launch without these)

| # | Feature | Why It's Critical | Effort |
|---|---------|-------------------|--------|
| 1 | **Real Authentication** (Supabase Auth — email/password + Google OAuth) | Can't have users without accounts | 2-3 days |
| 2 | **Multi-Tenancy** (`user_id` on all tables + RLS per user) | Users must only see their own data | 1-2 days |
| 3 | **Onboarding Flow** (signup → email verification → first task prompt) | First impression matters. Guide new users to value | 2 days |
| 4 | **Landing Page** (what is Tasky, pricing, CTA to signup) | You need a front door. Nobody signs up for something they don't understand | 2-3 days |
| 5 | **Billing Integration** (Stripe Checkout — free + 1 paid plan) | You need to make money. Keep it simple: Free (50 tasks/month) vs Pro ($5/month unlimited) | 3-4 days |
| 6 | **Error Boundaries + User-facing Error States** | App must not white-screen on errors | 1 day |
| 7 | **Basic E2E Tests** (signup, create task, delete task, upgrade) | Catch regressions before users do | 2 days |
| 8 | **CI/CD Pipeline** (GitHub Actions → Vercel/Netlify) | Automated, reliable deployments | 0.5 day |
| 9 | **Legal Pages** (Privacy Policy, Terms of Service) | Required by law for SaaS. Use a generator, customize it | 0.5 day |
| 10 | **Production Environment Config** (separate staging/prod Supabase projects, env management) | Never develop against production data | 1 day |

**Total Tier 1 Estimate: ~15-20 days of focused work**

### Tier 2: SHOULD-HAVE FOR LAUNCH (Ship within first 2 weeks post-launch)

| # | Feature | Why |
|---|---------|-----|
| 11 | **Email Notifications** (daily digest, task reminders) | Retention driver. Bring users back to the app |
| 12 | **Task Due Dates + Overdue Indicators** | Tasks without deadlines don't create urgency |
| 13 | **Recurring Tasks** (daily, weekly, monthly) | Most task apps have this. Users will ask for it immediately |
| 14 | **Keyboard Shortcuts** (n = new task, / = search, esc = close) | Power users expect this. Differentiator |
| 15 | **Data Export** (CSV/JSON download of all tasks) | Users won't trust a SaaS they can't export from |
| 16 | **Account Settings** (change password, delete account, manage subscription) | Legal requirement (GDPR right to deletion) + basic expectation |
| 17 | **Proper Loading States & Skeleton UI** | Polish. Don't show blank screens while data loads |

### Tier 3: NICE-TO-HAVE (Post-launch, based on user feedback)

| # | Feature | Why |
|---|---------|-----|
| 18 | Google Calendar sync | Integration story |
| 19 | Team/workspace support | Expansion to B2B |
| 20 | Mobile PWA (offline + install) | Mobile-native feel without an app store |
| 21 | AI task suggestions | Trend feature, good for marketing |
| 22 | Drag-and-drop task reordering | UX polish |
| 23 | Dark mode | Frequently requested, easy win |
| 24 | Webhooks / Zapier integration | Automation-minded users |
| 25 | Public API | Developer users, platform play |

---

## 5. COMPETITIVE LANDSCAPE & POSITIONING

You're entering a crowded space (Todoist, TickTick, Notion, Google Tasks, Any.do). Here's how to compete:

**Don't try to be Notion.** Notion is everything for everyone. You'll lose.

**Position Tasky as:** "The simplest calendar-first task manager for learners and solopreneurs."

**Your differentiators should be:**
1. **Calendar-native** — Tasks live on dates, not in lists. Visual planning.
2. **Built-in analytics** — Show users their productivity trends. Most task apps don't do this well.
3. **Dead simple** — No projects, no workspaces, no nested subtasks. Just tasks on a calendar.
4. **Learning-focused** — Categories like "Backend", "AI", "Cloud" suggest a learning/upskilling use case. Lean into this.

**Suggested tagline:** "Plan what you learn. Track what you ship."

---

## 6. PRICING STRATEGY RECOMMENDATION

| Plan | Price | Limits |
|------|-------|--------|
| **Free** | $0 | 50 tasks/month, 3 categories, 30-day analytics |
| **Pro** | $5/month or $48/year | Unlimited tasks, unlimited categories, full analytics, data export, email reminders |

**Why this works:**
- Free tier gets users in the door and builds habit
- Low price point ($5) reduces friction for conversion
- Annual discount incentivizes commitment
- Simple 2-tier model — no decision paralysis

**Don't build an Enterprise tier yet.** Wait for demand signals.

---

## 7. LAUNCH CHECKLIST (In Order)

```
Week 1-2:
  [ ] Implement Supabase Auth (email + Google OAuth)
  [ ] Add user_id to tasks and categories tables
  [ ] Update all RLS policies for multi-tenancy
  [ ] Update all hooks/queries to scope by user
  [ ] Add React Error Boundaries
  [ ] Set up CI/CD (GitHub Actions + Vercel)

Week 3:
  [ ] Build landing page (hero, features, pricing, CTA)
  [ ] Integrate Stripe (free + pro plan)
  [ ] Add onboarding flow for new users
  [ ] Create legal pages (Privacy Policy, ToS)
  [ ] Set up separate staging + production environments

Week 4:
  [ ] Write E2E tests for critical flows
  [ ] Add loading skeletons and empty states
  [ ] User acceptance testing
  [ ] Performance audit (Lighthouse score > 90)
  [ ] Security audit (tighten RLS, validate inputs)

Week 5:
  [ ] Soft launch (Product Hunt, Twitter/X, Reddit)
  [ ] Set up analytics (Mixpanel or PostHog — free tier)
  [ ] Set up error monitoring (Sentry — free tier)
  [ ] Collect feedback, iterate
```

---

## 8. METRICS TO TRACK FROM DAY 1

| Metric | Why |
|--------|-----|
| **Signups** | Are people interested? |
| **Activation rate** (% who create first task within 24h) | Is onboarding working? |
| **DAU / WAU ratio** | Are users coming back? |
| **Free → Pro conversion rate** | Is the product worth paying for? |
| **Churn rate** (monthly) | Are you keeping users? |
| **Tasks created per user per week** | Core engagement metric |

---

## 9. FINAL VERDICT

**Current state:** 6/10 as a personal project. 2/10 as a SaaS product.

**After Tier 1 features:** 7/10 — Shippable MVP. Good enough to get first paying users and validate the market.

**Key insight:** You've done the hard part — building a functional, good-looking app. The remaining work is mostly infrastructure (auth, billing, multi-tenancy) and go-to-market (landing page, positioning). Don't over-build. Ship lean, learn from users, iterate fast.

**The biggest risk isn't missing features — it's waiting too long to ship.**

---

*"If you're not embarrassed by the first version of your product, you've launched too late." — Reid Hoffman*
