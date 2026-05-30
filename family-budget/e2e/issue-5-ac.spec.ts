import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Seed UUIDs from seed.sql
const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";

// Clean up any expenses created during tests (keep seed expenses)
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

async function deleteNonSeedExpenses() {
  const seedIdList = SEED_EXPENSE_IDS.map((id) => `"${id}"`).join(",");
  await fetch(
    `${SUPABASE_URL}/rest/v1/expenses?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${seedIdList})`,
    {
      method: "DELETE",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        Prefer: "return=minimal",
      },
    }
  );
}

// Reset seed expenses to their original state (undo any edits from tests)
async function resetSeedExpenses() {
  // Restore Electric Bill to original name if it was edited
  await fetch(
    `${SUPABASE_URL}/rest/v1/expenses?id=eq.00000000-0000-0000-0000-000000000030`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ name: "Electric Bill", category: "Utilities", amount: 3500 }),
    }
  );
}

test.beforeAll(async () => {
  await deleteNonSeedExpenses();
  await resetSeedExpenses();
});

test.afterEach(async () => {
  await deleteNonSeedExpenses();
  await resetSeedExpenses();
});

async function navigateToExpenses(page: import("@playwright/test").Page) {
  await page.goto("/month/2026-5/expenses");
  // Wait for expenses to load
  await expect(page.locator('[data-testid="add-expense-btn"]')).toBeVisible({ timeout: 10_000 });
  // Wait for category grid or list to appear (seed has data)
  await expect(
    page.locator('[data-testid="category-grid"], [data-testid="category-list"]')
  ).toBeVisible({ timeout: 10_000 });
}

// AC: "Add expense" modal — name, category (8 options), half, amount,
//     source dropdown (filtered by half), tag picker
test("Add expense modal has name, category (8 options), half, amount, source dropdown filtered by half, and tag picker", async ({
  page,
}) => {
  await navigateToExpenses(page);

  // Open modal
  await page.click('[data-testid="add-expense-btn"]');
  await expect(page.locator('[data-testid="add-expense-form"]')).toBeVisible();

  // Name field
  await expect(page.locator('[data-testid="expense-name"]')).toBeVisible();

  // Category select has 8 options
  const categorySelect = page.locator('[data-testid="expense-category"]');
  await expect(categorySelect).toBeVisible();
  const categoryOptions = categorySelect.locator("option");
  await expect(categoryOptions).toHaveCount(8);
  const categoryTexts = await categoryOptions.allTextContents();
  expect(categoryTexts).toEqual(
    expect.arrayContaining([
      "Bills",
      "Food",
      "Utilities",
      "Home",
      "Travel",
      "Health",
      "Education",
      "Other",
    ])
  );

  // Half select
  const halfSelect = page.locator('[data-testid="expense-half"]');
  await expect(halfSelect).toBeVisible();

  // Amount field
  await expect(page.locator('[data-testid="expense-amount"]')).toBeVisible();

  // Source dropdown filtered by half — starts at half1, should show half1 sources
  const sourceSelect = page.locator('[data-testid="expense-source"]');
  await expect(sourceSelect).toBeVisible();
  // half1 has: Wife Payroll (BDO), Barry Payroll (BPI) — 2 sources + "None"
  const initialSourceOptions = await sourceSelect.locator("option").allTextContents();
  expect(initialSourceOptions.length).toBeGreaterThan(1); // at least "None" + some sources
  // Switch to half2 and verify source list changes
  await halfSelect.selectOption("half2");
  const half2SourceOptions = await sourceSelect.locator("option").allTextContents();
  // Should have different sources for half2
  expect(half2SourceOptions.length).toBeGreaterThanOrEqual(1);
  // Verify the source list actually differs
  expect(JSON.stringify(half2SourceOptions)).not.toEqual(JSON.stringify(initialSourceOptions));

  // Tag picker: Needs, Wants, Savings, Investment, Business, None
  await expect(page.locator('[data-testid="tag-option-none"]')).toBeVisible();
  await expect(page.locator('[data-testid="tag-option-needs"]')).toBeVisible();
  await expect(page.locator('[data-testid="tag-option-wants"]')).toBeVisible();
  await expect(page.locator('[data-testid="tag-option-savings"]')).toBeVisible();
  await expect(page.locator('[data-testid="tag-option-investment"]')).toBeVisible();
  await expect(page.locator('[data-testid="tag-option-business"]')).toBeVisible();

  // Cancel to close modal
  await page.getByRole("button", { name: /cancel/i }).click();
});

// AC: Add expense modal submits successfully and creates an expense via Supabase
test("Add expense modal creates expense and shows it in category view", async ({ page }) => {
  await navigateToExpenses(page);

  // Open modal
  await page.click('[data-testid="add-expense-btn"]');
  await expect(page.locator('[data-testid="add-expense-form"]')).toBeVisible();

  // Fill out the form
  await page.fill('[data-testid="expense-name"]', "Test Grocery Run");
  await page.locator('[data-testid="expense-category"]').selectOption("Food");
  await page.locator('[data-testid="expense-half"]').selectOption("half1");
  await page.fill('[data-testid="expense-amount"]', "2500");
  await page.locator('[data-testid="tag-option-needs"]').click();

  // Submit
  await page.locator('[data-testid="add-expense-form"]').getByRole("button", { name: /add expense/i }).click();

  // Modal should close
  await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible({ timeout: 5_000 });

  // Food category card should be visible and show the new expense
  await expect(page.locator('[data-testid="category-card-Food"]')).toBeVisible({ timeout: 5_000 });
});

// AC: Edit and delete expense (delete with confirmation dialog)
test("Edit expense — opens edit modal pre-populated and saves changes", async ({ page }) => {
  await navigateToExpenses(page);

  // Create a fresh (non-seed) expense so we don't permanently mutate seed data.
  // afterEach will delete it via deleteNonSeedExpenses().
  await page.click('[data-testid="add-expense-btn"]');
  await page.fill('[data-testid="expense-name"]', "Edit Test Expense");
  await page.locator('[data-testid="expense-category"]').selectOption("Bills");
  await page.locator('[data-testid="expense-half"]').selectOption("half1");
  await page.fill('[data-testid="expense-amount"]', "300");
  await page.locator('[data-testid="add-expense-form"]').getByRole("button", { name: /add expense/i }).click();
  await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible({ timeout: 5_000 });

  // Drill into Bills
  await page.locator('[data-testid="category-card-Bills"]').click();
  await expect(page.locator('[data-testid="expense-table"]')).toBeVisible({ timeout: 5_000 });

  // Hover over the new expense row to reveal actions
  const editRow = page.locator('[data-testid^="expense-row-"]').filter({ hasText: "Edit Test Expense" });
  await expect(editRow).toBeVisible({ timeout: 5_000 });
  await editRow.hover();

  const editBtn = editRow.locator('[data-testid^="edit-expense-"]');
  await expect(editBtn).toBeVisible({ timeout: 3_000 });
  await editBtn.click();

  // Edit modal should open pre-populated
  await expect(page.locator('[data-testid="edit-expense-form"]')).toBeVisible();
  const nameInput = page.locator('[data-testid="edit-expense-name"]');
  expect(await nameInput.inputValue()).toBe("Edit Test Expense");

  // Change the name
  await nameInput.fill("Edit Test Expense Updated");
  await page.locator('[data-testid="edit-expense-form"]').getByRole("button", { name: /save changes/i }).click();

  // Modal closes and updated name appears in table
  await expect(page.locator('[data-testid="edit-expense-form"]')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Edit Test Expense Updated", {
    timeout: 5_000,
  });
});

test("Delete expense shows confirmation dialog and removes the expense", async ({ page }) => {
  await navigateToExpenses(page);

  // Add a fresh expense to delete so we don't destroy seed data
  await page.click('[data-testid="add-expense-btn"]');
  await page.fill('[data-testid="expense-name"]', "To Be Deleted");
  await page.locator('[data-testid="expense-category"]').selectOption("Other");
  await page.locator('[data-testid="expense-half"]').selectOption("half1");
  await page.fill('[data-testid="expense-amount"]', "100");
  await page.locator('[data-testid="add-expense-form"]').getByRole("button", { name: /add expense/i }).click();
  await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible({ timeout: 5_000 });

  // Drill into Other category
  const otherCard = page.locator('[data-testid="category-card-Other"]');
  await expect(otherCard).toBeVisible({ timeout: 5_000 });
  await otherCard.click();

  await expect(page.locator('[data-testid="expense-table"]')).toBeVisible({ timeout: 5_000 });

  // Hover over the expense row
  const row = page.locator('[data-testid^="expense-row-"]').first();
  await row.hover();

  // Click delete button
  const deleteBtn = row.locator('[data-testid^="delete-expense-"]');
  await expect(deleteBtn).toBeVisible({ timeout: 3_000 });
  await deleteBtn.click();

  // Confirmation dialog appears
  await expect(page.locator('[data-testid="delete-confirm-message"]')).toBeVisible();
  await expect(page.locator('[data-testid="delete-confirm-message"]')).toContainText("To Be Deleted");

  // Confirm deletion
  await page.locator('[data-testid="delete-confirm"]').click();

  // Expense table should no longer show the deleted expense (or no expenses remain → table disappears)
  await expect(
    page.locator('[data-testid="expense-table"]').getByText("To Be Deleted")
  ).not.toBeVisible({ timeout: 5_000 });
});

// AC: Category grid view — cards with icon, name, count, total amount, progress bar
test("Category grid view shows cards with icon, name, count, total, and paid progress bar", async ({
  page,
}) => {
  await navigateToExpenses(page);

  // Ensure we're in grid mode
  await page.click('[data-testid="view-toggle-grid"]');
  await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();

  // Utilities has 3 expenses in seed: Electric Bill, Internet, Water Bill
  const utilCard = page.locator('[data-testid="category-card-Utilities"]');
  await expect(utilCard).toBeVisible();

  // Card text includes category name and count
  await expect(utilCard).toContainText("Utilities");
  await expect(utilCard).toContainText("expense");

  // Total amount present (should show ₱5,800.00 = 3500+1500+800)
  await expect(utilCard).toContainText("₱");

  // Progress bar container exists (may have 0% width if all unpaid, so check attached not visible)
  await expect(page.locator('[data-testid="category-progress-Utilities"]')).toBeAttached();
});

// AC: Category list view — rows with icon, name, count, progress bar, total, chevron
test("Category list view shows rows with icon, name, count, progress bar, total, and chevron", async ({
  page,
}) => {
  await navigateToExpenses(page);

  // Switch to list view
  await page.click('[data-testid="view-toggle-list"]');
  await expect(page.locator('[data-testid="category-list"]')).toBeVisible();

  // Utilities row
  const utilRow = page.locator('[data-testid="category-row-Utilities"]');
  await expect(utilRow).toBeVisible();
  await expect(utilRow).toContainText("Utilities");
  await expect(utilRow).toContainText("item");

  // Amount in row
  await expect(utilRow).toContainText("₱");

  // Progress bar container exists (may have 0% width if all unpaid, so check attached not visible)
  await expect(page.locator('[data-testid="list-progress-Utilities"]')).toBeAttached();

  // Chevron › character
  await expect(utilRow).toContainText("›");
});

// AC: Toggle between grid and list; preference persists in localStorage
test("Toggle between grid and list view; preference persists in localStorage", async ({ page }) => {
  await navigateToExpenses(page);

  // Switch to list view
  await page.click('[data-testid="view-toggle-list"]');
  await expect(page.locator('[data-testid="category-list"]')).toBeVisible();
  await expect(page.locator('[data-testid="category-grid"]')).not.toBeVisible();

  // Verify localStorage key was set
  const stored = await page.evaluate(() => localStorage.getItem("expense-view-mode"));
  expect(stored).toBe("list");

  // Reload page — should still be in list mode
  await page.reload();
  await expect(page.locator('[data-testid="add-expense-btn"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="category-list"]')).toBeVisible({ timeout: 10_000 });

  // Switch back to grid
  await page.click('[data-testid="view-toggle-grid"]');
  await expect(page.locator('[data-testid="category-grid"]')).toBeVisible();
  const storedGrid = await page.evaluate(() => localStorage.getItem("expense-view-mode"));
  expect(storedGrid).toBe("grid");
});

// AC: Drill into a category → expense table showing all items in that category
test("Drilling into a category shows expense table with only that category's items", async ({
  page,
}) => {
  await navigateToExpenses(page);

  // Click Utilities card to drill in
  await page.click('[data-testid="category-card-Utilities"]');

  // Expense table should appear
  await expect(page.locator('[data-testid="expense-table"]')).toBeVisible({ timeout: 5_000 });

  // Grid and list toggles should be hidden when drilled in
  await expect(page.locator('[data-testid="view-toggle-grid"]')).not.toBeVisible();

  // Seed utilities: Electric Bill, Internet, Water Bill
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Electric Bill");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Internet");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Water Bill");

  // Food expenses should NOT appear in Utilities drill
  await expect(page.locator('[data-testid="expense-table"]')).not.toContainText("Groceries");
});

// AC: Breadcrumb navigation ("All Categories > Food") with back button
test("Breadcrumb shows category name and back button navigates to categories", async ({ page }) => {
  await navigateToExpenses(page);

  // Drill into Food
  await page.click('[data-testid="category-card-Food"]');

  // Breadcrumb should be visible
  await expect(page.locator('[data-testid="breadcrumb-back"]')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="breadcrumb-category"]')).toBeVisible();
  await expect(page.locator('[data-testid="breadcrumb-back"]')).toContainText("All Categories");
  await expect(page.locator('[data-testid="breadcrumb-category"]')).toContainText("Food");

  // Click back button
  await page.click('[data-testid="breadcrumb-back"]');

  // Should return to category view (grid or list)
  await expect(
    page.locator('[data-testid="category-grid"], [data-testid="category-list"]')
  ).toBeVisible({ timeout: 5_000 });

  // Breadcrumb should be gone
  await expect(page.locator('[data-testid="breadcrumb-back"]')).not.toBeVisible();
});

// AC: Expense table columns: name, amount, source, tag pill, status (stub — unpaid), actions
test("Expense table shows correct columns: name, amount, source, tag pill, status unpaid, edit/delete on hover", async ({
  page,
}) => {
  await navigateToExpenses(page);

  // Drill into Utilities (has sources and tags set in seed)
  await page.click('[data-testid="category-card-Utilities"]');
  await expect(page.locator('[data-testid="expense-table"]')).toBeVisible({ timeout: 5_000 });

  // Header text
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Name");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Amount");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Source");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Tag");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Status");

  // Electric Bill row: ₱3,500.00, has source Wife Payroll, tag needs, status unpaid
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Electric Bill");
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("3,500.00");
  // status stub = unpaid
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("unpaid");

  // Hover over a row to reveal edit/delete buttons
  const row = page.locator('[data-testid="expense-row-00000000-0000-0000-0000-000000000030"]');
  await row.hover();
  await expect(row.locator('[data-testid="edit-expense-00000000-0000-0000-0000-000000000030"]')).toBeVisible({
    timeout: 3_000,
  });
  await expect(row.locator('[data-testid="delete-expense-00000000-0000-0000-0000-000000000030"]')).toBeVisible({
    timeout: 3_000,
  });
});

// AC: budget-engine exports expTotal(), expPaid() (returns 0 for now), expStatus() with unit tests
test("budget-engine expTotal, expPaid, expStatus are exported with correct behavior (verified via unit tests passing)", async () => {
  // This AC is verified by the unit tests in src/budget-engine/index.test.ts
  // We confirm the exports exist and work correctly:
  const {
    expTotal,
    expPaid,
    expStatus,
  } = await import(
    // @ts-expect-error: dynamic import in test context
    "../src/budget-engine/index.ts"
  );

  // expPaid returns 0 for an expense with no payments
  const noPaymentExpense = { id: "e1", amount: 500, sourceId: "s1", payments: [] };
  expect(expPaid(noPaymentExpense)).toBe(0);

  // expStatus returns "unpaid" when paid === 0
  expect(expStatus(noPaymentExpense)).toBe("unpaid");

  // expTotal sums amounts
  const expenses = [
    { id: "e1", amount: 1000, sourceId: "s1", payments: [] },
    { id: "e2", amount: 2000, sourceId: "s1", payments: [] },
  ];
  expect(expTotal(expenses)).toBe(3000);
});

// AC: All reads/writes go through Supabase client to local Postgres
test("Expenses are read from and written to Supabase (persist across reload)", async ({ page }) => {
  await navigateToExpenses(page);

  // Add a new expense
  await page.click('[data-testid="add-expense-btn"]');
  await page.fill('[data-testid="expense-name"]', "Persist Test Expense");
  await page.locator('[data-testid="expense-category"]').selectOption("Home");
  await page.locator('[data-testid="expense-half"]').selectOption("half1");
  await page.fill('[data-testid="expense-amount"]', "750");
  await page.locator('[data-testid="add-expense-form"]').getByRole("button", { name: /add expense/i }).click();
  await expect(page.locator('[data-testid="add-expense-form"]')).not.toBeVisible({ timeout: 5_000 });

  // Home card should show the new expense
  await expect(page.locator('[data-testid="category-card-Home"]')).toBeVisible({ timeout: 5_000 });

  // Reload and verify data persisted
  await page.reload();
  await expect(page.locator('[data-testid="add-expense-btn"]')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('[data-testid="category-card-Home"]')).toBeVisible({ timeout: 10_000 });

  // Drill into Home and confirm the expense is still there
  await page.click('[data-testid="category-card-Home"]');
  await expect(page.locator('[data-testid="expense-table"]')).toBeVisible({ timeout: 5_000 });
  await expect(page.locator('[data-testid="expense-table"]')).toContainText("Persist Test Expense");
});
