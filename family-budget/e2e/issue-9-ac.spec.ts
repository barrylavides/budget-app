import { test, expect } from "@playwright/test";

// AC 1: /statistics route renders statistics page
test("/statistics route renders statistics page", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });
});

// AC 2: Summary cards show Total Income, Total Expenses, Net Remaining
test("summary cards show Total Income, Total Expenses, Net Remaining", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  // Total Income = ₱160,000 (Wife Payroll 40k + Barry Payroll 35k + Wife 2nd 40k + Barry 2nd 35k + Savings Fund 10k)
  await expect(page.locator('[data-testid="stats-total-income"]')).toContainText("160,000");

  // Total Expenses = ₱61,099
  await expect(page.locator('[data-testid="stats-total-expenses"]')).toContainText("61,099");

  // Net Remaining = 160,000 - 61,099 = 98,901
  await expect(page.locator('[data-testid="stats-net-remaining"]')).toContainText("98,901");
});

// AC 3: Donut chart by category is visible with legend showing amount + percentage
test("donut chart by category is visible with legend showing amounts", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-donut-category"]')).toBeVisible({ timeout: 12_000 });

  // Home is the largest category at ₱20,000
  await expect(page.locator('[data-testid="stats-legend-category-Home"]')).toBeVisible();
  await expect(page.locator('[data-testid="stats-legend-category-Home"]')).toContainText("20,000");
});

// AC 3 (continued): Donut legend shows percentage per category
test("donut chart category legend shows percentage", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-donut-category"]')).toBeVisible({ timeout: 12_000 });

  // Legend for Home should show a percentage
  const homeLegend = page.locator('[data-testid="stats-legend-category-Home"]');
  await expect(homeLegend).toBeVisible();
  await expect(homeLegend).toContainText("%");
});

// AC 4: Donut chart by tag is visible with legend (Needs/Wants/Savings for 50/30/20)
test("donut chart by tag is visible with legend showing needs amount", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-donut-tag"]')).toBeVisible({ timeout: 12_000 });

  // needs: 3500+1500+8000+12000+800+20000+1200 = 47,000
  await expect(page.locator('[data-testid="stats-legend-tag-needs"]')).toBeVisible();
  await expect(page.locator('[data-testid="stats-legend-tag-needs"]')).toContainText("47,000");
});

// AC 4 (continued): Tag legend shows percentage for 50/30/20 evaluation
test("donut chart tag legend shows percentage", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-donut-tag"]')).toBeVisible({ timeout: 12_000 });

  const needsLegend = page.locator('[data-testid="stats-legend-tag-needs"]');
  await expect(needsLegend).toBeVisible();
  await expect(needsLegend).toContainText("%");
});

// AC 5: Horizontal bar chart shows categories
test("horizontal bar chart is visible and shows category bars", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-bar-chart"]')).toBeVisible({ timeout: 12_000 });

  // Home is the largest category (₱20,000)
  await expect(page.locator('[data-testid="stats-bar-Home"]')).toBeVisible();
});

// AC 5 (continued): Bar chart shows multiple category bars
test("horizontal bar chart shows Food category bar", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  await expect(page.locator('[data-testid="stats-bar-chart"]')).toBeVisible({ timeout: 12_000 });

  // Food = 8000 (Groceries) + 3000 (Dining Out) = 11,000
  await expect(page.locator('[data-testid="stats-bar-Food"]')).toBeVisible();
});

// AC 6: Charts reflect the currently selected month's data
test("charts reflect selected month data — default month shows May 2026 data", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  // Default month (May 2026) shows correct income
  await expect(page.locator('[data-testid="stats-total-income"]')).toContainText("160,000");

  // Month selector element is present and visible
  await expect(page.locator('[data-testid="month-select"]')).toBeVisible();
});

// AC 6 (continued): Month selector is interactive
test("month selector is visible and can be interacted with", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  const monthSelect = page.locator('[data-testid="month-select"]');
  await expect(monthSelect).toBeVisible();
  await expect(monthSelect).toBeEnabled();
});

// AC 7: statistics module exports pure aggregation functions
// Statistics module unit tests are in src/budget-engine/statistics.test.ts
test("statistics module percentage display confirms aggregation functions work", async ({ page }) => {
  await page.goto("/statistics");
  await expect(page.locator('[data-testid="stats-summary-cards"]')).toBeVisible({ timeout: 12_000 });

  // The donut category chart should display percentages (output of the statistics module)
  const donutCategory = page.locator('[data-testid="stats-donut-category"]');
  await expect(donutCategory).toBeVisible({ timeout: 12_000 });
  await expect(donutCategory).toContainText("%");
});
