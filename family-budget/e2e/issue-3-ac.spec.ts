import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
// Service role key — acceptable for local test teardown only
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";

// Before the suite, remove any months left over from prior test runs (keep only seed)
test.beforeAll(async () => {
  await fetch(
    `${SUPABASE_URL}/rest/v1/months?id=neq.${SEED_MONTH_ID}`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    }
  );
});

// Helper: wait for sidebar months to load from Supabase
async function waitForMonthsLoaded(page: import("@playwright/test").Page) {
  await expect(page.locator('[data-testid="month-item-2026-5"]')).toBeVisible({ timeout: 10_000 });
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/month\/2026-5\/overview/);
  await waitForMonthsLoaded(page);
});

// AC: Sidebar lists months in chronological order with month icon, name, and sub-label
test("sidebar lists May 2026 with icon, name, and member sub-label", async ({ page }) => {
  const monthItem = page.locator('[data-testid="month-item-2026-5"]');
  await expect(monthItem).toBeVisible();

  // Month icon shows 3-letter abbreviation
  const icon = page.locator('[data-testid="month-icon-2026-5"]');
  await expect(icon).toBeVisible();
  await expect(icon).toHaveText("MAY");

  // Month name label shows "May 2026"
  const label = page.locator('[data-testid="month-label-2026-5"]');
  await expect(label).toBeVisible();
  await expect(label).toContainText("May 2026");

  // Sub-label shows member count
  const subLabel = page.locator('[data-testid="month-sublabel-2026-5"]');
  await expect(subLabel).toBeVisible();
  await expect(subLabel).toContainText("member");
});

// AC: Clicking a month navigates to /month/:year-:month/overview and highlights it as active
test("clicking a month navigates to its overview and highlights it", async ({ page }) => {
  // The app starts on 2026-5/overview so it should already be active
  await expect(page).toHaveURL(/\/month\/2026-5\/overview/);

  // The month item should be visually highlighted (has active background)
  const monthItem = page.locator('[data-testid="month-item-2026-5"]');
  await expect(monthItem).toBeVisible();

  // Navigate away first
  await page.goto("/recurring");
  await expect(page).toHaveURL("/recurring");

  // Click May 2026 in sidebar
  await page.locator('[data-testid="month-item-2026-5"]').click();

  // Should navigate to the month overview
  await expect(page).toHaveURL(/\/month\/2026-5\/overview/);

  // Month item should now be highlighted (check border-left style is active)
  const active = page.locator('[data-testid="month-item-2026-5"]');
  await expect(active).toBeVisible();
  // Verify the active state by checking icon background changed (ink color in active state)
  const icon = page.locator('[data-testid="month-icon-2026-5"]');
  const bg = await icon.evaluate((el) => (el as HTMLElement).style.background);
  expect(bg).toContain("var(--color-ink)");
});

// AC: "Add month" button opens a picker and creates a new month in Postgres
test("Add month button opens picker and creates a new month", async ({ page }) => {
  // The "+" button should be visible
  const addBtn = page.locator('[data-testid="add-month-btn"]');
  await expect(addBtn).toBeVisible();

  // Click it to open the modal
  await addBtn.click();

  // Modal should appear with year and month selects
  await expect(page.locator('role=dialog')).toBeVisible();
  await expect(page.locator('[data-testid="add-month-year"]')).toBeVisible();
  await expect(page.locator('[data-testid="add-month-month"]')).toBeVisible();

  // Select June 2026
  await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  await page.locator('[data-testid="add-month-month"]').selectOption("6");

  // Submit the form
  await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();

  // Modal should close and new month should appear in sidebar
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="month-item-2026-6"]')).toBeVisible({ timeout: 10_000 });

  // Month icon should show "JUN"
  await expect(page.locator('[data-testid="month-icon-2026-6"]')).toHaveText("JUN");
  await expect(page.locator('[data-testid="month-label-2026-6"]')).toContainText("June 2026");
});

// AC: Sidebar collapses to icon-only mode with tooltips on hover
test("sidebar collapses to icon-only mode with tooltip on hover", async ({ page }) => {
  const sidebar = page.locator('[data-testid="sidebar"]');

  // Get initial width (expanded)
  const expandedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);

  // Collapse the sidebar
  await page.click('button[aria-label="Collapse sidebar"]');

  // Wait for transition
  await page.waitForTimeout(350);

  // Sidebar should be narrower (collapsed)
  const collapsedWidth = await sidebar.evaluate((el) => el.getBoundingClientRect().width);
  expect(collapsedWidth).toBeLessThan(expandedWidth);

  // Month name labels should be invisible (opacity 0) but icon still present
  const icon = page.locator('[data-testid="month-icon-2026-5"]');
  await expect(icon).toBeVisible();

  // The month item link should have a tooltip (title attribute)
  const monthLink = page.locator('[data-testid="month-item-2026-5"]');
  const title = await monthLink.getAttribute("title");
  expect(title).toBeTruthy();
  expect(title).toContain("May 2026");

  // Expand again
  await page.click('button[aria-label="Expand sidebar"]');
  await page.waitForTimeout(350);

  // After expanding, label is visible again
  await expect(page.locator('[data-testid="month-label-2026-5"]')).toBeVisible();
});

// AC: Unique constraint prevents duplicate months
test("creating a duplicate month shows an error", async ({ page }) => {
  // Open add month modal
  await page.locator('[data-testid="add-month-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();

  // Try to add May 2026 again (already exists from seed)
  await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  await page.locator('[data-testid="add-month-month"]').selectOption("5");

  // Submit
  await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();

  // Should show duplicate error message
  await expect(page.locator('[data-testid="add-month-error"]')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="add-month-error"]')).toContainText(/already exists/i);
});

// AC: User count indicator shows on each month item
test("user count indicator is visible on each month item", async ({ page }) => {
  const userCount = page.locator('[data-testid="month-user-count-2026-5"]');
  await expect(userCount).toBeVisible();
  // Should contain a number (the member count)
  const text = await userCount.textContent();
  expect(text).toMatch(/👥\s*\d+/);
});

// AC: Months are read/written via Supabase client against local Postgres
test("months persist after page reload (Supabase-backed)", async ({ page }) => {
  // First create a new month (July 2026)
  await page.locator('[data-testid="add-month-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  await page.locator('[data-testid="add-month-month"]').selectOption("7");
  await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();
  await expect(page.locator('[data-testid="month-item-2026-7"]')).toBeVisible({ timeout: 10_000 });

  // Reload the page
  await page.reload();
  await waitForMonthsLoaded(page);

  // The created month should still be there (persisted in Postgres)
  await expect(page.locator('[data-testid="month-item-2026-7"]')).toBeVisible({ timeout: 10_000 });
});

// AC: May 2026 seed data visible on first load
test("May 2026 seed data is visible on first load", async ({ page }) => {
  // Already done in beforeEach, just verify explicitly
  await expect(page.locator('[data-testid="month-item-2026-5"]')).toBeVisible();
  await expect(page.locator('[data-testid="month-label-2026-5"]')).toContainText("May 2026");
  await expect(page.locator('[data-testid="month-icon-2026-5"]')).toHaveText("MAY");
});

// AC: Months in chronological order
test("months are listed in chronological order", async ({ page }) => {
  // Create August 2025 (before May 2026) and August 2026 (after May 2026)
  // First create August 2026
  await page.locator('[data-testid="add-month-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  await page.locator('[data-testid="add-month-month"]').selectOption("8");
  await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="month-item-2026-8"]')).toBeVisible({ timeout: 10_000 });

  // Now create January 2026 (before May 2026)
  await page.locator('[data-testid="add-month-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();
  await page.locator('[data-testid="add-month-year"]').selectOption("2026");
  await page.locator('[data-testid="add-month-month"]').selectOption("1");
  await page.locator('[data-testid="add-month-form"]').getByRole("button", { name: /add month/i }).click();
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="month-item-2026-1"]')).toBeVisible({ timeout: 10_000 });

  // Get all month items and verify they are in chronological order
  const monthItems = page.locator('[data-testid^="month-item-"]');
  const count = await monthItems.count();
  expect(count).toBeGreaterThanOrEqual(3);

  // Verify Jan 2026 appears before May 2026, which appears before Aug 2026
  const allItems = await monthItems.all();
  const testIds: string[] = [];
  for (const item of allItems) {
    const testId = await item.getAttribute("data-testid");
    if (testId) testIds.push(testId);
  }

  const jan = testIds.indexOf("month-item-2026-1");
  const may = testIds.indexOf("month-item-2026-5");
  const aug = testIds.indexOf("month-item-2026-8");

  expect(jan).toBeGreaterThanOrEqual(0);
  expect(may).toBeGreaterThanOrEqual(0);
  expect(aug).toBeGreaterThanOrEqual(0);
  expect(jan).toBeLessThan(may);
  expect(may).toBeLessThan(aug);
});
