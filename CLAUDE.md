# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout — two distinct layers

This repo is **not** just an app. It has two layers, and conflating them causes mistakes:

1. **Root = agent dev-harness.** `run-ticket.sh`, `Dockerfile`, `entrypoint.sh`, and `plans/` exist to run tickets autonomously: a Dockerized headless Claude agent clones the repo, implements one GitHub issue, and pushes a `feat/<branch>`. This layer is infrastructure, not product code.
2. **`family-budget/` = the actual application.** All product code, tests, migrations, and the app's own toolchain live here. **When implementing a feature ticket, the app is in `family-budget/`, not the repo root and not `app/`.**

`plans/dev-phase-01.md` is the authoritative workflow document — read it before touching the harness or running tickets.

## Toolchain — Bun, not npm

The app uses **Bun** as runtime and package manager. The READMEs say `npm`; they are stale — ignore them and use `bun`. All app commands below run **from inside `family-budget/`**.

```bash
bun install              # install dependencies
bun run dev              # Vite dev server at http://localhost:5173
bun run build            # tsc + vite build → dist/
bun run test             # Vitest unit/integration tests (run once)
bun run test:watch       # Vitest in watch mode
bun run type-check       # tsc --noEmit
bunx vitest run src/budget-engine/index.test.ts   # run a single test file
bunx playwright test     # Playwright e2e smoke tests (auto-starts dev server)
```

Local Supabase (Postgres + Auth) runs in Docker via the Supabase CLI:

```bash
supabase start           # boots local stack; prints API URL + anon key
supabase stop
supabase gen types typescript --local > src/lib/database.types.ts   # regenerate types after schema changes
```

After `supabase start`, put the printed URL and anon key in `family-budget/.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (gitignored).

## Application architecture (`family-budget/`)

- **Stack:** Vite 5 + React 18 + TypeScript + React Router 6 + Tailwind CSS 4 (via the `@tailwindcss/vite` plugin) + `@supabase/supabase-js`.
- **Import alias:** `@` → `/src` (configured in `vite.config.ts`).
- **`src/budget-engine/`** is the financial core: pure, framework-agnostic functions (`expPaid`, `expStatus`, `expTotal`, `sourceRemaining`, `sourcesTotal`, `sourceEffectiveRemaining`). Keep this module free of React and Supabase imports, and unit-tested — the rest of the app depends on it for correctness.
- **`src/lib/supabase.ts`** is the single typed Supabase client. **`src/lib/database.types.ts`** is generated from the schema — regenerate it (command above) rather than hand-editing after a migration.
- **Routing:** `App.tsx` mounts `<AppShell>` (topbar + collapsible sidebar + content area) wrapping `<Routes>`. Page components live in `src/routes/`. The month route param `:yearMonth` is a single string like `2026-5` (year-monthNum), not two params.
- **Database:** schema lives in `supabase/migrations/` as plain SQL; `supabase/seed.sql` loads May 2026 test data. RLS is enabled on every table and gated through the `user_household_ids()` SQL helper, which returns the households the current `auth.uid()` belongs to. Every table carries `id` (uuid, `gen_random_uuid()`), `created_at`, `created_by`, `updated_at`.

## Conventions worth matching

- **Styling is inline + CSS custom properties, not Tailwind utility classes** (see `AppShell.tsx`). The design tokens — `--color-linen`/`-ink`/`-green`/`-red`/`-amber`/`-blue`/`-rule`, the `DM Sans`/`DM Mono` fonts, and layout vars — are defined in the `@theme` block of `src/index.css`. Reference those tokens; don't hardcode hex values.
- **Tests:** Vitest specs are `src/**/*.test.{ts,tsx}` (happy-dom env, globals on). Playwright specs live in `e2e/` and are excluded from Vitest — keep that separation.
- **SQL:** lowercase keywords, `create table if not exists`, and add the RLS policy + `user_household_ids()` gate whenever you add a table.
- Components use `data-testid` hooks (`app-shell`, `topbar`, `sidebar`, `content-area`) — preserve them for e2e tests.

## Ticket workflow

Issues are tracked on GitHub (`barrylavides/budget-app`). Tickets carry a `ready-for-agent` label; on completion the workflow checks the acceptance-criteria boxes, swaps the label to `completed`, and closes the issue. `run-ticket.sh <issue#> <branch> <model>` runs a ticket in Docker (build the image first with `docker build -t budget-agent .`) and, on success, walks the acceptance criteria interactively before closing. See `plans/dev-phase-01.md` for the full sequential/parallel execution model.
