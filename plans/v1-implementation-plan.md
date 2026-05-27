# FamilyBudget — v1 Implementation Plan

## Table of Contents
- [Goals & Phases](#goals--phases)
- [Decisions Locked In](#decisions-locked-in)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Data Model (Supabase / Postgres)](#data-model-supabase--postgres)
- [Row-Level Security (RLS)](#row-level-security-rls)
- [Component / Folder Structure](#component--folder-structure)
- [Implementation Steps (Ordered)](#implementation-steps-ordered)
- [Deployment](#deployment)
- [Out of Scope for Phase 1](#out-of-scope-for-phase-1)
- [Risks & Open Questions](#risks--open-questions)

---

## Goals & Phases

Build a real, hosted family expense tracker based on the existing prototype at `family-budget/`. Two users (Barry + wife), used in weekly budget meetings on a laptop, accessible while travelling.

| Phase | Target | Notes |
|---|---|---|
| **1** | Browser web app on laptop | Full feature parity with prototype + Supabase persistence + Google auth |
| **2** | PWA (installable on Android/iOS) | Mobile-responsive layout, quick-add-expense on phone, realtime sync between devices |
| **3** | React Native native apps | Share business logic with web, native UX |

This plan covers **phase 1 only**. Phases 2 and 3 get their own plans later.

---

## Decisions Locked In

See grilling session for rationale. Summary:

- **Users**: 2 users in a shared household; row-level attribution via `created_by`
- **Backend**: Supabase (Postgres + Auth + RLS), free tier
- **Auth**: Google OAuth
- **Frontend**: React + TypeScript + Vite + Tailwind CSS, run with Bun (LTS)
- **Hosting**: Vercel
- **Currency**: PHP only
- **Concurrency (phase 1)**: One-driver-one-watcher, no realtime
- **UI fidelity**: Match the prototype design, modularised into proper components
- **Data import**: Start fresh, no historical migration
- **Scope (phase 1)**: All prototype features — months, halves, sources, expenses, payments, tags, carry-overs, statistics — plus a new recurring-expense-template system

---

## Tech Stack

| Layer | Choice | Notes |
|---|---|---|
| Package manager / runtime | Bun (LTS) | `bun install`, `bun run dev` |
| Build tool | Vite | Already in prototype, compatible with Bun |
| Frontend framework | React 18 + TypeScript | Migrate from prototype's plain JS |
| Styling | Tailwind CSS | Migrate from prototype's handwritten CSS; preserve the visual design via a custom theme that mirrors the `--linen` / `--ink` / `--green` palette |
| Forms / state | React `useState` + Context for global app state | Keep simple; add Zustand or React Query only if/when needed |
| Backend | Supabase (Postgres + Auth + JS client) | No custom server in phase 1 |
| Auth | Google OAuth via Supabase | One-click sign-in |
| Hosting | Vercel | Free, auto-deploy from GitHub, preview URLs per PR |
| Types | `supabase gen types typescript` | Auto-generate DB types from schema |

---

## Architecture Overview

```
┌──────────────────────────┐
│  React + Vite (Vercel)   │  ← user's browser
│   - Tailwind             │
│   - supabase-js client   │
└────────────┬─────────────┘
             │  HTTPS + JWT
             ▼
┌──────────────────────────┐
│       Supabase           │
│  ┌────────────────────┐  │
│  │ Auth (Google OAuth)│  │
│  ├────────────────────┤  │
│  │ Postgres + RLS     │  │
│  └────────────────────┘  │
└──────────────────────────┘
```

No custom backend. The React app talks directly to Supabase using `@supabase/supabase-js`. Row-level security (RLS) policies enforce that users only see/edit data in their own household.

---

## Data Model (Supabase / Postgres)

All tables have `id uuid pk default gen_random_uuid()`, `created_at timestamptz default now()`, `created_by uuid references auth.users(id)`. Cascade rules in the schema; only the key columns shown.

### `households`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| name | text | e.g., "Barry & Wife" |

### `household_members`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| household_id | uuid | FK |
| user_id | uuid | FK `auth.users` |
| display_name | text | e.g., "Wife", "Husband" |
| role | text | `owner` \| `member` (phase 1 both are `owner`) |

### `months`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| household_id | uuid | FK |
| year | int | e.g., 2026 |
| month_num | int | 1–12 |
| half1_salary_date | text | e.g., `"25th"` |
| half2_salary_date | text | e.g., `"30th"` |
| label | text | Generated, e.g., `"May 2026"` |

Unique on `(household_id, year, month_num)`.

### `sources`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| month_id | uuid | FK (per-month; sources are scoped to a month, matching prototype) |
| name | text | e.g., "Wife Payroll" |
| type | text | `salary` \| `debt_collected` \| `savings_withdrawal` |
| account_label | text | e.g., "BDO Payroll" |
| half | text | `half1` \| `half2` \| `both` |
| balance | numeric(12,2) | |

### `expenses`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| month_id | uuid | FK |
| name | text | |
| category | text | enum: Bills, Food, Utilities, Home, Travel, Health, Education, Other |
| half | text | `half1` \| `half2` |
| amount | numeric(12,2) | Budgeted amount |
| source_id | uuid | FK `sources` (nullable — the "intended" source) |
| tag | text | nullable: needs \| wants \| savings \| investment \| business |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| expense_id | uuid | FK |
| paid_on | date | |
| amount | numeric(12,2) | |
| source_id | uuid | FK `sources` (the actual source used) |
| note | text | |

### `carry_overs`
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| month_id | uuid | FK (the month being charged) |
| from_label | text | e.g., `"2nd Half Apr 2026"` |
| from_kind | text | `prev_month` \| `half1` \| `half2` |
| amount | numeric(12,2) | Positive |
| source_id | uuid | FK `sources` — which source in this month covers it |
| resolved_at | timestamptz | nullable |

### `recurring_expense_templates`  *(new — not in prototype)*
| Column | Type | Notes |
|---|---|---|
| id | uuid | PK |
| household_id | uuid | FK |
| name | text | e.g., "Electric Bill" |
| category | text | |
| half | text | `half1` \| `half2` |
| default_amount | numeric(12,2) | |
| default_source_name | text | Match by name when generating into a new month |
| tag | text | nullable |
| cadence | text | `monthly` \| `quarterly` \| `yearly` |
| active | bool | default true |
| start_year_month | text | e.g., `"2026-05"` — first month it applies |

When the user clicks "Create June 2026", the app inserts a fresh `months` row and then generates `expenses` rows from each active template whose cadence applies. Sources are cloned from the previous month (with zero balances, user fills in).

### `recurring_source_templates`  *(optional, phase 1.1)*
Same idea for sources. Optional — for phase 1 we can just clone last month's sources.

---

## Row-Level Security (RLS)

Every table has RLS **on**. Single core policy pattern: "user must be a member of the household this row belongs to". Helper function:

```sql
create function user_household_ids(uid uuid)
returns setof uuid language sql security definer stable as $$
  select household_id from household_members where user_id = uid
$$;
```

Then for each table, e.g.:
```sql
create policy "household read" on months for select
  using (household_id in (select user_household_ids(auth.uid())));
create policy "household write" on months for all
  using (household_id in (select user_household_ids(auth.uid())))
  with check (household_id in (select user_household_ids(auth.uid())));
```

Child tables (sources, expenses, payments, carry_overs) check via their parent's `household_id` (join through `months`).

---

## Component / Folder Structure

Split the monolithic `App.jsx` into:

```
src/
  main.tsx
  App.tsx                  ← top-level router/layout
  lib/
    supabase.ts            ← createClient(...)
    types.ts               ← re-export generated DB types
    money.ts               ← fmt(), parsing helpers
    halves.ts              ← halfExpenses, sourceRemaining, sourceEffectiveRemaining
    carryovers.ts          ← carry-over math
  auth/
    GoogleSignIn.tsx
    AuthGate.tsx           ← redirects to sign-in if not authed
    useSession.ts
  household/
    useHousehold.ts        ← current household + members
    HouseholdSetup.tsx     ← first-run flow to create household + invite spouse
  months/
    MonthSidebar.tsx
    MonthSwitcher.tsx
    useMonths.ts           ← list/create months, generate from templates
  budget/
    OverviewPage.tsx       ← summary cards + half split
    HalfView.tsx           ← single-half category drill-down
    CategoryGrid.tsx
    CategoryList.tsx
    ExpenseTable.tsx
    ExpenseModal.tsx
    PaymentsModal.tsx
    SourcesPanel.tsx
    CarryOverBanner.tsx
    CarryOverModal.tsx
  recurring/
    RecurringTemplatesPage.tsx
    useRecurringTemplates.ts
  statistics/
    StatisticsPage.tsx
  ui/
    Button.tsx, Modal.tsx, Toast.tsx, Pill.tsx, etc.  ← shared primitives
  styles/
    globals.css            ← Tailwind directives + design tokens (CSS vars)
    tailwind.config.ts     ← theme extending colors to match prototype
```

Routes (using React Router):
- `/sign-in`
- `/setup` (first-run household creation)
- `/month/:year-:month/overview`
- `/month/:year-:month/half/:half`
- `/month/:year-:month/half/:half/category/:cat`
- `/recurring`
- `/statistics`

---

## Implementation Steps (Ordered)

Each step is a discrete chunk that ends with a runnable, working app.

### Step 1 — Project bootstrap
- New folder `app/` next to `family-budget/` (keep prototype intact for reference)
- `bun create vite app --template react-ts`
- Install: `@supabase/supabase-js`, `react-router-dom`, `tailwindcss`, `@tailwindcss/forms`
- Init Tailwind, configure theme with prototype's color palette and font families
- Smoke test: `bun run dev` renders "Hello"

### Step 2 — Supabase project + schema
- Create new Supabase project (free tier)
- Write `schema.sql` defining all tables, FKs, indexes, RLS policies (above)
- Apply via Supabase SQL editor or CLI
- Run `supabase gen types typescript` → `src/lib/types.ts`
- Enable Google OAuth provider in Supabase dashboard; configure Google Cloud OAuth client

### Step 3 — Auth + Household setup
- `lib/supabase.ts` with env-driven URL/key (`.env.local`, also set in Vercel)
- `GoogleSignIn` button → `supabase.auth.signInWithOAuth({ provider: 'google' })`
- `AuthGate` wraps the app; unauthenticated → sign-in screen
- First-run flow: if signed-in user has no `household_members` row, show `HouseholdSetup` (create household, set display name, copy invite link for spouse)
- Spouse clicks invite link (signed JWT or simple invite code) → joins household

### Step 4 — Month list + create
- `MonthSidebar` lists months for the household, sorted desc
- "+ Add month" creates a new `months` row
- Wire URL routing: `/month/2026-05/overview`

### Step 5 — Sources panel
- Port `SourcesPanel` from prototype
- CRUD against `sources` table scoped to current `month_id`
- Per-source remaining balance (real-time computed from payments)

### Step 6 — Expenses + Payments (core flow)
- Port `OverviewPage`, `HalfView`, `CategoryGrid`, `CategoryList`, `ExpenseTable`
- Port `ExpenseModal` (create/edit expense) → writes to `expenses`
- Port `PaymentsModal` → writes to `payments`
- Status pill (paid / partial / unpaid) computed from payment sums
- Tags (Needs / Wants / Savings / Investment / Business)

### Step 7 — Carry-overs
- Port `CarryOverBanner` and `CarryOverModal`
- Implement carry-over math from `lib/carryovers.ts`
- Resolve-one + resolve-all
- For now, carry-overs are entered manually (auto-detection from prior month is a stretch goal for phase 1.1)

### Step 8 — Recurring expense templates *(new)*
- `RecurringTemplatesPage` — CRUD for templates
- "Generate from templates" button on a fresh month → bulk-insert `expenses` rows from active templates
- Auto-trigger on month creation (with toast: "12 recurring expenses generated, review and adjust")

### Step 9 — Statistics view
- Port the existing chart code (donut + bar list) into `StatisticsPage`
- Pure read-only — purely a function of current month's data

### Step 10 — Polish + deploy
- 404 page, empty states, loading skeletons (matching prototype's aesthetic)
- Toast system for save/delete confirmations (already prototyped)
- Push to GitHub
- Connect repo to Vercel; set env vars; first deploy
- Add Supabase project's production URL to OAuth redirect allowlist
- Smoke test with both Google accounts

---

## Deployment

| | |
|---|---|
| **Frontend** | Push to GitHub → Vercel auto-deploys `main`. PR previews on branches. |
| **Backend** | Supabase project. Schema changes managed via migration SQL files committed to repo and applied via Supabase CLI. |
| **Env vars** | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — set locally in `.env.local`, in Vercel project settings for prod. |
| **Domain** | Start with `<project>.vercel.app`. Custom domain later if wanted. |
| **Backups** | Supabase auto-backs-up daily on free tier (7-day retention). |

---

## Out of Scope for Phase 1

Explicitly deferred — do not build:

- Realtime sync between devices (phase 2)
- Mobile-optimised layouts / PWA install / service worker (phase 2)
- Native iOS / Android apps (phase 3)
- Bill-due reminders / notifications
- Bank/GCash/Maya integrations
- CSV / spreadsheet importer
- Multi-currency
- Audit history beyond `created_by` / `created_at` columns
- Roles beyond "everyone is owner"
- Recurring sources auto-clone (do manually month one; revisit if painful)
- Auto-detection of carry-over deficits from prior month (manual entry in phase 1)

---

## Risks & Open Questions

| # | Risk / Question | Mitigation |
|---|---|---|
| 1 | Supabase free tier pauses after ~1 week of zero API calls | Weekly meetings prevent it. If we ever stop, project resumes with one click. |
| 2 | Google OAuth setup is the first thing where Barry might get stuck (Google Cloud Console UX) | Step-by-step walkthrough during Step 2. |
| 3 | Tailwind migration of the prototype's distinct visual language could drift from the original | Build a `tailwind.config.ts` theme that mirrors the prototype's CSS variables 1:1 before porting components. Side-by-side compare the rendered prototype during porting. |
| 4 | Recurring templates is a brand-new concept (not in prototype) — design risk | Keep it minimal in phase 1: name, amount, half, source-by-name, monthly cadence only. Add quarterly/yearly later. |
| 5 | Carry-over logic is the most complex prototype feature | Port the helpers in `lib/carryovers.ts` first with unit tests; then build UI on top. |
| 6 | Single-file prototype has ~2776 lines including a lot of inline state | Resist the urge to "improve" while porting. Match behaviour first, refactor later. |
| 7 | Concurrent edits ("one driver, one watcher") will silently overwrite if both edit | Acceptable for phase 1 given workflow. Add `updated_at` columns now so we can detect conflicts when realtime arrives in phase 2. |

---

*End of plan.*
