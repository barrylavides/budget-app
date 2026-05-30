# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-4-ac.spec.ts >> Sources persist after page reload (Supabase-backed)
- Location: e2e/issue-4-ac.spec.ts:307:0

# Error details

```
Error: expect(locator).not.toBeVisible() failed

Locator:  locator('role=dialog')
Expected: not visible
Received: visible
Timeout:  5000ms

Call log:
  - Expect "to.be.visible" with timeout 5000ms
  - waiting for locator('role=dialog')
    14 × locator resolved to <div role="dialog" aria-modal="true" aria-label="Add Source">…</div>
       - unexpected value "visible"

```

```yaml
- dialog "Add Source":
  - text: Add Source
  - button "Close": ×
  - text: Name
  - textbox "e.g. Wife Payroll": Reload Test Source
  - text: Type
  - combobox
  - text: Account Label
  - textbox "e.g. BDO"
  - text: Half
  - combobox
  - text: Balance (₱)
  - spinbutton: "12345"
  - text: Could not find the table 'public.sources' in the schema cache
  - button "Cancel"
  - button "Add Source"
```

# Test source

```ts
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
  302 |   const savingsBalance = page.locator(`[data-testid="source-balance-${SAVINGS_FUND_ID}"]`);
  303 |   await expect(savingsBalance).toContainText("10,000.00");
  304 | });
  305 | 
  306 | // AC: All reads/writes go through Supabase client to local Postgres
  307 | test("Sources persist after page reload (Supabase-backed)", async ({ page }) => {
  308 |   await goToMonthOverview(page);
  309 | 
  310 |   // Add a new source
  311 |   await page.locator('[data-testid="add-source-btn"]').click();
  312 |   await expect(page.locator('role=dialog')).toBeVisible();
  313 | 
  314 |   await page.locator('[data-testid="source-form-name"]').fill("Reload Test Source");
  315 |   await page.locator('[data-testid="source-form-balance"]').fill("12345");
  316 |   await page.locator('role=dialog').getByRole("button", { name: /add source/i }).click();
  317 | 
> 318 |   await expect(page.locator('role=dialog')).not.toBeVisible({ timeout: 5_000 });
      |                                                ^ Error: expect(locator).not.toBeVisible() failed
  319 |   await expect(page.getByText("Reload Test Source")).toBeVisible({ timeout: 5_000 });
  320 | 
  321 |   // Reload the page
  322 |   await page.reload();
  323 | 
  324 |   // After reload, wait for panel to re-appear
  325 |   await expect(page.locator('[data-testid="sources-panel"]')).toBeVisible({ timeout: 10_000 });
  326 | 
  327 |   // The created source should still be there (persisted in Postgres)
  328 |   await expect(page.getByText("Reload Test Source")).toBeVisible({ timeout: 10_000 });
  329 | });
  330 | 
```