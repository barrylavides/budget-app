# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-4-ac.spec.ts >> sources panel renders within the month overview
- Location: e2e/issue-4-ac.spec.ts:69:0

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="source-row-00000000-0000-0000-0000-000000000020"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "to.be.visible" with timeout 10000ms
  - waiting for locator('[data-testid="source-row-00000000-0000-0000-0000-000000000020"]')

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
  4   | const SERVICE_ROLE_KEY =
  5   |   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";
  6   | 
  7   | const SEED_MONTH_ID = "00000000-0000-0000-0000-000000000010";
  8   | 
  9   | // Seed source IDs
  10  | const WIFE_PAYROLL_ID   = "00000000-0000-0000-0000-000000000020"; // BDO, half1, balance=40000
  11  | const BARRY_PAYROLL_ID  = "00000000-0000-0000-0000-000000000021"; // BPI, half1, balance=35000
  12  | const WIFE_2ND_ID       = "00000000-0000-0000-0000-000000000022"; // BDO, half2, balance=40000
  13  | const BARRY_2ND_ID      = "00000000-0000-0000-0000-000000000023"; // BPI, half2, balance=35000
  14  | const SAVINGS_FUND_ID   = "00000000-0000-0000-0000-000000000024"; // CIMB, both, balance=10000
  15  | 
  16  | // Before each test suite, delete any sources created by prior tests (keep only seed sources)
  17  | test.beforeAll(async () => {
  18  |   await fetch(
  19  |     `${SUPABASE_URL}/rest/v1/sources?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${WIFE_PAYROLL_ID},${BARRY_PAYROLL_ID},${WIFE_2ND_ID},${BARRY_2ND_ID},${SAVINGS_FUND_ID})`,
  20  |     {
  21  |       method: "DELETE",
  22  |       headers: {
  23  |         apikey: SERVICE_ROLE_KEY,
  24  |         Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  25  |         Prefer: "return=minimal",
  26  |       },
  27  |     }
  28  |   );
  29  | });
  30  | 
  31  | test.afterEach(async () => {
  32  |   // Clean up any test-created sources (but keep seed sources)
  33  |   await fetch(
  34  |     `${SUPABASE_URL}/rest/v1/sources?month_id=eq.${SEED_MONTH_ID}&id=not.in.(${WIFE_PAYROLL_ID},${BARRY_PAYROLL_ID},${WIFE_2ND_ID},${BARRY_2ND_ID},${SAVINGS_FUND_ID})`,
  35  |     {
  36  |       method: "DELETE",
  37  |       headers: {
  38  |         apikey: SERVICE_ROLE_KEY,
  39  |         Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  40  |         Prefer: "return=minimal",
  41  |       },
  42  |     }
  43  |   );
  44  |   // Restore any seed sources that may have been updated/deleted during tests
  45  |   await fetch(`${SUPABASE_URL}/rest/v1/sources`, {
  46  |     method: "POST",
  47  |     headers: {
  48  |       apikey: SERVICE_ROLE_KEY,
  49  |       Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  50  |       "Content-Type": "application/json",
  51  |       Prefer: "resolution=merge-duplicates",
  52  |     },
  53  |     body: JSON.stringify([
  54  |       { id: WIFE_PAYROLL_ID,  month_id: SEED_MONTH_ID, name: "Wife Payroll",    type: "salary",             account_label: "BDO",  half: "half1", balance: 40000 },
  55  |       { id: BARRY_PAYROLL_ID, month_id: SEED_MONTH_ID, name: "Barry Payroll",   type: "salary",             account_label: "BPI",  half: "half1", balance: 35000 },
  56  |       { id: WIFE_2ND_ID,      month_id: SEED_MONTH_ID, name: "Wife 2nd Salary", type: "salary",             account_label: "BDO",  half: "half2", balance: 40000 },
  57  |       { id: BARRY_2ND_ID,     month_id: SEED_MONTH_ID, name: "Barry 2nd",       type: "salary",             account_label: "BPI",  half: "half2", balance: 35000 },
  58  |       { id: SAVINGS_FUND_ID,  month_id: SEED_MONTH_ID, name: "Savings Fund",    type: "savings_withdrawal", account_label: "CIMB", half: "both",  balance: 10000 },
  59  |     ]),
  60  |   });
  61  | });
  62  | 
  63  | async function goToMonthOverview(page: import("@playwright/test").Page) {
  64  |   await page.goto("/month/2026-5/overview");
  65  |   await expect(page.locator('[data-testid="sources-panel"]')).toBeVisible({ timeout: 10_000 });
  66  | }
  67  | 
  68  | // AC: Sources panel renders within the month overview, matching prototype layout
  69  | test("sources panel renders within the month overview", async ({ page }) => {
  70  |   await goToMonthOverview(page);
  71  | 
  72  |   // Panel is visible
  73  |   const panel = page.locator('[data-testid="sources-panel"]');
  74  |   await expect(panel).toBeVisible();
  75  | 
  76  |   // All 5 seed sources should be listed
> 77  |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  78  |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  79  |   await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  80  |   await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  81  |   await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
  82  | 
  83  |   // Panel contains the "Add" button
  84  |   await expect(page.locator('[data-testid="add-source-btn"]')).toBeVisible();
  85  | });
  86  | 
  87  | // AC: "Add source" form: name, type (Salary/Debt Collected/Savings Withdrawal), account label, half (1st/2nd/Both), balance
  88  | test("Add source form has all required fields and creates a new source", async ({ page }) => {
  89  |   await goToMonthOverview(page);
  90  | 
  91  |   // Open the add modal
  92  |   await page.locator('[data-testid="add-source-btn"]').click();
  93  |   await expect(page.locator('role=dialog')).toBeVisible();
  94  | 
  95  |   // All form fields present
  96  |   await expect(page.locator('[data-testid="source-form-name"]')).toBeVisible();
  97  |   await expect(page.locator('[data-testid="source-form-type"]')).toBeVisible();
  98  |   await expect(page.locator('[data-testid="source-form-account-label"]')).toBeVisible();
  99  |   await expect(page.locator('[data-testid="source-form-half"]')).toBeVisible();
  100 |   await expect(page.locator('[data-testid="source-form-balance"]')).toBeVisible();
  101 | 
  102 |   // Type dropdown contains the 3 required options
  103 |   const typeSelect = page.locator('[data-testid="source-form-type"]');
  104 |   await expect(typeSelect.locator('option[value="salary"]')).toHaveText("Salary");
  105 |   await expect(typeSelect.locator('option[value="debt_collected"]')).toHaveText("Debt Collected");
  106 |   await expect(typeSelect.locator('option[value="savings_withdrawal"]')).toHaveText("Savings Withdrawal");
  107 | 
  108 |   // Half dropdown has 1st/2nd/Both options
  109 |   const halfSelect = page.locator('[data-testid="source-form-half"]');
  110 |   await expect(halfSelect.locator('option[value="half1"]')).toHaveText("1st Half");
  111 |   await expect(halfSelect.locator('option[value="half2"]')).toHaveText("2nd Half");
  112 |   await expect(halfSelect.locator('option[value="both"]')).toHaveText("Both");
  113 | 
  114 |   // Fill out the form
  115 |   await page.locator('[data-testid="source-form-name"]').fill("Test Bonus");
  116 |   await typeSelect.selectOption("debt_collected");
  117 |   await page.locator('[data-testid="source-form-account-label"]').fill("UnionBank");
  118 |   await halfSelect.selectOption("both");
  119 |   await page.locator('[data-testid="source-form-balance"]').fill("5000");
  120 | 
  121 |   // Submit
  122 |   await page.locator('role=dialog').getByRole("button", { name: /add source/i }).click();
  123 | 
  124 |   // Modal closes
  125 |   await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  126 | 
  127 |   // New source is visible in the list
  128 |   await expect(page.getByText("Test Bonus")).toBeVisible({ timeout: 5_000 });
  129 | });
  130 | 
  131 | // AC: Edit source inline or via modal
  132 | test("Edit source opens modal pre-filled and saves changes", async ({ page }) => {
  133 |   await goToMonthOverview(page);
  134 | 
  135 |   // Wait for sources to load
  136 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  137 | 
  138 |   // Hover over Wife Payroll to reveal edit button
  139 |   await page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`).hover();
  140 | 
  141 |   // Edit button should appear
  142 |   const editBtn = page.locator(`[data-testid="source-edit-${WIFE_PAYROLL_ID}"]`);
  143 |   await expect(editBtn).toBeVisible();
  144 |   await editBtn.click();
  145 | 
  146 |   // Edit modal opens
  147 |   await expect(page.locator('role=dialog')).toBeVisible();
  148 | 
  149 |   // Modal is pre-filled with current values
  150 |   await expect(page.locator('[data-testid="source-form-name"]')).toHaveValue("Wife Payroll");
  151 |   await expect(page.locator('[data-testid="source-form-account-label"]')).toHaveValue("BDO");
  152 | 
  153 |   // Change the name
  154 |   await page.locator('[data-testid="source-form-name"]').fill("Wife Salary Updated");
  155 | 
  156 |   // Save
  157 |   await page.locator('role=dialog').getByRole("button", { name: /save changes/i }).click();
  158 | 
  159 |   // Modal closes
  160 |   await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  161 | 
  162 |   // Updated name visible
  163 |   await expect(page.getByText("Wife Salary Updated")).toBeVisible({ timeout: 5_000 });
  164 | });
  165 | 
  166 | // AC: Delete source with confirmation
  167 | test("Delete source shows confirmation modal and removes the source", async ({ page }) => {
  168 |   await goToMonthOverview(page);
  169 | 
  170 |   // Wait for sources to load
  171 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  172 | 
  173 |   // Hover over Barry Payroll
  174 |   await page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`).hover();
  175 | 
  176 |   // Delete button should appear
  177 |   const deleteBtn = page.locator(`[data-testid="source-delete-${BARRY_PAYROLL_ID}"]`);
```