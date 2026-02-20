# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Application source.
- `src/components/`: Reusable UI components (PascalCase files).
- `src/pages/`: Route-level screens.
- `src/contexts/`, `src/hooks/`, `src/lib/`: State, hooks, and shared utilities (hooks named `useX`).
- `src/assets/`: Static assets imported by the app.
- `src/test/`: Vitest setup and test helpers.
- `public/`: Static files served as-is.
- `supabase/`: Database schema and migrations.
- `dist/`: Build output (generated).

## Build, Test, and Development Commands
- `npm run dev`: Start Vite dev server with HMR.
- `npm run build`: Type-check (`tsc -b`) and create a production build.
- `npm run preview`: Serve the production build locally.
- `npm run lint`: Run ESLint across the repo.
- `npm run test`: Run Vitest in watch mode.
- `npm run test:run`: Run Vitest once for CI.

## Coding Style & Naming Conventions
- TypeScript + React with Vite; modules are ESM (`"type": "module"`).
- Indentation: 2 spaces; prefer single quotes in JS/TS and JSX props aligned for readability.
- Components: `PascalCase.tsx` (e.g., `TaskCard.tsx`).
- Hooks: `useX` in `src/hooks/` (e.g., `useTasks.ts`).
- Shared utilities: `src/lib/`.
- Linting: ESLint via `eslint.config.js` (React Hooks + React Refresh rules).

## Testing Guidelines
- Framework: Vitest with `jsdom` and global test APIs.
- Setup: `src/test/setup.ts`.
- Test files: co-locate as `*.test.ts(x)` or `*.spec.ts(x)` near source files.
- Run tests with `npm run test` (watch) or `npm run test:run` (CI).

## Commit & Pull Request Guidelines
- Commit history is short, lowercase, and descriptive (no strict convention). Keep messages under ~72 chars and state the change (e.g., "fix cache issue", "update dashboard theme").
- PRs should include: a concise summary, key UI changes with screenshots (if applicable), and any linked issues or Supabase migrations.

## Configuration & Secrets
- Supabase credentials are required at runtime.
- Create a `.env` file with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running locally.
- Database schema and migrations live in `supabase/`.

## Skills
A skill is a set of local instructions stored in a `SKILL.md` file.

### Available skills
- `tasky-vibe-coding`: End-to-end Tasky implementation orchestration across UI, hooks, Supabase, and tests. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-vibe-coding/SKILL.md`)
- `tasky-fullstack-standard-coding`: Fullstack coding style guardrails for simple, standard, low-bug implementation. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-fullstack-standard-coding/SKILL.md`)
- `tasky-feature-delivery`: Feature implementation using existing Tasky patterns in React hooks, TanStack Query, and Supabase logic. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-feature-delivery/SKILL.md`)
- `tasky-calendar-ux`: Calendar/list/backlog UX behavior and interaction consistency. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-calendar-ux/SKILL.md`)
- `tasky-supabase-rls`: Schema, migration, policy, and user-isolation changes in Supabase. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-supabase-rls/SKILL.md`)
- `tasky-schema-migration-advisor`: Analyze new feature vs current DB schema and suggest safe migration SQL/RLS/backfill/rollback. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-schema-migration-advisor/SKILL.md`)
- `tasky-testing-ci`: Test, lint, build, and CI-style verification workflow. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-testing-ci/SKILL.md`)
- `tasky-roadmap-execution`: Convert plans/user stories into dependency-aware implementation slices. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-roadmap-execution/SKILL.md`)
- `tasky-debugging-issues`: Debug workflow for reproducing, isolating, fixing, and verifying Tasky bugs and regressions. (file: `/Users/muhammadmohsin/Desktop/mvps/tasky/skills/tasky-debugging-issues/SKILL.md`)

### Auto-trigger guidance (plain prompts, no `$` needed)
- Use `tasky-schema-migration-advisor` when prompts include: `schema`, `migration`, `table`, `column`, `RLS`, `backfill`, `DB change`.
- Use `tasky-supabase-rls` when prompts include: `Supabase policy`, `user isolation`, `multi-tenant`, `auth.uid()`.
- Use `tasky-calendar-ux` when prompts include: `calendar`, `list view`, `backlog`, `drawer`, `status toggle`, `monthly`.
- Use `tasky-testing-ci` when prompts include: `test`, `lint`, `build`, `verify`, `regression`, `CI`.
- Use `tasky-debugging-issues` when prompts include: `debug`, `bug`, `issue`, `regression`, `failing test`, `runtime error`, `not working`.
- Use `tasky-roadmap-execution` when prompts include: `roadmap`, `phase`, `sprint`, `execution plan`, `prioritize`.
- Use `tasky-feature-delivery` for normal feature coding prompts in app code.
- Default to `tasky-vibe-coding` + `tasky-fullstack-standard-coding` for end-to-end implementation requests.
