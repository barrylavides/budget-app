# PRD: FamilyBudget Expense Tracker — Phase 1

> **Status:** `ready-for-agent`
> **Publish to issue tracker** once the GitHub repo is created.

---

## Table of Contents

- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [User Stories](#user-stories)
  - [Authentication & Household](#authentication--household)
  - [Month Management](#month-management)
  - [Income Sources](#income-sources)
  - [Expenses](#expenses)
  - [Half Views & Overview](#half-views--overview)
  - [Payments](#payments)
  - [Carry-Overs](#carry-overs)
  - [Recurring Expense Templates](#recurring-expense-templates)
  - [Statistics](#statistics)
  - [General UX](#general-ux)
- [Implementation Decisions](#implementation-decisions)
  - [Architecture](#architecture)
  - [Data Model](#data-model)
  - [Schema Shape (from prototype)](#schema-shape-from-prototype)
  - [Modules](#modules)
  - [Tech Stack](#tech-stack)
  - [Routing](#routing)
  - [Concurrency](#concurrency)
  - [Currency](#currency)
- [Testing Decisions](#testing-decisions)
- [Out of Scope](#out-of-scope)
- [Further Notes](#further-notes)

---

## Problem Statement

A couple (Barry and his wife) manages their household finances through a weekly budget meeting on a laptop. They currently have no persistent tool — the existing prototype is an in-memory React app that loses all data on refresh. They need a real, hosted expense tracker that:

- Survives a browser refresh (persistent data)
- Is accessible from any device with internet (for travel)
- Supports two authenticated users editing a shared household budget
- Models their specific financial structure: two salary halves per month (paid on the 25th and 30th), multiple income sources per half, categorised and tagged expenses, per-expense payment tracking, and carry-over deficits from prior periods
- Eliminates the repetitive manual entry of recurring monthly expenses (electric, internet, groceries, school fees, etc.)

Without this, they rely on memory, spreadsheets, or a prototype that resets every session — all of which fail to provide a cumulative, trustworthy picture of household finances over time.

---

## Solution

Build a persistent, multi-user web application that ports the existing UI prototype into a production-grade family expense tracker backed by Supabase (Postgres + Auth).

**Phase 1** delivers a browser-first web app (laptop-optimised) with:
- Google OAuth sign-in (one-click, no passwords)
- A shared household model where both spouses see and edit everything
- Full feature parity with the prototype (months, halves, sources, expenses, payments, carry-overs, tags, statistics)
- A new recurring-expense-template system that auto-generates monthly bills when a new month is created
- Hosted on Vercel, accessible from anywhere

**Phase 2** (future) adds PWA mobile support with quick-add expense and realtime sync. **Phase 3** adds React Native apps. These phases are out of scope for this PRD.

---

## User Stories

### Authentication & Household

1. As a user, I want to sign in with my Google account, so that I don't have to remember a separate password.
2. As a first-time user, I want to create a household and set my display name, so that expenses can be attributed to me.
3. As a household owner, I want to invite my spouse via a link, so that they join my household without me manually configuring their account.
4. As a spouse receiving an invite, I want to click a link, sign in with Google, and immediately land in the shared household, so that onboarding is frictionless.
5. As a signed-in user, I want to be redirected away from the sign-in page automatically, so that I don't have to navigate manually after login.
6. As a user who closes and reopens the browser, I want to remain signed in, so that I don't re-authenticate every session.
7. As a user, I want my data protected so that no one outside my household can see or modify our finances.

### Month Management

8. As a user, I want to see a sidebar listing all my budget months in chronological order, so that I can navigate between them.
9. As a user, I want to create a new month, so that I can start planning next month's budget.
10. As a user, I want the sidebar to show the selected month highlighted, so that I always know which month I'm viewing.
11. As a user, I want to collapse the sidebar to gain more screen space for the budget view, so that I can focus on the data.
12. As a user, I want each month to display a user count indicator showing how many members have contributed, so that I get a quick activity signal.

### Income Sources

13. As a user, I want to add income sources to a month (e.g., "Wife Payroll — BDO — 1st Half — 40,000"), so that I can track where money comes from.
14. As a user, I want each source to specify which half it belongs to (1st half, 2nd half, or both), so that sources align with salary schedules.
15. As a user, I want to see the remaining balance of each source (original balance minus payments drawn from it), so that I know how much is left to allocate.
16. As a user, I want to edit a source's name, type, account label, half, and balance, so that I can correct mistakes.
17. As a user, I want to delete a source, so that I can remove ones added in error.
18. As a user, I want sources categorised by type (Salary, Debt Collected, Savings Withdrawal), so that the origin of money is clear.

### Expenses

19. As a user, I want to add an expense with a name, category, half, budgeted amount, assigned source, and optional tag, so that I can plan spending.
20. As a user, I want to assign an expense to a category (Bills, Food, Utilities, Home, Travel, Health, Education, Other), so that spending is grouped logically.
21. As a user, I want to tag an expense as Needs, Wants, Savings, Investment, or Business, so that I can track alignment with the 50/30/20 rule.
22. As a user, I want to edit any field on an existing expense, so that I can adjust as plans change.
23. As a user, I want to delete an expense, with a confirmation dialog, so that I don't accidentally remove data.
24. As a user, I want to see expenses grouped by category in either a grid (card) or list view, so that I can choose the visualisation I prefer.
25. As a user, I want to toggle between grid and list views and have my preference remembered, so that I don't re-select every time.
26. As a user, I want to drill into a category to see all expenses within it, so that I can inspect individual items.
27. As a user, I want a breadcrumb trail ("All Categories > Food") when drilling into a category, so that I can navigate back easily.

### Half Views & Overview

28. As a user, I want a segmented control to switch between "All", "1st Half", and "2nd Half" views, so that I can focus on one salary period.
29. As a user, I want each half segment to show the salary amount beside its label, so that I see the budget envelope at a glance.
30. As a user, I want summary cards showing: total income, total budgeted, total paid, remaining, and a budget utilisation bar, so that I get a dashboard-level view.
31. As a user, I want the "Remaining" card to turn red when the budget is overspent, so that I get a visual warning.
32. As a user, I want to set a monthly budget target and see a progress bar against it, so that I can track against a goal.
33. As a user, I want a per-half breakdown (income vs. expenses vs. remaining per half) shown side by side, so that I can compare the two salary periods.

### Payments

34. As a user, I want to record a payment against an expense (date, amount, source used, optional note), so that I can track what's actually been paid.
35. As a user, I want to record multiple partial payments for a single expense, so that I can handle instalments.
36. As a user, I want each payment to deduct from the source's remaining balance, so that available funds are always accurate.
37. As a user, I want to see a status pill on each expense row (Paid / Partial / Unpaid) based on payments vs. budgeted amount, so that I can scan payment progress.
38. As a user, I want to click the status pill to open a payments detail modal showing all payments and a form to add another, so that payment management is accessible inline.
39. As a user, I want to delete an individual payment record, so that I can correct mistakes.
40. As a user, I want to see a total paid / total due / remaining strip in the payments modal, so that I know the payment position.

### Carry-Overs

41. As a user, I want to create a carry-over item that records a deficit from a prior period (origin label, amount, assigned source), so that shortfalls are tracked explicitly.
42. As a user, I want to assign multiple sources to cover a single deficit (split across carry-over items), so that I can spread the shortfall.
43. As a user, I want carry-over amounts to pre-deduct from the assigned source's effective remaining balance, so that I don't double-allocate money.
44. As a user, I want to resolve a carry-over item individually (marking it as paid), so that I can clear debts one by one.
45. As a user, I want a "Resolve All" button when there are 2+ pending carry-overs, so that I can clear them in bulk at the end of a period.
46. As a user, I want resolved carry-overs to remain visible (not hidden) with a struck-through style and the resolution date, so that I have a history.
47. As a user, I want an amber warning banner at the top of the budget view when there are pending carry-overs, showing the origin and total amount, so that I'm immediately aware of outstanding debts.

### Recurring Expense Templates

48. As a user, I want to create a recurring expense template (name, category, half, default amount, default source name, tag, cadence), so that monthly bills are pre-defined.
49. As a user, I want to set a template's cadence to monthly, quarterly, or yearly, so that non-monthly recurring costs (car insurance, annual subscriptions) are also handled.
50. As a user, I want to activate or deactivate a template, so that I can pause recurring items without deleting them.
51. As a user, I want to edit or delete a template, so that I can adjust when costs change.
52. As a user, I want templates auto-generated into a new month when I create it, so that I don't manually add 10+ recurring expenses every month.
53. As a user, I want a toast notification after month creation telling me how many recurring expenses were generated, so that I can review and adjust amounts.
54. As a user, I want generated expenses to match the template's source by name to the closest source in the new month, so that source assignment is approximately correct without manual work.
55. As a user, I want a dedicated "Recurring Templates" page accessible from the sidebar or header, so that I can manage templates outside the monthly context.

### Statistics

56. As a user, I want a donut chart showing spending breakdown by category, with a legend listing each category's amount and percentage, so that I can see where money goes.
57. As a user, I want a donut chart showing spending breakdown by tag (Needs/Wants/Savings/etc.), so that I can evaluate my 50/30/20 alignment.
58. As a user, I want a horizontal bar chart comparing spending across categories, so that I can visually rank spending areas.
59. As a user, I want summary cards at the top of the statistics page (total income, total expenses, net remaining), so that I get headline numbers.
60. As a user, I want statistics to reflect the currently selected month, so that the data is contextually relevant.

### General UX

61. As a user, I want a toast notification for save, delete, and error actions, so that I get feedback on my actions.
62. As a user, I want empty states (no months, no expenses, no sources) to show helpful prompts, so that I know what to do next.
63. As a user, I want amounts formatted in Philippine Peso (e.g., "P 40,000") throughout the app, so that the currency is clear.
64. As a user, I want row actions (edit, delete) to appear on hover in expense tables, so that the table stays clean.
65. As a user, I want confirmation dialogs before destructive actions (delete expense, delete source, delete month), so that I don't lose data accidentally.
66. As a user, I want the app to load quickly and show skeleton states while data is fetching, so that the UI feels responsive.
67. As a user, I want to know who created each expense and when, so that there's basic attribution in our shared household.

---

## Implementation Decisions

### Architecture

- **No custom backend.** The React app communicates directly with Supabase using `@supabase/supabase-js`. Row-level security (RLS) policies on Postgres enforce data isolation per household.
- **Household model.** A `households` table with a `household_members` join table. All data tables (months, sources, expenses, payments, carry_overs, recurring templates) are scoped to a household. RLS policies use a `user_household_ids(auth.uid())` helper function.
- **Auth.** Google OAuth via Supabase Auth. Session persists in the browser; `AuthGate` component redirects unauthenticated users.
- **Invite flow.** Household owner generates an invite code/link. Spouse signs in with Google, provides the invite code, and is added to `household_members`.

### Data Model

- **Months** are scoped to a household with a unique constraint on `(household_id, year, month_num)`. Each month stores `half1_salary_date` and `half2_salary_date` as text.
- **Sources** belong to a month. Each source has a `half` field (`half1` | `half2` | `both`) and a `balance` (the starting amount). Remaining balance is computed at query time: `balance - sum(payments against this source)`.
- **Expenses** belong to a month. Each expense has a `half`, a `source_id` (intended source), and a `tag`. Budgeted `amount` is stored directly on the expense.
- **Payments** belong to an expense. Each payment has its own `source_id` (actual source used, which may differ from the expense's intended source), `amount`, `paid_on` date, and `note`.
- **Carry-overs** belong to a month. One deficit can produce multiple carry-over items (one per source allocation). Each has a `resolved_at` timestamp (null = pending). Carry-over amounts are subtracted from the assigned source's effective remaining balance.
- **Recurring expense templates** belong to a household (not a month). Each template has a `cadence` (`monthly` | `quarterly` | `yearly`), `active` flag, and `start_year_month`. When a new month is created, templates whose cadence applies are materialised as expense rows. Source matching is by name (best-effort).

### Schema shape (from prototype)

The prototype's data model provides the decision-rich type shapes:

```typescript
// Expense: belongs to one half, one source, optional tag
{ id, name, category, half: "half1"|"half2", amount, sourceId, tag, payments[] }

// Source: income for a specific half or both
{ id, name, type: "salary"|"debt_collected"|"savings_withdrawal", accountLabel, half: "half1"|"half2"|"both", balance }

// Carry-over: deficit assigned to a source in the current month
{ id, from: "prev_month"|"half1"|"half2", fromLabel, amount, sourceId, resolvedAt }

// Tags: 50/30/20 philosophy
"needs" | "wants" | "savings" | "investment" | "business"

// Categories
"Bills" | "Food" | "Utilities" | "Home" | "Travel" | "Health" | "Education" | "Other"
```

### Modules

| Module | Responsibility |
|---|---|
| `auth` | Google OAuth sign-in/out, session hook, route guard |
| `household` | Household CRUD, member management, invite flow |
| `months` | Month CRUD, listing, template generation on create |
| `budget-engine` | Pure math: source remaining, expense totals/status, carry-over effective balances. Stateless functions. |
| `sources` | Source CRUD per month |
| `expenses` | Expense + payment CRUD, tag assignment |
| `carry-overs` | Carry-over CRUD, resolve/resolve-all, deficit assignment |
| `recurring-templates` | Template CRUD, generate-into-month logic |
| `statistics` | Read-only aggregation functions (by-category, by-tag, by-half) |
| `ui` | Shared presentational components (Modal, Button, Toast, Pill, StatusPill) |

`budget-engine` and `statistics` are the deepest modules — pure functions, no side effects, testable without any React or Supabase dependencies.

### Tech Stack

- **Runtime/package manager:** Bun (LTS)
- **Build:** Vite
- **Language:** TypeScript (migrated from prototype's JavaScript)
- **Styling:** Tailwind CSS (migrated from prototype's handwritten CSS). Custom theme mirrors the prototype's `--linen` / `--ink` / `--green` / `--red` / `--amber` / `--blue` palette.
- **State:** React `useState` + Context. No external state library in phase 1.
- **Backend:** Supabase (Postgres + Auth + JS client). Types auto-generated from schema.
- **Hosting:** Vercel (free tier, auto-deploy from GitHub).

### Routing

React Router with these paths:
- `/sign-in`
- `/setup` (first-run household creation)
- `/month/:year-:month/overview`
- `/month/:year-:month/half/:half`
- `/month/:year-:month/half/:half/category/:cat`
- `/recurring`
- `/statistics`

### Concurrency

Phase 1 is one-driver-one-watcher (no realtime sync). Standard REST-style reads/writes via Supabase client. All tables include `updated_at` columns to enable conflict detection when realtime is added in phase 2.

### Currency

All amounts in Philippine Peso. Single currency — no multi-currency support. Formatted as `"P XX,XXX.XX"` using `toLocaleString("en-PH")`.

---

## Testing Decisions

### What makes a good test

Tests should verify **external behaviour through the module's public interface**, not implementation details. A test should break only when the module's contract changes, not when internals are refactored. Tests should use realistic data shapes (matching the Postgres schema types) and cover edge cases that represent real-world financial scenarios (overpayment, zero balances, partial payments, empty months).

### Modules to test

All modules will have automated tests. Priority and approach by module:

| Module | Test type | Key scenarios |
|---|---|---|
| `budget-engine` | Unit (pure functions) | Source remaining with multiple payments across expenses; expense status transitions (unpaid → partial → paid → overpaid); carry-over deduction from effective balance; zero-balance sources; expenses with no payments; multiple sources for same half |
| `statistics` | Unit (pure functions) | Category/tag percentage rounding (must sum to 100%); empty month produces zero totals; single-category month; expenses with no tags |
| `recurring-templates` | Unit (generation logic) | Monthly template generates every month; quarterly generates on correct months; yearly generates once; inactive templates skipped; start_year_month respected; source name matching (exact match, no match fallback) |
| `carry-overs` | Unit (resolve logic + math) | Resolve single item sets timestamp; resolve-all clears all pending; effective remaining subtracts unresolved carry-overs; resolved carry-overs don't affect balance; multi-source deficit allocation sums correctly |
| `expenses` | Integration (Supabase) | CRUD operations persist and return correct data; payment creation decrements source remaining; deleting a payment restores source balance; category filtering returns correct subset |
| `sources` | Integration (Supabase) | CRUD operations; half-filtering; balance never goes negative in display (even if overpaid) |
| `months` | Integration (Supabase) | Create month with template generation; unique constraint on duplicate month; listing returns household-scoped months only |
| `auth` | Integration (Supabase Auth) | Sign-in redirects correctly; session persists; unauthenticated access redirected to sign-in |
| `household` | Integration (Supabase) | Create household + member; invite acceptance adds second member; RLS prevents cross-household access |
| `ui` | Component (React Testing Library) | Modal opens/closes; Toast auto-dismisses; StatusPill renders correct variant for each status |

### Prior art

The prototype has no tests. Test infrastructure will be set up fresh with **Vitest** (matches Vite ecosystem, works with Bun) and **React Testing Library** for component tests. Integration tests use a Supabase test project or local Supabase CLI instance.

---

## Out of Scope

The following are explicitly **not** part of this PRD (phase 1):

- **Realtime sync** between devices (phase 2)
- **Mobile-responsive layouts**, PWA install, service worker (phase 2)
- **Native iOS / Android apps** via React Native (phase 3)
- **Bill-due reminders** and push/email notifications (phase 2/3)
- **Bank integrations** (GCash, Maya, BDO API connections)
- **CSV / spreadsheet import** of historical data
- **Multi-currency** support
- **Detailed audit history** beyond `created_by` and `created_at` columns
- **Role-based permissions** (both users are equal owners in phase 1)
- **Recurring source templates** (sources are cloned manually or from prior month; revisit if painful)
- **Auto-detection of carry-over deficits** from prior month (carry-overs entered manually in phase 1)
- **Offline-first / local caching** (requires service worker and sync engine)
- **Year-over-year statistics** or multi-month trend reports
- **Dark mode** or theme customisation

---

## Further Notes

- **Prototype reference.** The existing prototype at `family-budget/src/App.jsx` (~2,776 lines) serves as the definitive visual design spec. When porting components, match the prototype's rendering pixel-for-pixel, but restructure code into the module/component hierarchy described above.
- **Tailwind migration.** The prototype uses ~375 lines of handwritten CSS with CSS custom properties (`--linen`, `--ink`, `--green`, etc.). The Tailwind config must extend the theme to include these exact colour values and font families so that utility classes produce identical output. A side-by-side visual comparison against the running prototype (http://localhost:5174/) should be performed during porting.
- **Seed data.** The prototype includes a rich seed month (May 2026) with 5 sources, 12 expenses, 2 carry-overs, and several payments. This seed data should be reproducible via a development seed script for testing and demos.
- **Phase 2 prep.** All tables include `updated_at` columns from day one. The `budget-engine` module is kept as pure functions (no React dependency) so it can be reused in React Native in phase 3.
- **Weekly meeting workflow.** The primary use case is a couple sitting together weekly, with one person driving the laptop while the other watches. This means performance under concurrent writes is not a phase 1 concern, but the UX should feel snappy for single-user interaction (optimistic UI updates where safe).
