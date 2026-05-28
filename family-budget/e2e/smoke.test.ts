import { test, expect } from "@playwright/test";

test("app renders without errors", async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto("/");

  // Should redirect to overview
  await expect(page).toHaveURL(/\/month\/2026-5\/overview/);

  // App shell renders
  await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();

  // Topbar renders
  await expect(page.locator('[data-testid="topbar"]')).toBeVisible();

  // Sidebar renders
  await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();

  // Content area renders
  await expect(page.locator('[data-testid="content-area"]')).toBeVisible();

  // Logo text visible
  await expect(page.getByText("FamilyBudget")).toBeVisible();

  // Badge renders
  await expect(page.locator('[data-testid="topbar-badge"]')).toBeVisible();

  // No console errors from app code (filter out expected Vite HMR noise)
  const appErrors = consoleErrors.filter(
    (e) => !e.includes("Refused to apply") && !e.includes("favicon")
  );
  expect(appErrors).toHaveLength(0);
});

test("sidebar navigation works", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/month\/2026-5\/overview/);

  // Navigate to Recurring
  await page.click('a[href="/recurring"]');
  await expect(page).toHaveURL("/recurring");
  await expect(page.getByText("Recurring Expenses")).toBeVisible();

  // Navigate to Statistics
  await page.click('a[href="/statistics"]');
  await expect(page).toHaveURL("/statistics");
  await expect(page.getByRole("heading", { name: "Statistics" })).toBeVisible();
});

test("sidebar collapse toggle works", async ({ page }) => {
  await page.goto("/");

  const sidebar = page.locator('[data-testid="sidebar"]');
  await expect(sidebar).toBeVisible();

  // Click collapse button
  await page.click('button[aria-label="Collapse sidebar"]');

  // Sidebar should still be visible but narrower
  await expect(sidebar).toBeVisible();

  // Expand again
  await page.click('button[aria-label="Expand sidebar"]');
  await expect(sidebar).toBeVisible();
});
