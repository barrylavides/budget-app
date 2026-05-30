# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-3-ac.spec.ts >> Add month button opens picker and creates a new month
- Location: e2e/issue-3-ac.spec.ts:85:0

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="month-item-2026-5"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "to.be.visible" with timeout 10000ms
  - waiting for locator('[data-testid="month-item-2026-5"]')

```

```yaml
- banner: FB FamilyBudget Expense Tracker Phase 1
- complementary:
  - text: Months
  - button "Add month": +
  - button "Collapse sidebar": ←
  - link "↻ Recurring":
    - /url: /recurring
  - link "◎ Statistics":
    - /url: /statistics
- main:
  - text: Overview
  - heading "May 2026" [level=1]
  - button "All"
  - button "1st Half"
  - button "2nd Half"
  - text: Income Sources
  - button "+ Add"
  - text: No income sources yet. Add one to get started.
```

# Test source

```ts
  1   | import { test, expect } from "@playwright/test";
  2   | 
  3   | const SUPABASE_URL = "http://127.0.0.1:54321";
  4   | // Service role key — acceptable for local test teardown only
  5   | const SERVICE_ROLE_KEY =
  6   |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  7   | const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";
  8   | 
  9   | // Before the suite, remove any months left over from prior test runs (keep only seed)
  10  | test.beforeAll(async () => {
  11  |   await fetch(
  12  |     `${SUPABASE_URL}/rest/v1/months?id=neq.${SEED_MONTH_ID}`,
  13  |     {
  14  |       method: "DELETE",
  15  |       headers: {
  16  |         apikey: SERVICE_ROLE_KEY,
  17  |         Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  18  |         Prefer: "return=minimal",
  19  |       },
  20  |     }
  21  |   );
  22  | });
  23  | 
  24  | // Helper: wait for sidebar months to load from Supabase
  25  | async function waitForMonthsLoaded(page: import("@playwright/test").Page) {
> 26  |   await expect(page.locator('[data-testid="month-item-2026-5"]')).toBeVisible({ timeout: 10_000 });
      |                                                                  ^ Error: expect(locator).toBeVisible() failed
  27  | }
  28  | 
  29  | test.beforeEach(async ({ page }) => {
  30  |   await page.goto("/");
  31  |   await expect(page).toHaveURL(/\/month\/2026-5\/overview/);
  32  |   await waitForMonthsLoaded(page);
  33  | });
  34  | 
  35  | // AC: Sidebar lists months in chronological order with month icon, name, and sub-label
  36  | test("sidebar lists May 2026 with icon, name, and member sub-label", async ({ page }) => {
  37  |   const monthItem = page.locator('[data-testid="month-item-2026-5"]');
  38  |   await expect(monthItem).toBeVisible();
  39  | 
  40  |   // Month icon shows 3-letter abbreviation
  41  |   const icon = page.locator('[data-testid="month-icon-2026-5"]');
  42  |   await expect(icon).toBeVisible();
  43  |   await expect(icon).toHaveText("MAY");
  44  | 
  45  |   // Month name label shows "May 2026"
  46  |   const label = page.locator('[data-testid="month-label-2026-5"]');
  47  |   await expect(label).toBeVisible();
  48  |   await expect(label).toContainText("May 2026");
  49  | 
  50  |   // Sub-label shows member count
  51  |   const subLabel = page.locator('[data-testid="month-sublabel-2026-5"]');
  52  |   await expect(subLabel).toBeVisible();
  53  |   await expect(subLabel).toContainText("member");
  54  | });
  55  | 
  56  | // AC: Clicking a month navigates to /month/:year-:month/overview and highlights it as active
  57  | test("clicking a month navigates to its overview and highlights it", async ({ page }) => {
  58  |   // The app starts on 2026-5/overview so it should already be active
  59  |   await expect(page).toHaveURL(/\/month\/2026-5\/overview/);
  60  | 
  61  |   // The month item should be visually highlighted (has active background)
  62  |   const monthItem = page.locator('[data-testid="month-item-2026-5"]');
  63  |   await expect(monthItem).toBeVisible();
  64  | 
  65  |   // Navigate away first
  66  |   await page.goto("/recurring");
  67  |   await expect(page).toHaveURL("/recurring");
  68  | 
  69  |   // Click May 2026 in sidebar
  70  |   await page.locator('[data-testid="month-item-2026-5"]').click();
  71  | 
  72  |   // Should navigate to the month overview
  73  |   await expect(page).toHaveURL(/\/month\/2026-5\/overview/);
  74  | 
  75  |   // Month item should now be highlighted (check border-left style is active)
  76  |   const active = page.locator('[data-testid="month-item-2026-5"]');
  77  |   await expect(active).toBeVisible();
  78  |   // Verify the active state by checking icon background changed (ink color in active state)
  79  |   const icon = page.locator('[data-testid="month-icon-2026-5"]');
  80  |   const bg = await icon.evaluate((el) => (el as HTMLElement).style.background);
  81  |   expect(bg).toContain("var(--color-ink)");
  82  | });
  83  | 
  84  | // AC: "Add month" button opens a picker and creates a new month in Postgres
  85  | test("Add month button opens picker and creates a new month", async ({ page }) => {
  86  |   // The "+" button should be visible
  87  |   const addBtn = page.locator('[data-testid="add-month-btn"]');
  88  |   await expect(addBtn).toBeVisible();
  89  | 
  90  |   // Click it to open the modal
  91  |   await addBtn.click();
  92  | 
  93  |   // Modal should appear with year and month selects
  94  |   await expect(page.locator('role=dialog')).toBeVisible();
  95  |   await expect(page.locator('[data-testid="add-month-year"]')).toBeVisible();
  96  |   await expect(page.locator('[data-testid="add-month-month"]')).toBeVisible();
  97  | 
  98  |   // Select June 2026
  99  |   await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  100 |   await page.locator('[data-testid="add-month-month"]').selectOption("6");
  101 | 
  102 |   // Submit the form
  103 |   await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();
  104 | 
  105 |   // Modal should close and new month should appear in sidebar
  106 |   await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  107 |   await expect(page.locator('[data-testid="month-item-2026-6"]')).toBeVisible({ timeout: 10_000 });
  108 | 
  109 |   // Month icon should show "JUN"
  110 |   await expect(page.locator('[data-testid="month-icon-2026-6"]')).toHaveText("JUN");
  111 |   await expect(page.locator('[data-testid="month-label-2026-6"]')).toContainText("June 2026");
  112 | });
  113 | 
  114 | // AC: Sidebar collapses to icon-only mode with tooltips on hover
  115 | test("sidebar collapses to icon-only mode with tooltip on hover", async ({ page }) => {
  116 |   const sidebar = page.locator('[data-testid="sidebar"]');
  117 | 
  118 |   // Get initial width (expanded)
  119 |   const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
  120 | 
  121 |   // Collapse the sidebar
  122 |   await page.click('button[aria-label="Collapse sidebar"]');
  123 | 
  124 |   // Wait for transition
  125 |   await page.waitForTimeout(350);
  126 | 
```