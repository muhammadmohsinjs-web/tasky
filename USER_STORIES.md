# TASKY - COMPREHENSIVE USER STORIES
## Production-Ready SaaS Feature Backlog

**Project:** Tasky - Calendar-First Task Management
**Last Updated:** February 13, 2026
**Status:** Pre-Production (MVP Complete, SaaS Features Pending)

---

## TABLE OF CONTENTS

1. [Epic 1: Authentication & User Management](#epic-1-authentication--user-management)
2. [Epic 2: Multi-Tenancy & Data Isolation](#epic-2-multi-tenancy--data-isolation)
3. [Epic 3: Billing & Subscriptions](#epic-3-billing--subscriptions)
4. [Epic 4: Account Management](#epic-4-account-management)
5. [Epic 5: Email Notifications](#epic-5-email-notifications)
6. [Epic 6: Onboarding Experience](#epic-6-onboarding-experience)
7. [Epic 7: Testing & Quality](#epic-7-testing--quality)
8. [Epic 8: Infrastructure & DevOps](#epic-8-infrastructure--devops)
9. [Epic 9: Security Hardening](#epic-9-security-hardening)
10. [Epic 10: Performance Optimization](#epic-10-performance-optimization)
11. [Epic 11: Accessibility](#epic-11-accessibility)
12. [Epic 12: Advanced Task Features](#epic-12-advanced-task-features)
13. [Epic 13: Collaboration Features](#epic-13-collaboration-features)
14. [Epic 14: Mobile Experience](#epic-14-mobile-experience)
15. [Epic 15: Analytics & Insights](#epic-15-analytics--insights)
16. [Epic 16: Integrations](#epic-16-integrations)
17. [Epic 17: Legal & Compliance](#epic-17-legal--compliance)

---

## EPIC 1: Authentication & User Management

**Goal:** Replace PIN-based auth with secure, scalable Supabase Auth
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 2-3 days

### US-1.1: Email/Password Signup
**As a** new user
**I want to** sign up with email and password
**So that** I can securely create an account

**Acceptance Criteria:**
- [ ] User can access signup page from landing page
- [ ] Email validation (valid format, not already registered)
- [ ] Password requirements enforced (min 8 chars, 1 uppercase, 1 number)
- [ ] Password strength indicator shown
- [ ] Confirm password field matches
- [ ] Signup submits to Supabase Auth
- [ ] Verification email sent automatically
- [ ] User redirected to email verification page
- [ ] Error messages clear and actionable
- [ ] Loading state shown during signup

**Priority:** High
**Technical Notes:**
- Use Supabase Auth `signUp()` method
- Configure email templates in Supabase dashboard
- Add validation with Zod or Yup
- Store user metadata (name, timezone) in `auth.users` metadata

---

### US-1.2: Email/Password Login
**As a** registered user
**I want to** log in with email and password
**So that** I can access my tasks

**Acceptance Criteria:**
- [ ] User can access login page from landing page
- [ ] Email and password fields validate on blur
- [ ] "Forgot password?" link visible
- [ ] "Remember me" checkbox persists session
- [ ] Login submits to Supabase Auth
- [ ] Successful login redirects to dashboard
- [ ] Failed login shows clear error (invalid credentials)
- [ ] Account not verified shows specific error
- [ ] Loading state shown during login
- [ ] Session stored in localStorage/sessionStorage

**Priority:** High
**Technical Notes:**
- Use Supabase Auth `signInWithPassword()`
- Handle `AuthApiError` gracefully
- Implement "Remember me" with session persistence
- Redirect to previous page after login (if applicable)

---

### US-1.3: Google OAuth Login
**As a** user
**I want to** log in with Google
**So that** I can skip password management

**Acceptance Criteria:**
- [ ] "Continue with Google" button on login page
- [ ] Clicking opens Google OAuth popup
- [ ] User consents to Google permissions
- [ ] Successful OAuth redirects to dashboard
- [ ] New Google users auto-created in Supabase
- [ ] Existing Google users matched by email
- [ ] Profile picture from Google stored
- [ ] OAuth failure shows error message

**Priority:** High
**Technical Notes:**
- Configure Google OAuth in Supabase dashboard
- Use `signInWithOAuth({ provider: 'google' })`
- Store avatar URL in user metadata
- Handle OAuth redirect URL in Vercel config

---

### US-1.4: GitHub OAuth Login
**As a** developer user
**I want to** log in with GitHub
**So that** I can authenticate with my developer identity

**Acceptance Criteria:**
- [ ] "Continue with GitHub" button on login page
- [ ] Clicking opens GitHub OAuth popup
- [ ] User consents to GitHub permissions
- [ ] Successful OAuth redirects to dashboard
- [ ] New GitHub users auto-created in Supabase
- [ ] Existing GitHub users matched by email
- [ ] GitHub username stored in metadata
- [ ] OAuth failure shows error message

**Priority:** Medium
**Technical Notes:**
- Configure GitHub OAuth in Supabase dashboard
- Use `signInWithOAuth({ provider: 'github' })`
- Store GitHub username for display

---

### US-1.5: Password Reset Flow
**As a** user who forgot my password
**I want to** reset my password via email
**So that** I can regain access to my account

**Acceptance Criteria:**
- [ ] "Forgot password?" link on login page
- [ ] User enters email address
- [ ] Email validation before submit
- [ ] Reset email sent with magic link
- [ ] Confirmation shown after email sent
- [ ] Magic link redirects to reset password page
- [ ] New password form validates requirements
- [ ] Password reset updates Supabase Auth
- [ ] Success message shown after reset
- [ ] User redirected to login page
- [ ] Expired/invalid links show error

**Priority:** High
**Technical Notes:**
- Use Supabase `resetPasswordForEmail()`
- Configure password reset email template
- Implement `verifyOtp()` for magic link
- Add password strength indicator

---

### US-1.6: Email Verification
**As a** new user
**I want to** verify my email
**So that** my account is activated

**Acceptance Criteria:**
- [ ] Verification email sent on signup
- [ ] Email contains verification link
- [ ] Clicking link verifies email in Supabase
- [ ] Verified users redirected to onboarding
- [ ] Unverified users cannot access app
- [ ] "Resend verification email" button available
- [ ] Verification status shown on login

**Priority:** High
**Technical Notes:**
- Check `user.email_confirmed_at` before allowing access
- Use Supabase email templates
- Add verification check in ProtectedRoute

---

### US-1.7: Session Management
**As a** logged-in user
**I want to** stay logged in for 7 days
**So that** I don't have to re-authenticate frequently

**Acceptance Criteria:**
- [ ] Session persists in localStorage (default)
- [ ] Session refreshes automatically before expiry
- [ ] Session expires after 7 days of inactivity
- [ ] Expired session redirects to login
- [ ] "Remember me" extends to 30 days
- [ ] User can log out manually
- [ ] Logout clears session from storage

**Priority:** Medium
**Technical Notes:**
- Supabase handles session refresh automatically
- Configure `persistSession: true`
- Add session expiry check in AuthContext
- Clear session on logout with `signOut()`

---

### US-1.8: Logout
**As a** logged-in user
**I want to** log out of my account
**So that** I can secure my account on shared devices

**Acceptance Criteria:**
- [ ] "Logout" button in sidebar menu
- [ ] Clicking logout clears session
- [ ] User redirected to landing page
- [ ] All local state cleared (tasks, categories)
- [ ] Logout works even if network offline (local only)
- [ ] Confirmation modal (optional, can skip)

**Priority:** High
**Technical Notes:**
- Use Supabase `signOut()`
- Clear all app state (useAuth, useTasks, etc.)
- Redirect with `navigate('/')`

---

## EPIC 2: Multi-Tenancy & Data Isolation

**Goal:** Ensure each user only sees their own data
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 1-2 days

### US-2.1: Add User ID to Tasks
**As a** system
**I want to** associate every task with a user ID
**So that** tasks are isolated per user

**Acceptance Criteria:**
- [ ] Migration adds `user_id` column to tasks table
- [ ] `user_id` is NOT NULL, references auth.users(id)
- [ ] `user_id` defaults to current authenticated user
- [ ] ON DELETE CASCADE on user deletion
- [ ] Existing data migrated (if any test data)
- [ ] Index on `user_id` for performance

**Priority:** High
**Technical Notes:**
```sql
ALTER TABLE tasks ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
CREATE INDEX idx_tasks_user ON tasks(user_id);
```
- Update all queries to filter by `auth.uid()`

---

### US-2.2: Add User ID to Categories
**As a** system
**I want to** associate every category with a user ID
**So that** categories are isolated per user

**Acceptance Criteria:**
- [ ] Migration adds `user_id` column to categories table
- [ ] `user_id` is NOT NULL, references auth.users(id)
- [ ] `user_id` defaults to current authenticated user
- [ ] ON DELETE CASCADE on user deletion
- [ ] Existing data migrated (default categories duplicated per user)
- [ ] Index on `user_id` for performance

**Priority:** High
**Technical Notes:**
```sql
ALTER TABLE categories ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
CREATE INDEX idx_categories_user ON categories(user_id);
```
- Pre-seed default categories per user on signup

---

### US-2.3: Add User ID to Attachments
**As a** system
**I want to** associate every attachment with a user ID
**So that** attachments are isolated per user

**Acceptance Criteria:**
- [ ] Migration adds `user_id` column to task_attachments table
- [ ] `user_id` is NOT NULL, references auth.users(id)
- [ ] `user_id` defaults to current authenticated user
- [ ] ON DELETE CASCADE on user deletion
- [ ] Index on `user_id` for performance

**Priority:** High
**Technical Notes:**
```sql
ALTER TABLE task_attachments ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL;
CREATE INDEX idx_attachments_user ON task_attachments(user_id);
```

---

### US-2.4: Update RLS Policies for Tasks
**As a** system
**I want to** enforce user isolation at the database level
**So that** users cannot access other users' tasks

**Acceptance Criteria:**
- [ ] RLS policy for SELECT: `user_id = auth.uid()`
- [ ] RLS policy for INSERT: `user_id = auth.uid()`
- [ ] RLS policy for UPDATE: `user_id = auth.uid()`
- [ ] RLS policy for DELETE: `user_id = auth.uid()`
- [ ] Test: User A cannot see User B's tasks
- [ ] Test: User A cannot edit User B's tasks
- [ ] Test: User A cannot delete User B's tasks

**Priority:** High
**Technical Notes:**
```sql
DROP POLICY "Authenticated users can read tasks" ON tasks;
CREATE POLICY "Users can read own tasks" ON tasks FOR SELECT TO authenticated USING (user_id = auth.uid());
-- Repeat for INSERT, UPDATE, DELETE
```

---

### US-2.5: Update RLS Policies for Categories
**As a** system
**I want to** enforce user isolation for categories
**So that** users cannot access other users' categories

**Acceptance Criteria:**
- [ ] RLS policy for SELECT: `user_id = auth.uid()`
- [ ] RLS policy for INSERT: `user_id = auth.uid()`
- [ ] RLS policy for UPDATE: `user_id = auth.uid()`
- [ ] RLS policy for DELETE: `user_id = auth.uid()`
- [ ] Test: User A cannot see User B's categories

**Priority:** High
**Technical Notes:**
- Same pattern as tasks RLS policies

---

### US-2.6: Update RLS Policies for Attachments
**As a** system
**I want to** enforce user isolation for attachments
**So that** file access is restricted to file owner

**Acceptance Criteria:**
- [ ] RLS policy for SELECT: `user_id = auth.uid()`
- [ ] RLS policy for INSERT: `user_id = auth.uid()`
- [ ] RLS policy for DELETE: `user_id = auth.uid()`
- [ ] Storage bucket uses RLS
- [ ] Test: User A cannot access User B's files

**Priority:** High
**Technical Notes:**
- Update storage bucket policies
- Use signed URLs instead of public URLs
- Set expiration on signed URLs (1 hour)

---

### US-2.7: Test User Isolation
**As a** QA engineer
**I want to** verify multi-tenancy works
**So that** users' data is secure

**Acceptance Criteria:**
- [ ] Create User A, add 5 tasks
- [ ] Create User B, add 3 tasks
- [ ] User A dashboard shows 5 tasks (not 8)
- [ ] User B dashboard shows 3 tasks (not 8)
- [ ] User A cannot query User B's tasks via direct API call
- [ ] User A cannot upload to User B's storage path
- [ ] Test repeated for categories and attachments

**Priority:** High
**Technical Notes:**
- Use Playwright for E2E tests
- Test with different users in different browsers

---

## EPIC 3: Billing & Subscriptions

**Goal:** Monetize Tasky with Stripe subscriptions
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 3-4 days

### US-3.1: Stripe Account Setup
**As a** business owner
**I want to** configure Stripe
**So that** I can accept payments

**Acceptance Criteria:**
- [ ] Stripe account created (or use existing)
- [ ] Test mode vs. production mode configured
- [ ] Webhook endpoint configured
- [ ] Stripe publishable key added to env vars
- [ ] Stripe secret key added to env vars
- [ ] Tax settings configured (if applicable)

**Priority:** High
**Technical Notes:**
- Use Stripe test mode for staging
- Store keys in Vercel env vars (not in code)
- Configure webhook URL: `https://tasky.app/api/webhooks/stripe`

---

### US-3.2: Create Subscription Products
**As a** business owner
**I want to** define pricing tiers
**So that** users can choose plans

**Acceptance Criteria:**
- [ ] Free plan: $0/mo, max 50 tasks
- [ ] Pro plan: $5/mo, unlimited tasks
- [ ] Products created in Stripe dashboard
- [ ] Price IDs stored in app config
- [ ] Plan features documented

**Priority:** High
**Technical Notes:**
- Create products in Stripe dashboard
- Store price IDs as env vars or constants:
  ```ts
  const STRIPE_PRICE_PRO = 'price_1234567890'
  ```

---

### US-3.3: Subscription Checkout Flow
**As a** free user
**I want to** upgrade to Pro
**So that** I can unlock unlimited tasks

**Acceptance Criteria:**
- [ ] "Upgrade to Pro" button visible in sidebar
- [ ] Clicking opens Stripe Checkout
- [ ] Checkout shows Pro plan ($5/mo)
- [ ] User can enter payment method
- [ ] Successful payment returns to app
- [ ] User's subscription status updated to "Pro"
- [ ] Failed payment shows error message
- [ ] User can cancel during checkout

**Priority:** High
**Technical Notes:**
- Use Stripe Checkout (hosted, not custom)
- Redirect URL: `/subscription/success`
- Cancel URL: `/subscription/cancel`
- Pass `customer_email` and `client_reference_id` (user_id)

---

### US-3.4: Webhook Handler for Subscription Events
**As a** system
**I want to** handle Stripe webhook events
**So that** subscription status stays in sync

**Acceptance Criteria:**
- [ ] Webhook endpoint created: `/api/webhooks/stripe`
- [ ] Endpoint verifies Stripe signature
- [ ] Handles `checkout.session.completed` event
- [ ] Handles `customer.subscription.updated` event
- [ ] Handles `customer.subscription.deleted` event
- [ ] Handles `invoice.payment_failed` event
- [ ] Updates user's subscription status in database
- [ ] Logs all webhook events for debugging

**Priority:** High
**Technical Notes:**
- Use Stripe SDK `constructEvent()` to verify signature
- Store webhook secret in env vars
- Update `users` table with subscription status:
  ```sql
  ALTER TABLE auth.users ADD COLUMN subscription_status text DEFAULT 'free';
  ALTER TABLE auth.users ADD COLUMN stripe_customer_id text;
  ```

---

### US-3.5: Subscription Management Page
**As a** Pro user
**I want to** manage my subscription
**So that** I can update payment method or cancel

**Acceptance Criteria:**
- [ ] "Manage Subscription" page accessible from settings
- [ ] Shows current plan (Free or Pro)
- [ ] Shows next billing date (if Pro)
- [ ] Shows payment method (last 4 digits)
- [ ] "Update payment method" button opens Stripe portal
- [ ] "Cancel subscription" button opens confirmation
- [ ] Cancel updates subscription to cancel at period end
- [ ] Cancellation confirmation email sent

**Priority:** High
**Technical Notes:**
- Use Stripe Customer Portal for payment method updates
- Redirect to: `https://billing.stripe.com/p/session/...`
- Handle cancellation with `subscriptions.update({ cancel_at_period_end: true })`

---

### US-3.6: Enforce Usage Limits (Free Tier)
**As a** system
**I want to** restrict free users to 50 tasks
**So that** they upgrade to Pro

**Acceptance Criteria:**
- [ ] Free users can create up to 50 tasks
- [ ] Attempting to create 51st task shows error
- [ ] Error message includes "Upgrade to Pro" CTA
- [ ] Pro users have no task limit
- [ ] Usage shown in UI (e.g., "45/50 tasks")

**Priority:** High
**Technical Notes:**
- Add check in `useTasks.addTask()`:
  ```ts
  const taskCount = await supabase.from('tasks').select('id', { count: 'exact' })
  if (subscription === 'free' && taskCount >= 50) {
    toast.error('Upgrade to Pro for unlimited tasks')
    return
  }
  ```

---

### US-3.7: Invoice Generation
**As a** Pro user
**I want to** receive invoices
**So that** I can track my payments

**Acceptance Criteria:**
- [ ] Stripe auto-generates invoices
- [ ] Invoices emailed to user
- [ ] Invoices downloadable from Stripe portal
- [ ] Invoice includes company details (if provided)

**Priority:** Medium
**Technical Notes:**
- Stripe handles invoice generation automatically
- Configure email templates in Stripe dashboard

---

### US-3.8: Failed Payment Handling
**As a** system
**I want to** handle failed payments gracefully
**So that** users know to update payment method

**Acceptance Criteria:**
- [ ] Failed payment email sent by Stripe
- [ ] User's subscription status set to "past_due"
- [ ] Grace period: 3 days before downgrade to free
- [ ] In-app banner shown: "Payment failed, update method"
- [ ] After 3 days, subscription canceled

**Priority:** High
**Technical Notes:**
- Stripe retries failed payments automatically
- Configure retry settings in Stripe dashboard
- Handle `invoice.payment_failed` webhook

---

## EPIC 4: Account Management

**Goal:** Allow users to manage their account settings
**Priority:** 🟠 P1 (CRITICAL)
**Estimated Effort:** 1-2 days

### US-4.1: Account Settings Page
**As a** user
**I want to** access account settings
**So that** I can update my profile

**Acceptance Criteria:**
- [ ] "Settings" link in sidebar menu
- [ ] Settings page loads at `/settings`
- [ ] Page shows user's current info (name, email, avatar)
- [ ] Tabs: Profile, Security, Preferences, Billing, Danger Zone
- [ ] UI is responsive (mobile-friendly)

**Priority:** High
**Technical Notes:**
- Create new page: `src/pages/Settings.tsx`
- Use tab navigation (Radix UI tabs or custom)

---

### US-4.2: Edit Profile
**As a** user
**I want to** edit my name and avatar
**So that** my profile is personalized

**Acceptance Criteria:**
- [ ] Name field editable
- [ ] Avatar upload button (or URL input)
- [ ] Uploaded avatar shows preview
- [ ] "Save changes" button updates Supabase Auth
- [ ] Success toast on save
- [ ] Updated name shown in sidebar

**Priority:** Medium
**Technical Notes:**
- Update user metadata:
  ```ts
  await supabase.auth.updateUser({
    data: { full_name: name, avatar_url: avatarUrl }
  })
  ```

---

### US-4.3: Change Email
**As a** user
**I want to** change my email address
**So that** I can use a different email

**Acceptance Criteria:**
- [ ] "Change email" button in Security tab
- [ ] User enters new email
- [ ] Verification email sent to new email
- [ ] User clicks verification link
- [ ] Email updated in Supabase Auth
- [ ] Old email receives "Email changed" notification

**Priority:** Low
**Technical Notes:**
- Use Supabase `updateUser({ email: newEmail })`
- Requires email verification before change

---

### US-4.4: Change Password
**As a** user
**I want to** change my password
**So that** I can keep my account secure

**Acceptance Criteria:**
- [ ] "Change password" form in Security tab
- [ ] Current password required
- [ ] New password validates requirements
- [ ] Confirm new password matches
- [ ] Password updated in Supabase Auth
- [ ] Success toast shown
- [ ] All sessions logged out (optional)

**Priority:** Medium
**Technical Notes:**
- Use Supabase `updateUser({ password: newPassword })`
- No current password check in Supabase (security trade-off)

---

### US-4.5: Email Preferences
**As a** user
**I want to** manage email notifications
**So that** I control how often I receive emails

**Acceptance Criteria:**
- [ ] Checkboxes for email types:
  - Daily digest
  - Task reminders
  - Marketing emails
- [ ] Preferences saved to database
- [ ] Unsubscribe link in all emails
- [ ] Clicking unsubscribe disables all emails

**Priority:** Medium
**Technical Notes:**
- Store preferences in `users` table:
  ```sql
  ALTER TABLE auth.users ADD COLUMN email_preferences jsonb DEFAULT '{"digest": true, "reminders": true, "marketing": false}';
  ```

---

### US-4.6: Timezone Selection
**As a** user in a different timezone
**I want to** set my timezone
**So that** task dates display correctly

**Acceptance Criteria:**
- [ ] Timezone dropdown in Preferences tab
- [ ] Auto-detect timezone on first login
- [ ] Timezone saved to user metadata
- [ ] All dates displayed in user's timezone

**Priority:** Low
**Technical Notes:**
- Use `Intl.DateTimeFormat().resolvedOptions().timeZone`
- Store in user metadata

---

### US-4.7: Data Export (GDPR)
**As a** user
**I want to** export my data
**So that** I can back it up or move to another service

**Acceptance Criteria:**
- [ ] "Export data" button in Danger Zone tab
- [ ] Clicking generates JSON file
- [ ] JSON includes all tasks, categories, settings
- [ ] File downloads automatically
- [ ] Export format documented

**Priority:** High (GDPR requirement)
**Technical Notes:**
- Query all user data and return as JSON
- Use `downloadjs` library for file download

---

### US-4.8: Delete Account
**As a** user
**I want to** delete my account
**So that** my data is removed

**Acceptance Criteria:**
- [ ] "Delete account" button in Danger Zone tab
- [ ] Confirmation modal requires typing "DELETE"
- [ ] Deleting removes all tasks, categories, attachments
- [ ] Deleting cancels subscription (if any)
- [ ] User logged out after deletion
- [ ] Email confirmation sent after deletion

**Priority:** High (GDPR requirement)
**Technical Notes:**
- Use ON DELETE CASCADE to auto-delete related data
- Cancel Stripe subscription before deleting user

---

## EPIC 5: Email Notifications

**Goal:** Send transactional and optional digest emails
**Priority:** 🟠 P1 (CRITICAL)
**Estimated Effort:** 1-2 days

### US-5.1: Welcome Email
**As a** new user
**I want to** receive a welcome email
**So that** I know my signup succeeded

**Acceptance Criteria:**
- [ ] Email sent immediately after signup
- [ ] Email includes verification link
- [ ] Email welcomes user by name
- [ ] Email includes CTA to start using app
- [ ] Email is well-designed (HTML template)

**Priority:** High
**Technical Notes:**
- Use Resend or SendGrid for email sending
- Trigger on `user.created` Supabase trigger or webhook

---

### US-5.2: Password Reset Email
**As a** user who forgot password
**I want to** receive a reset email
**So that** I can regain access

**Acceptance Criteria:**
- [ ] Email sent when user requests reset
- [ ] Email includes magic link
- [ ] Link expires after 1 hour
- [ ] Email is clear and actionable

**Priority:** High
**Technical Notes:**
- Handled by Supabase Auth automatically
- Customize template in Supabase dashboard

---

### US-5.3: Daily Task Digest Email (Optional)
**As a** user
**I want to** receive a daily summary of my tasks
**So that** I stay on top of my work

**Acceptance Criteria:**
- [ ] Email sent at 8 AM user's timezone
- [ ] Lists tasks due today
- [ ] Lists overdue tasks (if any)
- [ ] Includes CTA to view calendar
- [ ] User can disable in email preferences

**Priority:** Low
**Technical Notes:**
- Use cron job (Vercel Cron or Supabase Edge Functions)
- Query tasks where `date = today` and `status != done`
- Respect email preferences

---

### US-5.4: Overdue Task Reminder (Optional)
**As a** user with overdue tasks
**I want to** be reminded
**So that** I don't forget important tasks

**Acceptance Criteria:**
- [ ] Email sent for tasks overdue by 1+ days
- [ ] Email lists overdue tasks
- [ ] Sent daily until task completed
- [ ] User can snooze reminder (optional)
- [ ] User can disable in email preferences

**Priority:** Low
**Technical Notes:**
- Query tasks where `date < today` and `status != done`
- Send at most once per day

---

### US-5.5: Subscription Confirmation Email
**As a** user who subscribed to Pro
**I want to** receive a confirmation email
**So that** I know payment succeeded

**Acceptance Criteria:**
- [ ] Email sent after successful Stripe payment
- [ ] Email includes plan details (Pro, $5/mo)
- [ ] Email includes billing date
- [ ] Email includes link to manage subscription

**Priority:** Medium
**Technical Notes:**
- Trigger on `checkout.session.completed` webhook
- Use Stripe's email or send custom email

---

### US-5.6: Payment Failed Email
**As a** Pro user with failed payment
**I want to** be notified
**So that** I can update my payment method

**Acceptance Criteria:**
- [ ] Email sent when payment fails
- [ ] Email explains the issue
- [ ] Email includes CTA to update payment method
- [ ] Email warns of grace period (3 days)

**Priority:** High
**Technical Notes:**
- Trigger on `invoice.payment_failed` webhook
- Send via Resend or use Stripe's email

---

## EPIC 6: Onboarding Experience

**Goal:** Guide new users to first task creation
**Priority:** 🟡 P2 (HIGH)
**Estimated Effort:** 1 day

### US-6.1: Onboarding Wizard
**As a** new user
**I want to** be guided through setup
**So that** I understand how to use Tasky

**Acceptance Criteria:**
- [ ] Wizard appears on first login
- [ ] Step 1: Welcome message
- [ ] Step 2: Pre-seed default categories (or let user choose)
- [ ] Step 3: Create first task (guided)
- [ ] Step 4: Tour of calendar view
- [ ] Step 5: CTA to explore dashboard
- [ ] "Skip tour" button available

**Priority:** Medium
**Technical Notes:**
- Use `localStorage` to track if onboarding completed
- Consider using Intro.js or custom wizard

---

### US-6.2: Pre-Seeded Categories
**As a** new user
**I want to** start with default categories
**So that** I don't have to create them manually

**Acceptance Criteria:**
- [ ] On first login, 3 default categories auto-created:
  - Backend (blue)
  - Frontend (amber)
  - Design (violet)
- [ ] User can edit or delete defaults
- [ ] Seeding happens only once per user

**Priority:** Medium
**Technical Notes:**
- Trigger on user signup (Supabase trigger or app logic)
- Insert into `categories` table with `user_id`

---

### US-6.3: Sample Tasks for Demo
**As a** new user
**I want to** see sample tasks
**So that** I understand the app's value

**Acceptance Criteria:**
- [ ] On first login, 3 sample tasks auto-created:
  - "Welcome to Tasky!" (today, Backend)
  - "Explore the calendar view" (tomorrow, Frontend)
  - "Try the backlog feature" (backlog, Design)
- [ ] Sample tasks clearly marked (e.g., "[Demo]" prefix)
- [ ] User can delete sample tasks

**Priority:** Low
**Technical Notes:**
- Insert into `tasks` table with `user_id`
- Add checkbox in onboarding: "Include sample tasks"

---

### US-6.4: Product Tour Tooltips
**As a** new user
**I want to** see tooltips explaining features
**So that** I learn as I explore

**Acceptance Criteria:**
- [ ] Tooltip on calendar: "Click a day to add tasks"
- [ ] Tooltip on task status: "Click to change status"
- [ ] Tooltip on bulk actions: "Select multiple tasks for bulk operations"
- [ ] Tooltips dismiss on click or after 5 seconds
- [ ] "Show tooltips again" option in settings

**Priority:** Low
**Technical Notes:**
- Use Radix UI Tooltip or custom implementation
- Store tooltip state in localStorage

---

## EPIC 7: Testing & Quality

**Goal:** Increase test coverage to >80%
**Priority:** 🟠 P1 (CRITICAL)
**Estimated Effort:** 3-5 days

### US-7.1: Unit Tests for Hooks
**As a** developer
**I want to** test custom hooks
**So that** I catch bugs early

**Acceptance Criteria:**
- [ ] `useTasks` hook fully tested (add, update, delete, bulk ops)
- [ ] `useBacklogTasks` hook fully tested
- [ ] `useCategories` hook fully tested
- [ ] `useTaskAttachments` hook fully tested
- [ ] `useAuth` hook fully tested
- [ ] All tests pass in CI
- [ ] Coverage >80% for hooks

**Priority:** High
**Technical Notes:**
- Use `@testing-library/react-hooks`
- Mock Supabase client with `vi.mock()`

---

### US-7.2: E2E Tests for Critical Flows
**As a** QA engineer
**I want to** test full user journeys
**So that** I catch integration bugs

**Acceptance Criteria:**
- [ ] E2E test: Signup → Verify email → Create task
- [ ] E2E test: Login → Navigate to Tasks → Filter by category
- [ ] E2E test: Bulk select tasks → Mark as done
- [ ] E2E test: Subscribe to Pro → Verify unlimited tasks
- [ ] E2E test: Delete account → Verify data removed
- [ ] All E2E tests run in CI

**Priority:** High
**Technical Notes:**
- Use Playwright or Cypress
- Run against staging environment
- Use test user accounts

---

### US-7.3: Component Tests
**As a** developer
**I want to** test complex components
**So that** UI bugs are caught

**Acceptance Criteria:**
- [ ] `Calendar` component fully tested
- [ ] `TaskList` component fully tested
- [ ] `TaskDetailPanel` component fully tested
- [ ] `BulkAddModal` component fully tested
- [ ] Tests verify user interactions (click, type, select)
- [ ] Coverage >70% for components

**Priority:** Medium
**Technical Notes:**
- Use `@testing-library/react`
- Test user interactions, not implementation details

---

### US-7.4: Coverage Reporting
**As a** developer
**I want to** see test coverage reports
**So that** I know which code is untested

**Acceptance Criteria:**
- [ ] Coverage report generated on test run
- [ ] Coverage uploaded to Codecov or Coveralls
- [ ] Coverage badge added to README
- [ ] CI fails if coverage drops below 80%

**Priority:** Medium
**Technical Notes:**
- Use `vitest --coverage`
- Upload to Codecov via GitHub Action

---

## EPIC 8: Infrastructure & DevOps

**Goal:** Automate deployments and monitoring
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 1 day

### US-8.1: CI/CD Pipeline with GitHub Actions
**As a** developer
**I want to** automate deployments
**So that** I can ship faster

**Acceptance Criteria:**
- [ ] GitHub Actions workflow created (`.github/workflows/ci.yml`)
- [ ] Workflow runs on every PR
- [ ] Workflow runs tests (unit + E2E)
- [ ] Workflow checks linting (ESLint)
- [ ] Workflow checks TypeScript errors
- [ ] Workflow deploys to staging on merge to `develop`
- [ ] Workflow deploys to production on merge to `main`
- [ ] Failed workflows block merge

**Priority:** High
**Technical Notes:**
```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test:run
      - run: npm run build
```

---

### US-8.2: Staging Environment
**As a** QA engineer
**I want to** test in staging before production
**So that** bugs don't reach users

**Acceptance Criteria:**
- [ ] Staging environment created (e.g., `staging.tasky.app`)
- [ ] Staging uses separate Supabase project
- [ ] Staging auto-deploys on merge to `develop`
- [ ] Staging has test Stripe account
- [ ] Staging data does not affect production

**Priority:** High
**Technical Notes:**
- Create staging project in Vercel
- Use different env vars for staging vs. production

---

### US-8.3: Error Tracking with Sentry
**As a** developer
**I want to** track production errors
**So that** I can fix bugs quickly

**Acceptance Criteria:**
- [ ] Sentry project created
- [ ] Sentry SDK integrated in app
- [ ] Errors auto-reported to Sentry
- [ ] Source maps uploaded to Sentry
- [ ] User context included in error reports
- [ ] Alerts configured for critical errors

**Priority:** High
**Technical Notes:**
- Install `@sentry/react`
- Configure in `main.tsx`:
  ```ts
  Sentry.init({ dsn: '...' })
  ```
- Upload source maps in build step

---

### US-8.4: Uptime Monitoring
**As a** business owner
**I want to** know if the site is down
**So that** I can fix outages quickly

**Acceptance Criteria:**
- [ ] Uptime monitoring configured (UptimeRobot or similar)
- [ ] Monitors homepage (`/`)
- [ ] Monitors API health check (`/api/health`)
- [ ] Alerts sent via email if site down
- [ ] Status page available (optional)

**Priority:** Medium
**Technical Notes:**
- Use free tier of UptimeRobot
- Monitor every 5 minutes

---

### US-8.5: Analytics Setup (PostHog)
**As a** product manager
**I want to** track user behavior
**So that** I can improve the product

**Acceptance Criteria:**
- [ ] PostHog account created
- [ ] PostHog SDK integrated
- [ ] Track key events:
  - User signup
  - Task created
  - Task completed
  - Subscription started
  - Page views
- [ ] Custom dashboards created

**Priority:** Medium
**Technical Notes:**
- Install `posthog-js`
- Configure in app:
  ```ts
  posthog.init('YOUR_API_KEY', { api_host: 'https://app.posthog.com' })
  ```

---

## EPIC 9: Security Hardening

**Goal:** Fix critical security vulnerabilities
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 1 day

### US-9.1: Remove Hardcoded Secrets
**As a** security engineer
**I want to** remove secrets from client bundle
**So that** attackers cannot access them

**Acceptance Criteria:**
- [ ] `VITE_ADMIN_PIN` removed from codebase
- [ ] All secrets stored in Vercel env vars
- [ ] Client bundle analyzed (no secrets found)
- [ ] Security audit passed

**Priority:** High
**Technical Notes:**
- This is automatically fixed by migrating to Supabase Auth (Epic 1)

---

### US-9.2: Secure Storage Bucket
**As a** security engineer
**I want to** use signed URLs for attachments
**So that** files are not publicly accessible

**Acceptance Criteria:**
- [ ] Storage bucket set to private (not public)
- [ ] File uploads create signed URLs
- [ ] Signed URLs expire after 1 hour
- [ ] Direct file URLs return 403 Forbidden
- [ ] RLS policies enforce user_id check

**Priority:** High
**Technical Notes:**
- Update storage bucket policies in Supabase
- Use `supabase.storage.from('bucket').createSignedUrl()`

---

### US-9.3: Add Security Headers
**As a** security engineer
**I want to** add HTTP security headers
**So that** the app is protected from common attacks

**Acceptance Criteria:**
- [ ] Content-Security-Policy (CSP) header added
- [ ] Strict-Transport-Security (HSTS) header added
- [ ] X-Frame-Options: DENY header added
- [ ] X-Content-Type-Options: nosniff header added
- [ ] Referrer-Policy: strict-origin-when-cross-origin
- [ ] Verified with securityheaders.com

**Priority:** Medium
**Technical Notes:**
- Add to `vercel.json`:
  ```json
  {
    "headers": [
      {
        "source": "/(.*)",
        "headers": [
          { "key": "X-Frame-Options", "value": "DENY" },
          { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains" }
        ]
      }
    ]
  }
  ```

---

### US-9.4: Input Validation & Sanitization
**As a** security engineer
**I want to** validate all user inputs
**So that** XSS and injection attacks are prevented

**Acceptance Criteria:**
- [ ] Task title sanitized (strip HTML tags)
- [ ] Category name validated (alphanumeric + spaces)
- [ ] File uploads validated (type, size)
- [ ] URL inputs validated (valid URL format)
- [ ] SQL injection prevented (Supabase handles this)

**Priority:** Medium
**Technical Notes:**
- React auto-escapes (XSS protection built-in)
- Add DOMPurify for user-generated HTML (if allowing rich text)
- Use Zod for input validation

---

### US-9.5: Rate Limiting (Client-Side)
**As a** system
**I want to** prevent abuse via rate limiting
**So that** users cannot spam API calls

**Acceptance Criteria:**
- [ ] Bulk operations limited to 100 tasks at a time
- [ ] Task creation limited to 10 per minute
- [ ] File uploads limited to 5 per minute
- [ ] Rate limit errors show user-friendly message

**Priority:** Low
**Technical Notes:**
- Implement with `bottleneck` or custom logic
- Supabase handles server-side rate limiting

---

## EPIC 10: Performance Optimization

**Goal:** Achieve Lighthouse score 90+
**Priority:** 🟡 P2 (HIGH)
**Estimated Effort:** 1-2 days

### US-10.1: Code Splitting
**As a** developer
**I want to** split code by route
**So that** initial bundle size is reduced

**Acceptance Criteria:**
- [ ] Routes lazy-loaded with `React.lazy()`
- [ ] Each page in separate chunk
- [ ] Loading fallback shown during code load
- [ ] Bundle size reduced by >30%

**Priority:** Medium
**Technical Notes:**
```ts
const Dashboard = lazy(() => import('./pages/Dashboard'))
```

---

### US-10.2: Image Optimization
**As a** developer
**I want to** optimize images
**So that** page load is faster

**Acceptance Criteria:**
- [ ] All images compressed (TinyPNG or similar)
- [ ] Images served in WebP format
- [ ] Images lazy-loaded
- [ ] Responsive images (srcset) for different screen sizes

**Priority:** Low
**Technical Notes:**
- Use `next/image` equivalent for Vite (vite-imagetools)

---

### US-10.3: Lighthouse Audit
**As a** developer
**I want to** measure performance
**So that** I can identify bottlenecks

**Acceptance Criteria:**
- [ ] Lighthouse audit run on homepage
- [ ] Lighthouse audit run on /dashboard
- [ ] Performance score >90
- [ ] Accessibility score >90
- [ ] Best Practices score >90
- [ ] SEO score >90

**Priority:** Medium
**Technical Notes:**
- Run Lighthouse in Chrome DevTools
- Fix issues found in audit

---

### US-10.4: Pagination for Long Lists
**As a** user with 500+ tasks
**I want to** see tasks paginated
**So that** the UI doesn't freeze

**Acceptance Criteria:**
- [ ] Task list shows 50 tasks per page
- [ ] "Load more" button at bottom
- [ ] Scroll position preserved on pagination
- [ ] Calendar view uses virtualization for large lists

**Priority:** Medium
**Technical Notes:**
- Use `react-window` for virtualization
- Implement infinite scroll or pagination

---

## EPIC 11: Accessibility

**Goal:** Achieve WCAG 2.1 Level AA compliance
**Priority:** 🟡 P2 (HIGH)
**Estimated Effort:** 2 days

### US-11.1: Keyboard Navigation
**As a** keyboard-only user
**I want to** navigate with keyboard
**So that** I don't need a mouse

**Acceptance Criteria:**
- [ ] All interactive elements focusable with Tab
- [ ] Focus visible (outline or highlight)
- [ ] Calendar navigable with arrow keys
- [ ] Task status changeable with Enter/Space
- [ ] Modals closable with Esc
- [ ] Focus trapped in modals

**Priority:** High
**Technical Notes:**
- Add `tabIndex={0}` to custom interactive elements
- Use Radix UI for accessible components

---

### US-11.2: Screen Reader Support
**As a** blind user
**I want to** use a screen reader
**So that** I can use the app

**Acceptance Criteria:**
- [ ] All images have alt text
- [ ] Buttons have clear labels (ARIA labels)
- [ ] Form inputs have associated labels
- [ ] Status updates announced (ARIA live regions)
- [ ] Page structure semantic (headings, landmarks)
- [ ] Tested with VoiceOver and NVDA

**Priority:** High
**Technical Notes:**
- Add ARIA labels:
  ```tsx
  <button aria-label="Mark task as done">...</button>
  ```

---

### US-11.3: Color Contrast Audit
**As a** user with low vision
**I want to** read all text clearly
**So that** I can use the app comfortably

**Acceptance Criteria:**
- [ ] All text has contrast ratio ≥4.5:1 (WCAG AA)
- [ ] Large text (18pt+) has ratio ≥3:1
- [ ] Verified with WebAIM contrast checker
- [ ] Status indicators use shapes + color (not just color)

**Priority:** Medium
**Technical Notes:**
- Use WCAG contrast checker: https://webaim.org/resources/contrastchecker/

---

## EPIC 12: Advanced Task Features

**Goal:** Add power-user features for productivity
**Priority:** ⚪ P3 (MEDIUM)
**Estimated Effort:** 3-5 days

### US-12.1: Recurring Tasks
**As a** user
**I want to** create recurring tasks
**So that** I don't have to manually create daily tasks

**Acceptance Criteria:**
- [ ] User can set recurrence pattern (daily, weekly, monthly)
- [ ] Recurring task auto-creates next occurrence when marked done
- [ ] User can edit single occurrence or all future occurrences
- [ ] User can stop recurrence

**Priority:** Low
**Technical Notes:**
- Add `recurrence` column to tasks table (JSONB)
- Use cron job to create next occurrence

---

### US-12.2: Task Dependencies
**As a** user
**I want to** mark tasks as blocked by other tasks
**So that** I know what to work on first

**Acceptance Criteria:**
- [ ] User can add dependency ("Blocked by Task X")
- [ ] Dependent tasks visually indicated
- [ ] Completing blocker unblocks dependent task
- [ ] Cannot mark dependent task as done while blocked

**Priority:** Low
**Technical Notes:**
- Add `dependencies` table (many-to-many)
- Show warning when trying to complete blocked task

---

### US-12.3: Task Templates
**As a** user
**I want to** save tasks as templates
**So that** I can quickly create similar tasks

**Acceptance Criteria:**
- [ ] User can save task as template
- [ ] Templates accessible from "Templates" dropdown
- [ ] Creating from template pre-fills title, description, category
- [ ] Templates editable and deletable

**Priority:** Low
**Technical Notes:**
- Add `templates` table
- UI: "Save as template" button in task detail panel

---

### US-12.4: Time Tracking
**As a** user
**I want to** track time spent on tasks
**So that** I know how long tasks take

**Acceptance Criteria:**
- [ ] "Start timer" button on task
- [ ] Timer shows elapsed time
- [ ] "Stop timer" saves time log
- [ ] Time logs shown in task history

**Priority:** Low
**Technical Notes:**
- Add `time_logs` table (task_id, start_time, end_time)
- Use `setInterval` for timer UI

---

## EPIC 13: Collaboration Features

**Goal:** Enable team workspaces and task sharing
**Priority:** ⚪ P3 (FUTURE)
**Estimated Effort:** 5-7 days

### US-13.1: Team Workspaces
**As a** team lead
**I want to** create a team workspace
**So that** my team can collaborate on tasks

**Acceptance Criteria:**
- [ ] User can create team workspace
- [ ] User can invite team members by email
- [ ] Team members see shared tasks
- [ ] User can switch between personal and team workspace

**Priority:** Low (Future)
**Technical Notes:**
- Add `workspaces` table
- Add `workspace_id` to tasks and categories

---

### US-13.2: Task Assignments
**As a** team lead
**I want to** assign tasks to team members
**So that** responsibilities are clear

**Acceptance Criteria:**
- [ ] User can assign task to team member
- [ ] Assigned user receives notification
- [ ] Task shows assignee avatar
- [ ] Filter tasks by assignee

**Priority:** Low (Future)
**Technical Notes:**
- Add `assigned_to` column to tasks

---

## EPIC 14: Mobile Experience

**Goal:** Optimize for mobile devices
**Priority:** 🟡 P2 (SHOULD-HAVE)
**Estimated Effort:** 1-2 days

### US-14.1: Mobile-Optimized Calendar
**As a** mobile user
**I want to** use calendar on my phone
**So that** I can manage tasks on the go

**Acceptance Criteria:**
- [ ] Calendar cells sized for mobile (min 60px)
- [ ] Tasks truncated with ellipsis
- [ ] Tap to expand task details
- [ ] Swipe to change status (optional)

**Priority:** Medium
**Technical Notes:**
- Add responsive breakpoints
- Test on iPhone SE and Pixel 5

---

### US-14.2: Progressive Web App (PWA)
**As a** mobile user
**I want to** install Tasky as an app
**So that** I can access it like a native app

**Acceptance Criteria:**
- [ ] Web app manifest created
- [ ] Install prompt shown on mobile
- [ ] App icon on home screen
- [ ] Offline mode works (service worker)
- [ ] Push notifications enabled (optional)

**Priority:** Low
**Technical Notes:**
- Create `manifest.json`
- Add service worker with Workbox

---

## EPIC 15: Analytics & Insights

**Goal:** Provide users with productivity insights
**Priority:** ⚪ P3 (NICE-TO-HAVE)
**Estimated Effort:** 2 days

### US-15.1: Productivity Trends
**As a** user
**I want to** see my productivity trends
**So that** I can identify patterns

**Acceptance Criteria:**
- [ ] Chart shows tasks completed per week (last 12 weeks)
- [ ] Chart shows tasks by category (pie chart)
- [ ] Chart shows average completion time (if time tracking enabled)
- [ ] Export chart as image

**Priority:** Low
**Technical Notes:**
- Use Recharts
- Query aggregated data from Supabase

---

### US-15.2: Goal Tracking
**As a** user
**I want to** set weekly goals
**So that** I stay motivated

**Acceptance Criteria:**
- [ ] User sets goal (e.g., "Complete 20 tasks this week")
- [ ] Progress bar shows goal progress
- [ ] Celebration animation when goal reached
- [ ] Goals tracked over time

**Priority:** Low
**Technical Notes:**
- Add `goals` table
- Track progress in analytics dashboard

---

## EPIC 16: Integrations

**Goal:** Connect Tasky with other tools
**Priority:** ⚪ P3 (FUTURE)
**Estimated Effort:** 3-5 days

### US-16.1: Slack Integration
**As a** user
**I want to** receive task notifications in Slack
**So that** I stay updated

**Acceptance Criteria:**
- [ ] User connects Slack account
- [ ] Task created → Slack message sent
- [ ] Task completed → Slack message sent
- [ ] User can disable Slack notifications

**Priority:** Low
**Technical Notes:**
- Use Slack Webhooks
- Add Slack channel selector

---

### US-16.2: Google Calendar Sync
**As a** user
**I want to** sync tasks to Google Calendar
**So that** I see tasks in my calendar

**Acceptance Criteria:**
- [ ] User connects Google Calendar
- [ ] Tasks with dates synced to Google Calendar
- [ ] Changes in Tasky update Google Calendar
- [ ] User can disconnect sync

**Priority:** Low
**Technical Notes:**
- Use Google Calendar API
- OAuth for Google authorization

---

### US-16.3: Zapier Integration
**As a** user
**I want to** connect Tasky to Zapier
**So that** I can automate workflows

**Acceptance Criteria:**
- [ ] Zapier app created
- [ ] Triggers: Task created, Task completed
- [ ] Actions: Create task
- [ ] Published on Zapier app directory

**Priority:** Low
**Technical Notes:**
- Build Zapier integration (requires API)
- Create webhooks for triggers

---

## EPIC 17: Legal & Compliance

**Goal:** Ensure legal compliance for SaaS launch
**Priority:** 🔴 P0 (BLOCKER)
**Estimated Effort:** 0.5-1 day

### US-17.1: Privacy Policy
**As a** user
**I want to** read the privacy policy
**So that** I know how my data is used

**Acceptance Criteria:**
- [ ] Privacy Policy page created
- [ ] Policy explains data collection (tasks, email, payment info)
- [ ] Policy explains data usage (app functionality, analytics)
- [ ] Policy explains data sharing (none, except Stripe for payments)
- [ ] Policy explains user rights (export, delete)
- [ ] Policy includes contact email
- [ ] Link in footer

**Priority:** High
**Technical Notes:**
- Use Termly Privacy Policy Generator
- Review with legal counsel (optional but recommended)

---

### US-17.2: Terms of Service
**As a** user
**I want to** read the terms of service
**So that** I know the rules

**Acceptance Criteria:**
- [ ] Terms of Service page created
- [ ] Terms explain acceptable use (no illegal activity)
- [ ] Terms explain refund policy (no refunds)
- [ ] Terms explain account termination conditions
- [ ] Terms include liability disclaimer
- [ ] Link in footer

**Priority:** High
**Technical Notes:**
- Use Termly ToS Generator

---

### US-17.3: Cookie Consent Banner
**As a** EU user
**I want to** consent to cookies
**So that** my privacy is respected (GDPR)

**Acceptance Criteria:**
- [ ] Cookie consent banner shown on first visit
- [ ] User can accept or reject cookies
- [ ] Rejecting disables non-essential cookies (analytics)
- [ ] Consent choice saved in localStorage
- [ ] "Manage cookies" link in footer

**Priority:** Medium (Required for EU users)
**Technical Notes:**
- Use `react-cookie-consent` library
- Only load analytics if user consents

---

### US-17.4: GDPR Compliance Features
**As a** EU user
**I want to** exercise my data rights
**So that** I comply with GDPR

**Acceptance Criteria:**
- [ ] Right to access: User can view all data
- [ ] Right to export: User can download data (JSON)
- [ ] Right to deletion: User can delete account
- [ ] Right to rectification: User can edit profile
- [ ] Data breach notification process documented

**Priority:** High (Required for EU users)
**Technical Notes:**
- Implement in Account Settings (Epic 4)
- Document data breach response plan

---

## PRIORITY SUMMARY

### 🔴 P0 - BLOCKER (Must Fix Before Launch)
- Epic 1: Authentication & User Management
- Epic 2: Multi-Tenancy & Data Isolation
- Epic 3: Billing & Subscriptions
- Epic 8: Infrastructure & DevOps (CI/CD, Sentry)
- Epic 9: Security Hardening
- Epic 17: Legal & Compliance

### 🟠 P1 - CRITICAL (Fix Within Week 1)
- Epic 4: Account Management
- Epic 5: Email Notifications
- Epic 7: Testing & Quality

### 🟡 P2 - HIGH (Fix Within Month 1)
- Epic 6: Onboarding Experience
- Epic 10: Performance Optimization
- Epic 11: Accessibility
- Epic 14: Mobile Experience

### ⚪ P3 - MEDIUM (Future Roadmap)
- Epic 12: Advanced Task Features
- Epic 13: Collaboration Features
- Epic 15: Analytics & Insights
- Epic 16: Integrations

---

## ESTIMATION SUMMARY

| Epic | Priority | Estimated Effort |
|------|----------|------------------|
| Epic 1: Authentication | P0 | 2-3 days |
| Epic 2: Multi-Tenancy | P0 | 1-2 days |
| Epic 3: Billing | P0 | 3-4 days |
| Epic 4: Account Management | P1 | 1-2 days |
| Epic 5: Email Notifications | P1 | 1-2 days |
| Epic 6: Onboarding | P2 | 1 day |
| Epic 7: Testing | P1 | 3-5 days |
| Epic 8: Infrastructure | P0 | 1 day |
| Epic 9: Security | P0 | 1 day |
| Epic 10: Performance | P2 | 1-2 days |
| Epic 11: Accessibility | P2 | 2 days |
| Epic 12: Advanced Features | P3 | 3-5 days |
| Epic 13: Collaboration | P3 | 5-7 days |
| Epic 14: Mobile | P2 | 1-2 days |
| Epic 15: Analytics | P3 | 2 days |
| Epic 16: Integrations | P3 | 3-5 days |
| Epic 17: Legal | P0 | 0.5-1 day |

**Total P0 Effort:** 11-15 days
**Total P1 Effort:** 5-9 days
**Total P2 Effort:** 5-7 days
**Total P3 Effort:** 13-19 days

**GRAND TOTAL:** 34-50 days (7-10 weeks)

---

## SPRINT PLANNING RECOMMENDATION

### Sprint 1 (Week 1): Security & Foundation
- Epic 1: Authentication (3 days)
- Epic 2: Multi-Tenancy (2 days)

### Sprint 2 (Week 2): Infrastructure & Billing
- Epic 8: Infrastructure (1 day)
- Epic 9: Security (1 day)
- Epic 3: Billing (3 days)

### Sprint 3 (Week 3): Core Features & Testing
- Epic 4: Account Management (2 days)
- Epic 5: Email Notifications (1 day)
- Epic 7: Testing (2 days)

### Sprint 4 (Week 4): UX & Polish
- Epic 6: Onboarding (1 day)
- Epic 10: Performance (1 day)
- Epic 11: Accessibility (2 days)
- Epic 17: Legal (1 day)

### Sprint 5+ (Month 2): Growth & Advanced Features
- Epic 14: Mobile (2 days)
- Epic 12: Advanced Features (as needed)
- Epic 15: Analytics (as needed)
- Epic 13: Collaboration (future)
- Epic 16: Integrations (future)

---

**Document Version:** 1.0
**Last Updated:** February 13, 2026
**Maintained By:** Product Team
