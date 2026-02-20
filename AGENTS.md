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
