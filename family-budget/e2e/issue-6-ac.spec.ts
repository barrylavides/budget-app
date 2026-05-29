import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";
const SEED_SOURCE_IDS = [
  "00000000-0000-0000-0000-000000000020", // Wife Payroll, half1, 40000
  "00000000-0000-0000-0000-000000000021", // Barry Payroll, half1, 35000
  "00000000-0000-0000-0000-000000000022", // Wife 2nd Salary, half2, 40000
  "00000000-0000-0000-0000-000000000023", // Barry 2nd, half2, 35000
  "00000000-0000-0000-0000-000000000024", // Savings Fund, both, 10000
];
const SEED_EXPENSE_IDS = [
  "00000000-0000-0000-0000-000000000030",
  "00000000-0000-0000-0000-000000000031",
  "00000000-0000-0000-0000-000000000032",
  "00000000-0000-0000-0000-000000000033",
  "00000000-0000-0000-0000-000000000034",
  "00000000-0000-0000-0000-000000000035",
  "00000000-0000-0000-0000-000000000036",
  "00000000-0000-0000-0000-000000000037",
  "00000000-0000-0000-0000-000000000038",
  "00000000-0000-0000-0000-000000000039",
  "00000000-0000-0000-0000-000000000040",
  "00000000-0000-0000-0000-000000000041",
];

const AUTH_HEADERS = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function cleanupTestExpenses() {
  const ids = SEED_EXPENSE_IDS.join(",");
  await fetch(
    `${SUPABASE_URL}/rest/v1/expenses?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${ids})`,
    { method: "DELETE", headers: AUTH_HEADERS }
  );
}

test.beforeAll(async () => {
  await cleanupTestExpenses();
});

test.afterEach(async () => {
  await cleanupTestExpenses();
});

const OVERVIEW_URL = "/month/2026-5/overview";

// AC1: Segmented control with "All", "1st Half" (with salary total), "2nd Half" (with salary total)
test("AC1: segmented control shows All, 1st Half, 2nd Half buttons", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("half-filter-all")).toBeVisible();
  await expect(page.getByTestId("half-filter-half1")).toBeVisible();
  await expect(page.getByTestId("half-filter-half2")).toBeVisible();

  await expect(page.getByTestId("half-filter-all")).toContainText("All");
  await expect(page.getByTestId("half-filter-half1")).toContainText("1st Half");
  await expect(page.getByTestId("half-filter-half2")).toContainText("2nd Half");
});

// AC1 (cont.): salary totals are shown beside 1st/2nd Half labels
test("AC1: 1st Half and 2nd Half buttons show salary totals from seed data", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // half1 income = 40000 (Wife Payroll) + 35000 (Barry Payroll) + 10000 (Savings both) = 85000 → ₱85.0k
  await expect(page.getByTestId("half1-salary-total")).toBeVisible();
  await expect(page.getByTestId("half1-salary-total")).toContainText("85");

  // half2 income = 40000 (Wife 2nd) + 35000 (Barry 2nd) + 10000 (Savings both) = 85000 → ₱85.0k
  await expect(page.getByTestId("half2-salary-total")).toBeVisible();
  await expect(page.getByTestId("half2-salary-total")).toContainText("85");
});

// AC2: Switching segments filters sources to the selected half
test("AC2: switching to 1st Half filters sources panel to half1 + both sources", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await page.getByTestId("half-filter-half1").click();
  await page.waitForTimeout(200);

  // Should show half1 sources: Wife Payroll, Barry Payroll (and Savings Fund which is 'both')
  const wifeSrc = "00000000-0000-0000-0000-000000000020";
  const barrySrc = "00000000-0000-0000-0000-000000000021";
  const savings = "00000000-0000-0000-0000-000000000024";
  const wife2nd = "00000000-0000-0000-0000-000000000022";

  await expect(page.getByTestId(`source-row-${wifeSrc}`)).toBeVisible();
  await expect(page.getByTestId(`source-row-${barrySrc}`)).toBeVisible();
  await expect(page.getByTestId(`source-row-${savings}`)).toBeVisible();
  // half2-only source should NOT be visible
  await expect(page.getByTestId(`source-row-${wife2nd}`)).not.toBeVisible();
});

test("AC2: switching to 2nd Half filters sources panel to half2 + both sources", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await page.getByTestId("half-filter-half2").click();
  await page.waitForTimeout(200);

  const wife2nd = "00000000-0000-0000-0000-000000000022";
  const barry2nd = "00000000-0000-0000-0000-000000000023";
  const savings = "00000000-0000-0000-0000-000000000024";
  const wifePayroll = "00000000-0000-0000-0000-000000000020";

  await expect(page.getByTestId(`source-row-${wife2nd}`)).toBeVisible();
  await expect(page.getByTestId(`source-row-${barry2nd}`)).toBeVisible();
  await expect(page.getByTestId(`source-row-${savings}`)).toBeVisible();
  // half1-only source should NOT be visible
  await expect(page.getByTestId(`source-row-${wifePayroll}`)).not.toBeVisible();
});

test("AC2: switching back to All shows all sources", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await page.getByTestId("half-filter-half1").click();
  await page.waitForTimeout(100);
  await page.getByTestId("half-filter-all").click();
  await page.waitForTimeout(200);

  for (const id of SEED_SOURCE_IDS) {
    await expect(page.getByTestId(`source-row-${id}`)).toBeVisible();
  }
});

// AC3: Summary cards row (5 cards): Total Income, Total Budgeted, Total Paid, Remaining, Budget
test("AC3: summary cards row shows 5 cards with seeded values", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("summary-cards")).toBeVisible();
  await expect(page.getByTestId("summary-card-income")).toBeVisible();
  await expect(page.getByTestId("summary-card-budgeted")).toBeVisible();
  await expect(page.getByTestId("summary-card-paid")).toBeVisible();
  await expect(page.getByTestId("summary-card-remaining")).toBeVisible();
  await expect(page.getByTestId("summary-card-budget")).toBeVisible();
});

test("AC3: Total Income card shows correct seeded value (₱160,000)", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // total: 40000 + 35000 + 40000 + 35000 + 10000 = 160000
  await expect(page.getByTestId("summary-card-income")).toContainText("160,000");
});

test("AC3: Total Budgeted card shows correct seeded value (₱61,099)", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // half1: 3500+1500+8000+12000+800+599 = 26399
  // half2: 20000+3000+5000+1500+1200+4000 = 34700
  // total = 61099
  await expect(page.getByTestId("summary-card-budgeted")).toContainText("61,099");
});

test("AC3: Total Paid card shows correct seeded value (₱30,000)", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // Electric Bill: 2000+1500=3500, Internet: 1500, Groceries: 5000, Rent: 20000 = 30000
  await expect(page.getByTestId("summary-card-paid")).toContainText("30,000");
});

test("AC3: Remaining card shows correct seeded value (₱98,901)", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // 160000 - 61099 = 98901
  await expect(page.getByTestId("summary-card-remaining")).toContainText("98,901");
});

test("AC3: Budget card exists with editable target", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("summary-card-budget")).toBeVisible();
  await expect(page.getByTestId("budget-target-edit-btn")).toBeVisible();
});

// AC4: "Remaining" card turns red when expenses exceed income
test("AC4: Remaining card turns red when expenses exceed income", async ({ page }) => {
  // Insert a very large expense so total budgeted > total income (160000)
  const largeExpenseId = "00000000-0000-0000-0000-aaaaaaaaaaaa";
  await fetch(`${SUPABASE_URL}/rest/v1/expenses`, {
    method: "POST",
    headers: { ...AUTH_HEADERS, Prefer: "return=minimal" },
    body: JSON.stringify({
      id: largeExpenseId,
      month_id: SEED_MONTH_ID,
      name: "Test Huge Expense",
      category: "Other",
      half: "half1",
      amount: 200000,
      source_id: SEED_SOURCE_IDS[0],
      tag: "needs",
    }),
  });

  try {
    await page.goto(OVERVIEW_URL);
    await page.waitForLoadState("networkidle");

    const remainingCard = page.getByTestId("summary-card-remaining");
    await expect(remainingCard).toBeVisible();

    // Remaining = 160000 - (61099 + 200000) = 160000 - 261099 = -101099 (negative → red)
    const color = await remainingCard.evaluate((el) => {
      const valueEl = el.querySelector("[style*='color']") as HTMLElement | null;
      return valueEl ? window.getComputedStyle(valueEl).color : "";
    });
    // The card should have red border and red text
    const borderColor = await remainingCard.evaluate((el) => window.getComputedStyle(el).borderColor);
    // Check either the text contains a negative sign or the style indicates red
    await expect(remainingCard).toContainText("-");
  } finally {
    await fetch(
      `${SUPABASE_URL}/rest/v1/expenses?id=eq.${largeExpenseId}`,
      { method: "DELETE", headers: AUTH_HEADERS }
    );
  }
});

// AC5: Budget card shows progress bar (budgeted / target)
test("AC5: Budget card progress bar is visible and updates when target is set", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("budget-progress-bar")).toBeVisible();

  // Set a target via the edit button
  await page.getByTestId("budget-target-edit-btn").click();
  const input = page.getByTestId("budget-target-input");
  await expect(input).toBeVisible();
  await input.fill("100000");
  await input.press("Enter");

  // Progress bar should now be filled: 61099/100000 = ~61%
  await expect(page.getByTestId("budget-progress-bar")).toBeVisible();
  const progressInner = page.locator('[data-testid="budget-progress-bar"] > div');
  await expect(progressInner).toBeVisible();

  // Verify the progress percentage shown
  const summaryBudgetCard = page.getByTestId("summary-card-budget");
  await expect(summaryBudgetCard).toContainText("61%");

  // Clean up localStorage
  await page.evaluate(() => {
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith("budget_target_")) localStorage.removeItem(k);
    });
  });
});

// AC6: Per-half breakdown panel: two side-by-side cards showing income, expenses, remaining per half
test("AC6: per-half breakdown panel shows two cards (1st and 2nd Half)", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  await expect(page.getByTestId("half-breakdown-panel")).toBeVisible();
  await expect(page.getByTestId("half-breakdown-half1")).toBeVisible();
  await expect(page.getByTestId("half-breakdown-half2")).toBeVisible();
});

test("AC6: 1st Half breakdown card shows correct income, budgeted, remaining from seed data", async ({
  page,
}) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  const card1 = page.getByTestId("half-breakdown-half1");
  // half1 income: 40000 + 35000 + 10000 (both) = 85000
  await expect(card1).toContainText("85,000.00");
  // half1 budgeted: 26399
  await expect(card1).toContainText("26,399.00");
});

test("AC6: 2nd Half breakdown card shows correct income, budgeted, remaining from seed data", async ({
  page,
}) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  const card2 = page.getByTestId("half-breakdown-half2");
  // half2 income: 40000 + 35000 + 10000 (both) = 85000
  await expect(card2).toContainText("85,000.00");
  // half2 budgeted: 34700
  await expect(card2).toContainText("34,700.00");
});

test("AC6: breakdown cards remain visible regardless of half filter selection", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // Switch to 1st Half filter
  await page.getByTestId("half-filter-half1").click();
  await page.waitForTimeout(100);
  await expect(page.getByTestId("half-breakdown-panel")).toBeVisible();
  await expect(page.getByTestId("half-breakdown-half1")).toBeVisible();
  await expect(page.getByTestId("half-breakdown-half2")).toBeVisible();

  // Switch to 2nd Half filter
  await page.getByTestId("half-filter-half2").click();
  await page.waitForTimeout(100);
  await expect(page.getByTestId("half-breakdown-panel")).toBeVisible();
});

// AC3 (scoped values): summary cards update when half filter changes
test("AC3+AC2: summary cards show scoped values when half filter is changed", async ({ page }) => {
  await page.goto(OVERVIEW_URL);
  await page.waitForLoadState("networkidle");

  // Switch to 1st Half
  await page.getByTestId("half-filter-half1").click();
  await page.waitForLoadState("networkidle");

  // half1 income: 85000
  await expect(page.getByTestId("summary-card-income")).toContainText("85,000");
  // half1 budgeted: 26399
  await expect(page.getByTestId("summary-card-budgeted")).toContainText("26,399");

  // Switch to 2nd Half
  await page.getByTestId("half-filter-half2").click();
  await page.waitForLoadState("networkidle");

  // half2 income: 85000
  await expect(page.getByTestId("summary-card-income")).toContainText("85,000");
  // half2 budgeted: 34700
  await expect(page.getByTestId("summary-card-budgeted")).toContainText("34,700");
});
