import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";

// Seed source IDs
const WIFE_PAYROLL_ID   = "00000000-0000-0000-0000-000000000020"; // BDO, half1, balance=40000
const BARRY_PAYROLL_ID  = "00000000-0000-0000-0000-000000000021"; // BPI, half1, balance=35000
const WIFE_2ND_ID       = "00000000-0000-0000-0000-000000000022"; // BDO, half2, balance=40000
const BARRY_2ND_ID      = "00000000-0000-0000-0000-000000000023"; // BPI, half2, balance=35000
const SAVINGS_FUND_ID   = "00000000-0000-0000-0000-000000000024"; // CIMB, both, balance=10000

// Before each test suite, delete any sources created by prior tests (keep only seed sources)
test.beforeAll(async () => {
  await fetch(
    `${SUPABASE_URL}/rest/v1/sources?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${WIFE_PAYROLL_ID},${BARRY_PAYROLL_ID},${WIFE_2ND_ID},${BARRY_2ND_ID},${SAVINGS_FUND_ID})`,
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

test.afterEach(async () => {
  // Clean up any test-created sources (but keep seed sources)
  await fetch(
    `${SUPABASE_URL}/rest/v1/sources?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${WIFE_PAYROLL_ID},${BARRY_PAYROLL_ID},${WIFE_2ND_ID},${BARRY_2ND_ID},${SAVINGS_FUND_ID})`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    }
  );
  // Restore any seed sources that may have been updated/deleted during tests
  await fetch(`${SUPABASE_URL}/rest/v1/sources`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      { id: WIFE_PAYROLL_ID,  month_id: SEED_MONTH_ID, name: "Wife Payroll",    type: "salary",             account_label: "BDO",  half: "half1", balance: 40000 },
      { id: BARRY_PAYROLL_ID, month_id: SEED_MONTH_ID, name: "Barry Payroll",   type: "salary",             account_label: "BPI",  half: "half1", balance: 35000 },
      { id: WIFE_2ND_ID,      month_id: SEED_MONTH_ID, name: "Wife 2nd Salary", type: "salary",             account_label: "BDO",  half: "half2", balance: 40000 },
      { id: BARRY_2ND_ID,     month_id: SEED_MONTH_ID, name: "Barry 2nd",       type: "salary",             account_label: "BPI",  half: "half2", balance: 35000 },
      { id: SAVINGS_FUND_ID,  month_id: SEED_MONTH_ID, name: "Savings Fund",    type: "savings_withdrawal", account_label: "CIMB", half: "both",  balance: 10000 },
    ]),
  });
});

async function goToMonthOverview(page: import("@playwright/test").Page) {
  await page.goto("/month/2026-5/overview");
  await expect(page.locator('[data-testid="sources-panel"]')).toBeVisible({ timeout: 10_000 });
}

// AC: Sources panel renders within the month overview, matching prototype layout
test("sources panel renders within the month overview", async ({ page }) => {
  await goToMonthOverview(page);

  // Panel is visible
  const panel = page.locator('[data-testid="sources-panel"]');
  await expect(panel).toBeVisible();

  // All 5 seed sources should be listed
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();

  // Panel contains the "Add" button
  await expect(page.locator('[data-testid="add-source-btn"]')).toBeVisible();
});

// AC: "Add source" form: name, type (Salary/Debt Collected/Savings Withdrawal), account label, half (1st/2nd/Both), balance
test("Add source form has all required fields and creates a new source", async ({ page }) => {
  await goToMonthOverview(page);

  // Open the add modal
  await page.locator('[data-testid="add-source-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();

  // All form fields present
  await expect(page.locator('[data-testid="source-form-name"]')).toBeVisible();
  await expect(page.locator('[data-testid="source-form-type"]')).toBeVisible();
  await expect(page.locator('[data-testid="source-form-account-label"]')).toBeVisible();
  await expect(page.locator('[data-testid="source-form-half"]')).toBeVisible();
  await expect(page.locator('[data-testid="source-form-balance"]')).toBeVisible();

  // Type dropdown contains the 3 required options
  const typeSelect = page.locator('[data-testid="source-form-type"]');
  await expect(typeSelect.locator('option[value="salary"]')).toHaveText("Salary");
  await expect(typeSelect.locator('option[value="debt_collected"]')).toHaveText("Debt Collected");
  await expect(typeSelect.locator('option[value="savings_withdrawal"]')).toHaveText("Savings Withdrawal");

  // Half dropdown has 1st/2nd/Both options
  const halfSelect = page.locator('[data-testid="source-form-half"]');
  await expect(halfSelect.locator('option[value="half1"]')).toHaveText("1st Half");
  await expect(halfSelect.locator('option[value="half2"]')).toHaveText("2nd Half");
  await expect(halfSelect.locator('option[value="both"]')).toHaveText("Both");

  // Fill out the form
  await page.locator('[data-testid="source-form-name"]').fill("Test Bonus");
  await typeSelect.selectOption("debt_collected");
  await page.locator('[data-testid="source-form-account-label"]').fill("UnionBank");
  await halfSelect.selectOption("both");
  await page.locator('[data-testid="source-form-balance"]').fill("5000");

  // Submit
  await page.locator('role=dialog').getByRole("button", { name: /add source/i }).click();

  // Modal closes
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });

  // New source is visible in the list
  await expect(page.getByText("Test Bonus")).toBeVisible({ timeout: 5_000 });
});

// AC: Edit source inline or via modal
test("Edit source opens modal pre-filled and saves changes", async ({ page }) => {
  await goToMonthOverview(page);

  // Wait for sources to load
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });

  // Hover over Wife Payroll to reveal edit button
  await page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`).hover();

  // Edit button should appear
  const editBtn = page.locator(`[data-testid="source-edit-${WIFE_PAYROLL_ID}"]`);
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  // Edit modal opens
  await expect(page.locator('role=dialog')).toBeVisible();

  // Modal is pre-filled with current values
  await expect(page.locator('[data-testid="source-form-name"]')).toHaveValue("Wife Payroll");
  await expect(page.locator('[data-testid="source-form-account-label"]')).toHaveValue("BDO");

  // Change the name
  await page.locator('[data-testid="source-form-name"]').fill("Wife Salary Updated");

  // Save
  await page.locator('role=dialog').getByRole("button", { name: /save changes/i }).click();

  // Modal closes
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });

  // Updated name visible in the sources panel row
  await expect(page.locator(`[data-testid="source-name-${WIFE_PAYROLL_ID}"]`)).toHaveText("Wife Salary Updated", { timeout: 5_000 });
});

// AC: Delete source with confirmation
test("Delete source shows confirmation modal and removes the source", async ({ page }) => {
  await goToMonthOverview(page);

  // Wait for sources to load
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });

  // Hover over Barry Payroll
  await page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`).hover();

  // Delete button should appear
  const deleteBtn = page.locator(`[data-testid="source-delete-${BARRY_PAYROLL_ID}"]`);
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.click();

  // Confirmation modal opens
  await expect(page.locator('role=dialog')).toBeVisible();
  await expect(page.locator('role=dialog')).toContainText("Barry Payroll");
  await expect(page.locator('role=dialog')).toContainText("cannot be undone");

  // Confirm deletion
  await page.locator('[data-testid="confirm-delete-source"]').click();

  // Modal closes
  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });

  // Source is no longer in the list
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).not.toBeVisible({ timeout: 5_000 });
});

// AC: Sources display: icon by type, name, account label, half dot, balance
test("Sources display icon by type, name, account label, half dot, and balance", async ({ page }) => {
  await goToMonthOverview(page);

  // Wait for sources to load
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });

  // Wife Payroll (salary type, BDO, half1)
  const wifeName = page.locator(`[data-testid="source-name-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeName).toContainText("Wife Payroll");

  const wifeAccount = page.locator(`[data-testid="source-account-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeAccount).toContainText("BDO");

  // Type icon present (salary = 💵)
  const wifeIcon = page.locator(`[data-testid="source-icon-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeIcon).toBeVisible();
  await expect(wifeIcon).toContainText("💵");

  // Half indicator visible
  const wifeHalf = page.locator(`[data-testid="source-half-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeHalf).toBeVisible();
  await expect(wifeHalf).toContainText("1st");

  // Balance visible (Wife Payroll: 40000 - payments drawn from it)
  const wifeBalance = page.locator(`[data-testid="source-balance-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeBalance).toBeVisible();
  // Balance starts at 40000, payments: 2000 + 1500 + 1500 = 5000 drawn, so remaining = 35000
  await expect(wifeBalance).toContainText("₱");

  // Savings Fund (savings_withdrawal type, CIMB, both)
  const savingsIcon = page.locator(`[data-testid="source-icon-${SAVINGS_FUND_ID}"]`);
  await expect(savingsIcon).toContainText("🏦");

  const savingsHalf = page.locator(`[data-testid="source-half-${SAVINGS_FUND_ID}"]`);
  await expect(savingsHalf).toContainText("Both");
});

// AC: Sources filtered by half when viewing a specific half
test("Sources are filtered by half when 1st Half or 2nd Half filter is active", async ({ page }) => {
  await goToMonthOverview(page);

  // Wait for all 5 sources to load
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();

  // Apply 1st Half filter
  await page.locator('[data-testid="half-filter-half1"]').click();

  // half1 sources + "both" sources should be visible
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();

  // half2-only sources should be hidden
  await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).not.toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).not.toBeVisible();

  // Apply 2nd Half filter
  await page.locator('[data-testid="half-filter-half2"]').click();

  // half2 sources + "both" sources should be visible
  await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();

  // half1-only sources should be hidden
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).not.toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).not.toBeVisible();

  // Switch back to All
  await page.locator('[data-testid="half-filter-all"]').click();

  // All 5 sources visible again
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
});

// AC: budget-engine functions sourceRemaining(), sourcesTotal(), sourcesTotalAll() have unit tests
test("Budget-engine sourceRemaining correctly shows remaining balance minus payments", async ({ page }) => {
  await goToMonthOverview(page);

  // Wait for Wife Payroll to load
  await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });

  // Wife Payroll has balance 40000 and payments drawn from it:
  // 2000 (Electric Bill partial) + 1500 (Electric Bill final) + 1500 (Internet) = 5000 total drawn
  // So remaining should be 40000 - 5000 = 35000
  const wifeBalance = page.locator(`[data-testid="source-balance-${WIFE_PAYROLL_ID}"]`);
  await expect(wifeBalance).toContainText("35,000.00");

  // Barry Payroll: balance 35000, seed payment for Groceries has source_id=null so not deducted = 35000
  const barryBalance = page.locator(`[data-testid="source-balance-${BARRY_PAYROLL_ID}"]`);
  await expect(barryBalance).toContainText("35,000.00");

  // Wife 2nd Salary: balance 40000, payments: 20000 (Rent) = 40000 - 20000 = 20000
  const wife2ndBalance = page.locator(`[data-testid="source-balance-${WIFE_2ND_ID}"]`);
  await expect(wife2ndBalance).toContainText("20,000.00");

  // Savings Fund: balance 10000, no payments drawn from it in seed payments
  const savingsBalance = page.locator(`[data-testid="source-balance-${SAVINGS_FUND_ID}"]`);
  await expect(savingsBalance).toContainText("10,000.00");
});

// AC: All reads/writes go through Supabase client to local Postgres
test("Sources persist after page reload (Supabase-backed)", async ({ page }) => {
  await goToMonthOverview(page);

  // Add a new source
  await page.locator('[data-testid="add-source-btn"]').click();
  await expect(page.locator('role=dialog')).toBeVisible();

  await page.locator('[data-testid="source-form-name"]').fill("Reload Test Source");
  await page.locator('[data-testid="source-form-balance"]').fill("12345");
  await page.locator('role=dialog').getByRole("button", { name: /add source/i }).click();

  await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.getByText("Reload Test Source")).toBeVisible({ timeout: 5_000 });

  // Reload the page
  await page.reload();

  // After reload, wait for panel to re-appear
  await expect(page.locator('[data-testid="sources-panel"]')).toBeVisible({ timeout: 10_000 });

  // The created source should still be there (persisted in Postgres)
  await expect(page.getByText("Reload Test Source")).toBeVisible({ timeout: 10_000 });
});
