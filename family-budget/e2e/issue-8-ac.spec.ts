import { test, expect } from "@playwright/test";

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const HOUSEHOLD_ID = "00000000-0000-0000-0000-000000000001";

// Seed template IDs
const INTERNET_BILL_ID = "00000000-0000-0000-0000-000000000060"; // monthly, active
const QUARTERLY_TAX_ID = "00000000-0000-0000-0000-000000000061"; // quarterly, active
const ANNUAL_INSURANCE_ID = "00000000-0000-0000-0000-000000000062"; // yearly (Jan), active
const INACTIVE_SERVICE_ID = "00000000-0000-0000-0000-000000000063"; // monthly, inactive
const FUTURE_SERVICE_ID = "00000000-0000-0000-0000-000000000064"; // monthly, active, start 202801

async function apiDelete(path: string) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "DELETE",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=minimal",
    },
  });
}

async function apiGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Accept: "application/json",
    },
  });
  return res.json();
}

async function apiPost(path: string, body: unknown) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
}

// Clean up test-created months (keep the seed month 00000000-0000-0000-0000-000000000010)
async function cleanupTestMonths() {
  await apiDelete(
    `months?household_id=eq.${HOUSEHOLD_ID}&id=neq.00000000-0000-0000-0000-000000000010`
  );
}

// Fully reset all seed templates to their original values
async function resetSeedTemplates() {
  const seeds = [
    { id: INTERNET_BILL_ID,    name: "Internet Bill",    category: "Utilities", half: "half1", default_amount: 1500, default_source_name: "Wife Payroll",  tag: "needs", cadence: "monthly",   active: true,  start_year_month: 202601 },
    { id: QUARTERLY_TAX_ID,    name: "Quarterly Tax",    category: "Bills",     half: "half2", default_amount: 2000, default_source_name: null,            tag: "needs", cadence: "quarterly", active: true,  start_year_month: 202601 },
    { id: ANNUAL_INSURANCE_ID, name: "Annual Insurance", category: "Bills",     half: "half1", default_amount: 5000, default_source_name: "Barry Payroll", tag: "needs", cadence: "yearly",    active: true,  start_year_month: 202601 },
    { id: INACTIVE_SERVICE_ID, name: "Inactive Service", category: "Bills",     half: "half1", default_amount:  500, default_source_name: null,            tag: "needs", cadence: "monthly",   active: false, start_year_month: 202601 },
    { id: FUTURE_SERVICE_ID,   name: "Future Service",   category: "Bills",     half: "half1", default_amount:  750, default_source_name: null,            tag: "needs", cadence: "monthly",   active: true,  start_year_month: 202801 },
  ];
  await Promise.all(
    seeds.map(({ id, ...fields }) =>
      fetch(`${SUPABASE_URL}/rest/v1/recurring_expense_templates?id=eq.${id}`, {
        method: "PATCH",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(fields),
      })
    )
  );
}

// Clean up test-created templates (keep seeded ones)
async function cleanupTestTemplates() {
  const seedIds = [
    INTERNET_BILL_ID,
    QUARTERLY_TAX_ID,
    ANNUAL_INSURANCE_ID,
    INACTIVE_SERVICE_ID,
    FUTURE_SERVICE_ID,
  ].join(",");
  await apiDelete(
    `recurring_expense_templates?household_id=eq.${HOUSEHOLD_ID}&id=not.in.(${seedIds})`
  );
}

test.beforeEach(async () => {
  await Promise.all([cleanupTestMonths(), cleanupTestTemplates()]);
  await resetSeedTemplates();
});

test.afterEach(async () => {
  await Promise.all([cleanupTestMonths(), cleanupTestTemplates()]);
});

// AC1: /recurring page lists all templates with: name, category, half, amount, cadence, tag, active toggle
test("AC1: /recurring page lists templates with name, category, half, amount, cadence, tag, active toggle", async ({ page }) => {
  await page.goto("/recurring");

  // Wait for templates to load
  await page.waitForSelector('[data-testid="templates-list"]');
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  // Check that seeded templates are visible
  const list = page.locator('[data-testid="templates-list"]');
  await expect(list).toBeVisible();

  // Verify "Internet Bill" appears
  const internetBillRow = page.locator(`[data-testid="template-name-${INTERNET_BILL_ID}"]`);
  await expect(internetBillRow).toBeVisible();
  await expect(internetBillRow).toHaveText("Internet Bill");

  // Verify category column is shown
  const category = page.locator(`[data-testid="template-category-${INTERNET_BILL_ID}"]`);
  await expect(category).toHaveText("Utilities");

  // Verify half column
  const half = page.locator(`[data-testid="template-half-${INTERNET_BILL_ID}"]`);
  await expect(half).toHaveText("1st Half");

  // Verify amount column
  const amount = page.locator(`[data-testid="template-amount-${INTERNET_BILL_ID}"]`);
  await expect(amount).toContainText("1,500.00");

  // Verify cadence column
  const cadence = page.locator(`[data-testid="template-cadence-${INTERNET_BILL_ID}"]`);
  await expect(cadence).toHaveText("Monthly");

  // Verify tag column
  const tag = page.locator(`[data-testid="template-tag-${INTERNET_BILL_ID}"]`);
  await expect(tag).toHaveText("needs");

  // Verify active toggle button is visible
  const toggle = page.locator(`[data-testid="template-toggle-${INTERNET_BILL_ID}"]`);
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveText("Active");
});

// AC2: Add/edit/delete templates
test("AC2: can add a new template", async ({ page }) => {
  await page.goto("/recurring");
  await page.waitForSelector('[data-testid="add-template-btn"]');

  await page.click('[data-testid="add-template-btn"]');

  // Fill in the form
  await page.fill('[data-testid="template-form-name"]', "Test Electricity");
  await page.selectOption('[data-testid="template-form-category"]', "Utilities");
  await page.selectOption('[data-testid="template-form-half"]', "half1");
  await page.fill('[data-testid="template-form-amount"]', "4000");
  await page.selectOption('[data-testid="template-form-cadence"]', "monthly");

  // Submit
  await page.click('button[type="submit"]');

  // Verify new template appears in the list
  await expect(page.locator('[data-testid="templates-list"]')).toContainText("Test Electricity");
});

test("AC2: can edit an existing template", async ({ page }) => {
  await page.goto("/recurring");
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  // Click edit on "Internet Bill"
  await page.click(`[data-testid="template-edit-${INTERNET_BILL_ID}"]`);

  // Change the name
  await page.fill('[data-testid="template-form-name"]', "Internet Bill Updated");

  // Submit
  await page.click('button[type="submit"]');

  // Verify updated name appears
  await expect(
    page.locator(`[data-testid="template-name-${INTERNET_BILL_ID}"]`)
  ).toHaveText("Internet Bill Updated");
});

test("AC2: can delete a template", async ({ page }) => {
  // Create a template via API that we'll delete in the UI
  const res = await apiPost("recurring_expense_templates", {
    household_id: HOUSEHOLD_ID,
    name: "To Be Deleted",
    category: "Bills",
    half: "half1",
    default_amount: 100,
    cadence: "monthly",
    active: true,
    start_year_month: 202601,
  });
  const [created] = await res.json();

  await page.goto("/recurring");
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  // Verify it's visible
  await expect(page.locator('[data-testid="templates-list"]')).toContainText("To Be Deleted");

  // Delete it
  await page.click(`[data-testid="template-delete-${created.id}"]`);
  await page.click('[data-testid="confirm-delete-template"]');

  // Verify it's gone
  await expect(page.locator('[data-testid="templates-list"]')).not.toContainText("To Be Deleted");
});

// AC3: Cadence options: monthly, quarterly, yearly
test("AC3: cadence dropdown has monthly, quarterly, yearly options", async ({ page }) => {
  await page.goto("/recurring");
  await page.waitForSelector('[data-testid="add-template-btn"]');

  await page.click('[data-testid="add-template-btn"]');

  const cadenceSelect = page.locator('[data-testid="template-form-cadence"]');
  await expect(cadenceSelect).toBeVisible();

  const options = await cadenceSelect.locator("option").allTextContents();
  expect(options).toContain("Monthly");
  expect(options).toContain("Quarterly");
  expect(options).toContain("Yearly");
  expect(options).toHaveLength(3);
});

// AC4: Activate/deactivate toggle
test("AC4: active toggle deactivates an active template", async ({ page }) => {
  await page.goto("/recurring");
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  const toggle = page.locator(`[data-testid="template-toggle-${INTERNET_BILL_ID}"]`);
  await expect(toggle).toHaveText("Active");

  // Deactivate
  await toggle.click();
  await expect(toggle).toHaveText("Inactive");
});

test("AC4: active toggle activates an inactive template", async ({ page }) => {
  await page.goto("/recurring");
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  const toggle = page.locator(`[data-testid="template-toggle-${INACTIVE_SERVICE_ID}"]`);
  await expect(toggle).toHaveText("Inactive");

  // Activate
  await toggle.click();
  await expect(toggle).toHaveText("Active");
});

// AC5 & AC7: Month creation materialises expenses + toast notification
test("AC5+AC7: creating a month materialises active monthly expenses and shows toast", async ({ page }) => {
  await page.goto("/");

  // Open Add Month modal via sidebar
  await page.waitForSelector('[data-testid="add-month-btn"]');
  await page.click('[data-testid="add-month-btn"]');

  // Select June 2026
  await page.waitForSelector('[data-testid="add-month-year"]');
  await page.selectOption('[data-testid="add-month-year"]', "2026");
  await page.selectOption('[data-testid="add-month-month"]', "6"); // June

  // Submit
  await page.click('button[type="submit"]');

  // Wait for toast to appear with the generation message
  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible({ timeout: 10000 });
  await expect(toast).toContainText("recurring expense");
  await expect(toast).toContainText("generated — review and adjust");

  // Verify expenses were created via API
  const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.6`);
  expect(months.length).toBe(1);
  const newMonthId = months[0].id;

  const expenses = await apiGet(`expenses?month_id=eq.${newMonthId}`);
  // June 2026: Internet Bill (monthly) should generate
  // Quarterly Tax: month 6 is not a quarter month (1,4,7,10) — should NOT generate
  // Annual Insurance: yearly (start month 1), June != Jan — should NOT generate
  // Inactive Service: inactive — should NOT generate
  // Future Service: start 202801, June 2026 < 202801 — should NOT generate
  expect(expenses.length).toBe(1);
  expect(expenses[0].name).toBe("Internet Bill");
});

// AC5 (quarterly): July 2026 triggers quarterly + monthly
test("AC5: creating July 2026 materialises monthly AND quarterly expenses", async ({ page }) => {
  await page.goto("/");

  await page.waitForSelector('[data-testid="add-month-btn"]');
  await page.click('[data-testid="add-month-btn"]');

  await page.waitForSelector('[data-testid="add-month-year"]');
  await page.selectOption('[data-testid="add-month-year"]', "2026");
  await page.selectOption('[data-testid="add-month-month"]', "7"); // July

  await page.click('button[type="submit"]');

  // Wait for toast
  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible({ timeout: 10000 });
  await expect(toast).toContainText("2 recurring expenses generated");

  // Verify via API
  const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.7`);
  expect(months.length).toBe(1);
  const expenses = await apiGet(`expenses?month_id=eq.${months[0].id}`);
  expect(expenses.length).toBe(2);
  const names = expenses.map((e: { name: string }) => e.name);
  expect(names).toContain("Internet Bill");
  expect(names).toContain("Quarterly Tax");
});

// AC6: Source matching — source_id is null when new month has no sources
test("AC6: generated expenses have null source_id when new month has no sources", async ({ page }) => {
  await page.goto("/");

  await page.waitForSelector('[data-testid="add-month-btn"]');
  await page.click('[data-testid="add-month-btn"]');

  await page.waitForSelector('[data-testid="add-month-year"]');
  await page.selectOption('[data-testid="add-month-year"]', "2026");
  await page.selectOption('[data-testid="add-month-month"]', "8"); // August

  await page.click('button[type="submit"]');

  // Wait for toast
  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible({ timeout: 10000 });

  // Verify generated expense has null source_id
  const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.8`);
  expect(months.length).toBe(1);
  const expenses = await apiGet(`expenses?month_id=eq.${months[0].id}`);
  expect(expenses.length).toBeGreaterThan(0);
  const internetBill = expenses.find((e: { name: string }) => e.name === "Internet Bill");
  expect(internetBill).toBeDefined();
  // source_id is null because the new month has no sources yet (fallback per spec)
  expect(internetBill.source_id).toBeNull();
});

// AC7: Toast message format "X recurring expenses generated — review and adjust"
test("AC7: toast message shows count and correct text", async ({ page }) => {
  await page.goto("/");

  await page.waitForSelector('[data-testid="add-month-btn"]');
  await page.click('[data-testid="add-month-btn"]');

  await page.waitForSelector('[data-testid="add-month-year"]');
  await page.selectOption('[data-testid="add-month-year"]', "2026");
  await page.selectOption('[data-testid="add-month-month"]', "9"); // September

  await page.click('button[type="submit"]');

  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible({ timeout: 10000 });
  // September: only Internet Bill (monthly) = 1 expense
  await expect(toast).toContainText("1 recurring expense generated — review and adjust");
});

// AC8: start_year_month — templates only generate for months on or after this date
test("AC8: template with future start_year_month is not generated for earlier months", async ({ page }) => {
  await page.goto("/");

  await page.waitForSelector('[data-testid="add-month-btn"]');
  await page.click('[data-testid="add-month-btn"]');

  await page.waitForSelector('[data-testid="add-month-year"]');
  await page.selectOption('[data-testid="add-month-year"]', "2026");
  await page.selectOption('[data-testid="add-month-month"]', "10"); // October

  await page.click('button[type="submit"]');

  // Wait for toast
  const toast = page.locator('[role="status"]');
  await expect(toast).toBeVisible({ timeout: 10000 });

  // Verify "Future Service" (start 202801) was NOT generated for Oct 2026
  const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.10`);
  expect(months.length).toBe(1);
  const expenses = await apiGet(`expenses?month_id=eq.${months[0].id}`);
  const futureService = expenses.find((e: { name: string }) => e.name === "Future Service");
  expect(futureService).toBeUndefined();

  // October is a quarter month (10), so Quarterly Tax + Internet Bill = 2 expenses
  expect(expenses.length).toBe(2);
  const names = expenses.map((e: { name: string }) => e.name);
  expect(names).toContain("Internet Bill");
  expect(names).toContain("Quarterly Tax");
});

// AC8 additional: start_year_month prevents generation in months before the start
test("AC8: template with start_year_month does not generate before that month", async ({ page }) => {
  // The "Future Service" template has start_year_month=202801
  // Verify via API that for Oct 2026 (202610 < 202801), it's not in generated expenses
  // This is effectively covered by the test above, but let's verify directly via the unit test logic:
  // shouldGenerate({start_year_month: 202801}, 2026, 10) => false since 202610 < 202801

  // We can also verify by looking at the /recurring page that the start_year_month field is displayed
  await page.goto("/recurring");
  await page.waitForFunction(() => {
    const list = document.querySelector('[data-testid="templates-list"]');
    return list && !list.textContent?.includes("Loading");
  });

  // Open edit form for Future Service and verify start_year_month is shown
  await page.click(`[data-testid="template-edit-${FUTURE_SERVICE_ID}"]`);

  const startYearSelect = page.locator('[data-testid="template-form-start-year"]');
  const startMonthSelect = page.locator('[data-testid="template-form-start-month"]');
  await expect(startYearSelect).toHaveValue("2028");
  await expect(startMonthSelect).toHaveValue("1");
});
