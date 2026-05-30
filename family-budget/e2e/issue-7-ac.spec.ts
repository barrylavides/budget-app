import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Seed IDs from supabase/seed.sql
const SEED_MONTH_ID        = "00000000-0000-0000-0000-000000000010";
const WIFE_PAYROLL_ID      = "00000000-0000-0000-0000-000000000020";
const BARRY_PAYROLL_ID     = "00000000-0000-0000-0000-000000000021";
const WIFE_2ND_ID          = "00000000-0000-0000-0000-000000000022";
const SAVINGS_FUND_ID      = "00000000-0000-0000-0000-000000000024";

const ELECTRIC_BILL_ID     = "00000000-0000-0000-0000-000000000030"; // amount=3500, PAID (3500/3500)
const INTERNET_ID          = "00000000-0000-0000-0000-000000000031"; // amount=1500, PAID (1500/1500)
const GROCERIES_ID         = "00000000-0000-0000-0000-000000000032"; // amount=8000, PARTIAL (5000/8000)
const SCHOOL_FEES_ID       = "00000000-0000-0000-0000-000000000033"; // amount=12000, UNPAID
const RENT_ID              = "00000000-0000-0000-0000-000000000036"; // amount=20000, PAID (20000/20000)

const PAYMENT_ELECTRIC_1   = "00000000-0000-0000-0000-000000000050";
const PAYMENT_ELECTRIC_2   = "00000000-0000-0000-0000-000000000051";
const PAYMENT_INTERNET     = "00000000-0000-0000-0000-000000000052";
const PAYMENT_GROCERIES    = "00000000-0000-0000-0000-000000000053";
const PAYMENT_RENT         = "00000000-0000-0000-0000-000000000054";

const SEED_PAYMENT_IDS = [
  PAYMENT_ELECTRIC_1,
  PAYMENT_ELECTRIC_2,
  PAYMENT_INTERNET,
  PAYMENT_GROCERIES,
  PAYMENT_RENT,
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

const SEED_SOURCE_IDS = [
  "00000000-0000-0000-0000-000000000020",
  "00000000-0000-0000-0000-000000000021",
  "00000000-0000-0000-0000-000000000022",
  "00000000-0000-0000-0000-000000000023",
  "00000000-0000-0000-0000-000000000024",
];

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function resetSeedPayments() {
  // Delete test-created payments (keep only seed payments)
  await fetch(
    `${SUPABASE_URL}/rest/v1/payments?expense_id=in.(${SEED_EXPENSE_IDS.join(",")})&id=not.in.(${SEED_PAYMENT_IDS.join(",")})`,
    { method: "DELETE", headers }
  );
  // Re-insert seed payments (idempotent)
  await fetch(`${SUPABASE_URL}/rest/v1/payments`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify([
      { id: PAYMENT_ELECTRIC_1, expense_id: ELECTRIC_BILL_ID, paid_on: "2026-05-02", amount: 2000, source_id: WIFE_PAYROLL_ID, note: "First payment" },
      { id: PAYMENT_ELECTRIC_2, expense_id: ELECTRIC_BILL_ID, paid_on: "2026-05-10", amount: 1500, source_id: WIFE_PAYROLL_ID, note: "Final payment" },
      { id: PAYMENT_INTERNET,   expense_id: INTERNET_ID,      paid_on: "2026-05-05", amount: 1500, source_id: WIFE_PAYROLL_ID, note: null },
      { id: PAYMENT_GROCERIES,  expense_id: GROCERIES_ID,     paid_on: "2026-05-08", amount: 5000, source_id: BARRY_PAYROLL_ID, note: "Week 1 & 2" },
      { id: PAYMENT_RENT,       expense_id: RENT_ID,          paid_on: "2026-05-30", amount: 20000, source_id: WIFE_2ND_ID,   note: null },
    ]),
  });
}

test.beforeAll(async () => {
  await resetSeedPayments();
});

test.afterEach(async () => {
  await resetSeedPayments();
});

async function goToOverview(page: import("@playwright/test").Page) {
  await page.goto("/month/2026-5/overview");
  await expect(page.locator('[data-testid="expenses-table"]')).toBeVisible({ timeout: 12_000 });
  // Wait for seed expenses to appear
  await expect(page.locator(`[data-testid="expense-row-${ELECTRIC_BILL_ID}"]`)).toBeVisible({ timeout: 12_000 });
}

// AC: Click status pill or pay button on expense row → opens payments modal
test("clicking status pill on expense row opens payments modal", async ({ page }) => {
  await goToOverview(page);

  // Status pill on Electric Bill (PAID)
  const pill = page.locator(`[data-testid="status-pill-${ELECTRIC_BILL_ID}"]`);
  await expect(pill).toBeVisible();
  await pill.click();

  // Modal opens
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("role=dialog")).toContainText("Electric Bill");
});

test("clicking pay button on expense row opens payments modal", async ({ page }) => {
  await goToOverview(page);

  // Pay button on School Fees (UNPAID)
  const payBtn = page.locator(`[data-testid="pay-btn-${SCHOOL_FEES_ID}"]`);
  await expect(payBtn).toBeVisible();
  await payBtn.click();

  // Modal opens
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });
  await expect(page.locator("role=dialog")).toContainText("School Fees");
});

// AC: Payments modal shows list of existing payments (date, amount, source, note, delete button),
//     add-payment form, total strip (total due / total paid / remaining)
test("payments modal shows existing payments with date, amount, source, note, delete button", async ({ page }) => {
  await goToOverview(page);

  // Open Electric Bill modal (has 2 payments)
  await page.locator(`[data-testid="status-pill-${ELECTRIC_BILL_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  // Payment rows
  const row1 = page.locator(`[data-testid="payment-row-${PAYMENT_ELECTRIC_1}"]`);
  const row2 = page.locator(`[data-testid="payment-row-${PAYMENT_ELECTRIC_2}"]`);
  await expect(row1).toBeVisible();
  await expect(row2).toBeVisible();

  // Row 1: date, amount, source, note
  await expect(row1).toContainText("2026-05-02");
  await expect(row1).toContainText("2,000.00");
  await expect(row1).toContainText("Wife Payroll");
  await expect(row1).toContainText("First payment");

  // Delete button present on each row
  await expect(page.locator(`[data-testid="delete-payment-${PAYMENT_ELECTRIC_1}"]`)).toBeVisible();
  await expect(page.locator(`[data-testid="delete-payment-${PAYMENT_ELECTRIC_2}"]`)).toBeVisible();
});

test("payments modal shows add-payment form with all fields", async ({ page }) => {
  await goToOverview(page);

  await page.locator(`[data-testid="pay-btn-${SCHOOL_FEES_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  // Add-payment form present
  await expect(page.locator('[data-testid="add-payment-form"]')).toBeVisible();
  await expect(page.locator('[data-testid="payment-form-date"]')).toBeVisible();
  await expect(page.locator('[data-testid="payment-form-amount"]')).toBeVisible();
  await expect(page.locator('[data-testid="payment-form-source"]')).toBeVisible();
  await expect(page.locator('[data-testid="payment-form-note"]')).toBeVisible();
});

test("payments modal shows total strip with total due, total paid, remaining", async ({ page }) => {
  await goToOverview(page);

  // Open Groceries (PARTIAL: 8000 due, 5000 paid, 3000 remaining)
  await page.locator(`[data-testid="status-pill-${GROCERIES_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  const strip = page.locator('[data-testid="payments-total-strip"]');
  await expect(strip).toBeVisible();

  await expect(page.locator('[data-testid="strip-total-due"]')).toContainText("8,000.00");
  await expect(page.locator('[data-testid="strip-total-paid"]')).toContainText("5,000.00");
  await expect(page.locator('[data-testid="strip-remaining"]')).toContainText("3,000.00");
});

// AC: Add payment: date picker, amount, source dropdown, note field
test("add payment via form persists and updates the modal", async ({ page }) => {
  await goToOverview(page);

  // Open School Fees (UNPAID initially)
  await page.locator(`[data-testid="pay-btn-${SCHOOL_FEES_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  // Empty state
  await expect(page.locator('[data-testid="payments-empty"]')).toBeVisible();

  // Fill the add form
  await page.locator('[data-testid="payment-form-date"]').fill("2026-05-15");
  await page.locator('[data-testid="payment-form-amount"]').fill("6000");
  await page.locator('[data-testid="payment-form-source"]').selectOption({ label: "Wife Payroll" });
  await page.locator('[data-testid="payment-form-note"]').fill("First half payment");

  // Submit
  await page.locator("role=dialog").getByRole("button", { name: /add payment/i }).click();

  // Payment row appears in modal
  await expect(page.locator('[data-testid="payments-empty"]')).not.toBeVisible({ timeout: 5_000 });
  await expect(page.locator("role=dialog")).toContainText("6,000.00");
  await expect(page.locator("role=dialog")).toContainText("2026-05-15");
});

// AC: Delete individual payment
test("delete individual payment removes it from the modal", async ({ page }) => {
  await goToOverview(page);

  // Open Electric Bill (2 payments)
  await page.locator(`[data-testid="status-pill-${ELECTRIC_BILL_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  await expect(page.locator(`[data-testid="payment-row-${PAYMENT_ELECTRIC_1}"]`)).toBeVisible();

  // Delete first payment
  await page.locator(`[data-testid="delete-payment-${PAYMENT_ELECTRIC_1}"]`).click();

  // Row disappears
  await expect(page.locator(`[data-testid="payment-row-${PAYMENT_ELECTRIC_1}"]`)).not.toBeVisible({ timeout: 5_000 });
  // Second payment still present
  await expect(page.locator(`[data-testid="payment-row-${PAYMENT_ELECTRIC_2}"]`)).toBeVisible();
});

// AC: Status pill on expense rows: "Paid" (payments >= amount), "Partial", "Unpaid" (gray)
test('status pills show Paid for Electric Bill (fully paid)', async ({ page }) => {
  await goToOverview(page);

  // Electric Bill: 3500 paid / 3500 due → Paid
  const pill = page.locator(`[data-testid="status-pill-${ELECTRIC_BILL_ID}"]`);
  await expect(pill).toHaveText("Paid");
});

test('status pills show Partial for Groceries (partially paid)', async ({ page }) => {
  await goToOverview(page);

  // Groceries: 5000 paid / 8000 due → Partial
  const pill = page.locator(`[data-testid="status-pill-${GROCERIES_ID}"]`);
  await expect(pill).toHaveText("Partial");
});

test('status pills show Unpaid for School Fees (no payments)', async ({ page }) => {
  await goToOverview(page);

  // School Fees: 0 paid / 12000 due → Unpaid
  const pill = page.locator(`[data-testid="status-pill-${SCHOOL_FEES_ID}"]`);
  await expect(pill).toHaveText("Unpaid");
});

// AC: Source remaining balance correctly deducts all payments drawn from it
test("source remaining balance deducts all payments drawn from it", async ({ page }) => {
  await goToOverview(page);

  // Wife Payroll: balance=40000
  // Payments drawn from it: Electric Bill 1 (2000) + Electric Bill 2 (1500) + Internet (1500) = 5000
  // Remaining = 40000 - 5000 = 35000
  await expect(page.locator(`[data-testid="source-balance-${WIFE_PAYROLL_ID}"]`))
    .toContainText("35,000.00", { timeout: 10_000 });

  // Barry Payroll: balance=35000, Groceries payment (5000) → remaining = 30000
  await expect(page.locator(`[data-testid="source-balance-${BARRY_PAYROLL_ID}"]`))
    .toContainText("30,000.00", { timeout: 10_000 });

  // Savings Fund: balance=10000, no payments drawn → 10000
  await expect(page.locator(`[data-testid="source-balance-${SAVINGS_FUND_ID}"]`))
    .toContainText("10,000.00", { timeout: 10_000 });
});

// AC: budget-engine functions verified (tested via Vitest unit tests - this test confirms integration)
test("budget-engine expPaid and expStatus correctly drive status pills from DB data", async ({ page }) => {
  await goToOverview(page);

  // Internet (1500/1500) → Paid
  await expect(page.locator(`[data-testid="status-pill-${INTERNET_ID}"]`)).toHaveText("Paid");

  // Rent (20000/20000) → Paid
  await expect(page.locator(`[data-testid="status-pill-${RENT_ID}"]`)).toHaveText("Paid");
});

// AC: Summary cards update: "Total Paid" reflects actual payments
test("summary cards show correct Total Paid reflecting actual payment totals", async ({ page }) => {
  await goToOverview(page);

  // With "All" filter: total paid across all expenses
  // Electric Bill 3500 + Internet 1500 + Groceries 5000 + Rent 20000 = 30000
  const totalPaidCard = page.locator('[data-testid="summary-total-paid"]');
  await expect(totalPaidCard).toBeVisible({ timeout: 10_000 });
  await expect(totalPaidCard).toContainText("30,000.00");

  // Total budgeted: 3500+1500+8000+12000+800+599+20000+3000+5000+1500+1200+4000 = 61099
  const totalBudgetedCard = page.locator('[data-testid="summary-total-budgeted"]');
  await expect(totalBudgetedCard).toContainText("61,099.00");
});

// AC: All reads/writes go through Supabase client to local Postgres (payment persists after reload)
test("added payment persists after page reload (Supabase-backed)", async ({ page }) => {
  await goToOverview(page);

  // Add a payment to School Fees
  await page.locator(`[data-testid="pay-btn-${SCHOOL_FEES_ID}"]`).click();
  await expect(page.locator("role=dialog")).toBeVisible({ timeout: 5_000 });

  await page.locator('[data-testid="payment-form-date"]').fill("2026-05-20");
  await page.locator('[data-testid="payment-form-amount"]').fill("3000");
  await page.locator("role=dialog").getByRole("button", { name: /add payment/i }).click();

  // Wait for payment to appear
  await expect(page.locator("role=dialog")).toContainText("3,000.00", { timeout: 5_000 });

  // Close modal and reload
  await page.keyboard.press("Escape");
  await page.reload();

  // After reload, School Fees should now show Partial status
  await expect(page.locator('[data-testid="expenses-table"]')).toBeVisible({ timeout: 12_000 });
  await expect(page.locator(`[data-testid="expense-row-${SCHOOL_FEES_ID}"]`)).toBeVisible({ timeout: 10_000 });
  const pill = page.locator(`[data-testid="status-pill-${SCHOOL_FEES_ID}"]`);
  await expect(pill).toHaveText("Partial", { timeout: 10_000 });
});
