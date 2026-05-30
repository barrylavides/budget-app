# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-4-ac.spec.ts >> Sources display icon by type, name, account label, half dot, and balance
- Location: e2e/issue-4-ac.spec.ts:197:0

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
  178 |   await expect(deleteBtn).toBeVisible();
  179 |   await deleteBtn.click();
  180 | 
  181 |   // Confirmation modal opens
  182 |   await expect(page.locator('role=dialog')).toBeVisible();
  183 |   await expect(page.locator('role=dialog')).toContainText("Barry Payroll");
  184 |   await expect(page.locator('role=dialog')).toContainText("cannot be undone");
  185 | 
  186 |   // Confirm deletion
  187 |   await page.locator('[data-testid="confirm-delete-source"]').click();
  188 | 
  189 |   // Modal closes
  190 |   await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
  191 | 
  192 |   // Source is no longer in the list
  193 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).not.toBeVisible({ timeout: 5_000 });
  194 | });
  195 | 
  196 | // AC: Sources display: icon by type, name, account label, half dot, balance
  197 | test("Sources display icon by type, name, account label, half dot, and balance", async ({ page }) => {
  198 |   await goToMonthOverview(page);
  199 | 
  200 |   // Wait for sources to load
> 201 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  202 | 
  203 |   // Wife Payroll (salary type, BDO, half1)
  204 |   const wifeName = page.locator(`[data-testid="source-name-${WIFE_PAYROLL_ID}"]`);
  205 |   await expect(wifeName).toContainText("Wife Payroll");
  206 | 
  207 |   const wifeAccount = page.locator(`[data-testid="source-account-${WIFE_PAYROLL_ID}"]`);
  208 |   await expect(wifeAccount).toContainText("BDO");
  209 | 
  210 |   // Type icon present (salary = 💵)
  211 |   const wifeIcon = page.locator(`[data-testid="source-icon-${WIFE_PAYROLL_ID}"]`);
  212 |   await expect(wifeIcon).toBeVisible();
  213 |   await expect(wifeIcon).toContainText("💵");
  214 | 
  215 |   // Half indicator visible
  216 |   const wifeHalf = page.locator(`[data-testid="source-half-${WIFE_PAYROLL_ID}"]`);
  217 |   await expect(wifeHalf).toBeVisible();
  218 |   await expect(wifeHalf).toContainText("1st");
  219 | 
  220 |   // Balance visible (Wife Payroll: 40000 - payments drawn from it)
  221 |   const wifeBalance = page.locator(`[data-testid="source-balance-${WIFE_PAYROLL_ID}"]`);
  222 |   await expect(wifeBalance).toBeVisible();
  223 |   // Balance starts at 40000, payments: 2000 + 1500 + 1500 = 5000 drawn, so remaining = 35000
  224 |   await expect(wifeBalance).toContainText("₱");
  225 | 
  226 |   // Savings Fund (savings_withdrawal type, CIMB, both)
  227 |   const savingsIcon = page.locator(`[data-testid="source-icon-${SAVINGS_FUND_ID}"]`);
  228 |   await expect(savingsIcon).toContainText("🏦");
  229 | 
  230 |   const savingsHalf = page.locator(`[data-testid="source-half-${SAVINGS_FUND_ID}"]`);
  231 |   await expect(savingsHalf).toContainText("Both");
  232 | });
  233 | 
  234 | // AC: Sources filtered by half when viewing a specific half
  235 | test("Sources are filtered by half when 1st Half or 2nd Half filter is active", async ({ page }) => {
  236 |   await goToMonthOverview(page);
  237 | 
  238 |   // Wait for all 5 sources to load
  239 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  240 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  241 |   await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  242 |   await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  243 |   await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
  244 | 
  245 |   // Apply 1st Half filter
  246 |   await page.locator('[data-testid="half-filter-half1"]').click();
  247 | 
  248 |   // half1 sources + "both" sources should be visible
  249 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible();
  250 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  251 |   await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
  252 | 
  253 |   // half2-only sources should be hidden
  254 |   await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).not.toBeVisible();
  255 |   await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).not.toBeVisible();
  256 | 
  257 |   // Apply 2nd Half filter
  258 |   await page.locator('[data-testid="half-filter-half2"]').click();
  259 | 
  260 |   // half2 sources + "both" sources should be visible
  261 |   await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  262 |   await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  263 |   await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
  264 | 
  265 |   // half1-only sources should be hidden
  266 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).not.toBeVisible();
  267 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).not.toBeVisible();
  268 | 
  269 |   // Switch back to All
  270 |   await page.locator('[data-testid="half-filter-all"]').click();
  271 | 
  272 |   // All 5 sources visible again
  273 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible();
  274 |   await expect(page.locator(`[data-testid="source-row-${BARRY_PAYROLL_ID}"]`)).toBeVisible();
  275 |   await expect(page.locator(`[data-testid="source-row-${WIFE_2ND_ID}"]`)).toBeVisible();
  276 |   await expect(page.locator(`[data-testid="source-row-${BARRY_2ND_ID}"]`)).toBeVisible();
  277 |   await expect(page.locator(`[data-testid="source-row-${SAVINGS_FUND_ID}"]`)).toBeVisible();
  278 | });
  279 | 
  280 | // AC: budget-engine functions sourceRemaining(), sourcesTotal(), sourcesTotalAll() have unit tests
  281 | test("Budget-engine sourceRemaining correctly shows remaining balance minus payments", async ({ page }) => {
  282 |   await goToMonthOverview(page);
  283 | 
  284 |   // Wait for Wife Payroll to load
  285 |   await expect(page.locator(`[data-testid="source-row-${WIFE_PAYROLL_ID}"]`)).toBeVisible({ timeout: 10_000 });
  286 | 
  287 |   // Wife Payroll has balance 40000 and payments drawn from it:
  288 |   // 2000 (Electric Bill partial) + 1500 (Electric Bill final) + 1500 (Internet) = 5000 total drawn
  289 |   // So remaining should be 40000 - 5000 = 35000
  290 |   const wifeBalance = page.locator(`[data-testid="source-balance-${WIFE_PAYROLL_ID}"]`);
  291 |   await expect(wifeBalance).toContainText("35,000.00");
  292 | 
  293 |   // Barry Payroll: balance 35000, seed payment for Groceries has source_id=null so not deducted = 35000
  294 |   const barryBalance = page.locator(`[data-testid="source-balance-${BARRY_PAYROLL_ID}"]`);
  295 |   await expect(barryBalance).toContainText("35,000.00");
  296 | 
  297 |   // Wife 2nd Salary: balance 40000, payments: 20000 (Rent) = 40000 - 20000 = 20000
  298 |   const wife2ndBalance = page.locator(`[data-testid="source-balance-${WIFE_2ND_ID}"]`);
  299 |   await expect(wife2ndBalance).toContainText("20,000.00");
  300 | 
  301 |   // Savings Fund: balance 10000, no payments drawn from it in seed payments
```