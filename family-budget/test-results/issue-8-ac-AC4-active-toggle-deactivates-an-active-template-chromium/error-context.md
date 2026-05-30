# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-8-ac.spec.ts >> AC4: active toggle deactivates an active template
- Location: e2e/issue-8-ac.spec.ts:243:0

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('[data-testid="template-toggle-00000000-0000-0000-0000-000000000060"]')
Expected: "Active"
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "to.have.text" with timeout 5000ms
  - waiting for locator('[data-testid="template-toggle-00000000-0000-0000-0000-000000000060"]')

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
  - text: Templates
  - heading "Recurring Expenses" [level=1]
  - text: No recurring templates yet. Add one to auto-generate expenses when creating new months.
```

# Test source

```ts
  151 | // AC2: Add/edit/delete templates
  152 | test("AC2: can add a new template", async ({ page }) => {
  153 |   await page.goto("/recurring");
  154 |   await page.waitForSelector('[data-testid="add-template-btn"]');
  155 | 
  156 |   await page.click('[data-testid="add-template-btn"]');
  157 | 
  158 |   // Fill in the form
  159 |   await page.fill('[data-testid="template-form-name"]', "Test Electricity");
  160 |   await page.selectOption('[data-testid="template-form-category"]', "Utilities");
  161 |   await page.selectOption('[data-testid="template-form-half"]', "half1");
  162 |   await page.fill('[data-testid="template-form-amount"]', "4000");
  163 |   await page.selectOption('[data-testid="template-form-cadence"]', "monthly");
  164 | 
  165 |   // Submit
  166 |   await page.click('button[type="submit"]');
  167 | 
  168 |   // Verify new template appears in the list
  169 |   await expect(page.locator('[data-testid="templates-list"]')).toContainText("Test Electricity");
  170 | });
  171 | 
  172 | test("AC2: can edit an existing template", async ({ page }) => {
  173 |   await page.goto("/recurring");
  174 |   await page.waitForFunction(() => {
  175 |     const list = document.querySelector('[data-testid="templates-list"]');
  176 |     return list && !list.textContent?.includes("Loading");
  177 |   });
  178 | 
  179 |   // Click edit on "Internet Bill"
  180 |   await page.click(`[data-testid="template-edit-${INTERNET_BILL_ID}"]`);
  181 | 
  182 |   // Change the name
  183 |   await page.fill('[data-testid="template-form-name"]', "Internet Bill Updated");
  184 | 
  185 |   // Submit
  186 |   await page.click('button[type="submit"]');
  187 | 
  188 |   // Verify updated name appears
  189 |   await expect(
  190 |     page.locator(`[data-testid="template-name-${INTERNET_BILL_ID}"]`)
  191 |   ).toHaveText("Internet Bill Updated");
  192 | });
  193 | 
  194 | test("AC2: can delete a template", async ({ page }) => {
  195 |   // Create a template via API that we'll delete in the UI
  196 |   const res = await apiPost("recurring_expense_templates", {
  197 |     household_id: HOUSEHOLD_ID,
  198 |     name: "To Be Deleted",
  199 |     category: "Bills",
  200 |     half: "half1",
  201 |     default_amount: 100,
  202 |     cadence: "monthly",
  203 |     active: true,
  204 |     start_year_month: 202601,
  205 |   });
  206 |   const [created] = await res.json();
  207 | 
  208 |   await page.goto("/recurring");
  209 |   await page.waitForFunction(() => {
  210 |     const list = document.querySelector('[data-testid="templates-list"]');
  211 |     return list && !list.textContent?.includes("Loading");
  212 |   });
  213 | 
  214 |   // Verify it's visible
  215 |   await expect(page.locator('[data-testid="templates-list"]')).toContainText("To Be Deleted");
  216 | 
  217 |   // Delete it
  218 |   await page.click(`[data-testid="template-delete-${created.id}"]`);
  219 |   await page.click('[data-testid="confirm-delete-template"]');
  220 | 
  221 |   // Verify it's gone
  222 |   await expect(page.locator('[data-testid="templates-list"]')).not.toContainText("To Be Deleted");
  223 | });
  224 | 
  225 | // AC3: Cadence options: monthly, quarterly, yearly
  226 | test("AC3: cadence dropdown has monthly, quarterly, yearly options", async ({ page }) => {
  227 |   await page.goto("/recurring");
  228 |   await page.waitForSelector('[data-testid="add-template-btn"]');
  229 | 
  230 |   await page.click('[data-testid="add-template-btn"]');
  231 | 
  232 |   const cadenceSelect = page.locator('[data-testid="template-form-cadence"]');
  233 |   await expect(cadenceSelect).toBeVisible();
  234 | 
  235 |   const options = await cadenceSelect.locator("option").allTextContents();
  236 |   expect(options).toContain("Monthly");
  237 |   expect(options).toContain("Quarterly");
  238 |   expect(options).toContain("Yearly");
  239 |   expect(options).toHaveLength(3);
  240 | });
  241 | 
  242 | // AC4: Activate/deactivate toggle
  243 | test("AC4: active toggle deactivates an active template", async ({ page }) => {
  244 |   await page.goto("/recurring");
  245 |   await page.waitForFunction(() => {
  246 |     const list = document.querySelector('[data-testid="templates-list"]');
  247 |     return list && !list.textContent?.includes("Loading");
  248 |   });
  249 | 
  250 |   const toggle = page.locator(`[data-testid="template-toggle-${INTERNET_BILL_ID}"]`);
> 251 |   await expect(toggle).toHaveText("Active");
      |                       ^ Error: expect(locator).toHaveText(expected) failed
  252 | 
  253 |   // Deactivate
  254 |   await toggle.click();
  255 |   await expect(toggle).toHaveText("Inactive");
  256 | });
  257 | 
  258 | test("AC4: active toggle activates an inactive template", async ({ page }) => {
  259 |   await page.goto("/recurring");
  260 |   await page.waitForFunction(() => {
  261 |     const list = document.querySelector('[data-testid="templates-list"]');
  262 |     return list && !list.textContent?.includes("Loading");
  263 |   });
  264 | 
  265 |   const toggle = page.locator(`[data-testid="template-toggle-${INACTIVE_SERVICE_ID}"]`);
  266 |   await expect(toggle).toHaveText("Inactive");
  267 | 
  268 |   // Activate
  269 |   await toggle.click();
  270 |   await expect(toggle).toHaveText("Active");
  271 | });
  272 | 
  273 | // AC5 & AC7: Month creation materialises expenses + toast notification
  274 | test("AC5+AC7: creating a month materialises active monthly expenses and shows toast", async ({ page }) => {
  275 |   await page.goto("/");
  276 | 
  277 |   // Open Add Month modal via sidebar
  278 |   await page.waitForSelector('[data-testid="add-month-btn"]');
  279 |   await page.click('[data-testid="add-month-btn"]');
  280 | 
  281 |   // Select June 2026
  282 |   await page.waitForSelector('[data-testid="add-month-year"]');
  283 |   await page.selectOption('[data-testid="add-month-year"]', "2026");
  284 |   await page.selectOption('[data-testid="add-month-month"]', "6"); // June
  285 | 
  286 |   // Submit
  287 |   await page.click('button[type="submit"]');
  288 | 
  289 |   // Wait for toast to appear with the generation message
  290 |   const toast = page.locator('[role="status"]');
  291 |   await expect(toast).toBeVisible({ timeout: 10000 });
  292 |   await expect(toast).toContainText("recurring expense");
  293 |   await expect(toast).toContainText("generated — review and adjust");
  294 | 
  295 |   // Verify expenses were created via API
  296 |   const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.6`);
  297 |   expect(months.length).toBe(1);
  298 |   const newMonthId = months[0].id;
  299 | 
  300 |   const expenses = await apiGet(`expenses?month_id=eq.${newMonthId}`);
  301 |   // June 2026: Internet Bill (monthly) should generate
  302 |   // Quarterly Tax: month 6 is not a quarter month (1,4,7,10) — should NOT generate
  303 |   // Annual Insurance: yearly (start month 1), June != Jan — should NOT generate
  304 |   // Inactive Service: inactive — should NOT generate
  305 |   // Future Service: start 202801, June 2026 < 202801 — should NOT generate
  306 |   expect(expenses.length).toBe(1);
  307 |   expect(expenses[0].name).toBe("Internet Bill");
  308 | });
  309 | 
  310 | // AC5 (quarterly): July 2026 triggers quarterly + monthly
  311 | test("AC5: creating July 2026 materialises monthly AND quarterly expenses", async ({ page }) => {
  312 |   await page.goto("/");
  313 | 
  314 |   await page.waitForSelector('[data-testid="add-month-btn"]');
  315 |   await page.click('[data-testid="add-month-btn"]');
  316 | 
  317 |   await page.waitForSelector('[data-testid="add-month-year"]');
  318 |   await page.selectOption('[data-testid="add-month-year"]', "2026");
  319 |   await page.selectOption('[data-testid="add-month-month"]', "7"); // July
  320 | 
  321 |   await page.click('button[type="submit"]');
  322 | 
  323 |   // Wait for toast
  324 |   const toast = page.locator('[role="status"]');
  325 |   await expect(toast).toBeVisible({ timeout: 10000 });
  326 |   await expect(toast).toContainText("2 recurring expenses generated");
  327 | 
  328 |   // Verify via API
  329 |   const months = await apiGet(`months?household_id=eq.${HOUSEHOLD_ID}&year=eq.2026&month_num=eq.7`);
  330 |   expect(months.length).toBe(1);
  331 |   const expenses = await apiGet(`expenses?month_id=eq.${months[0].id}`);
  332 |   expect(expenses.length).toBe(2);
  333 |   const names = expenses.map((e: { name: string }) => e.name);
  334 |   expect(names).toContain("Internet Bill");
  335 |   expect(names).toContain("Quarterly Tax");
  336 | });
  337 | 
  338 | // AC6: Source matching — source_id is null when new month has no sources
  339 | test("AC6: generated expenses have null source_id when new month has no sources", async ({ page }) => {
  340 |   await page.goto("/");
  341 | 
  342 |   await page.waitForSelector('[data-testid="add-month-btn"]');
  343 |   await page.click('[data-testid="add-month-btn"]');
  344 | 
  345 |   await page.waitForSelector('[data-testid="add-month-year"]');
  346 |   await page.selectOption('[data-testid="add-month-year"]', "2026");
  347 |   await page.selectOption('[data-testid="add-month-month"]', "8"); // August
  348 | 
  349 |   await page.click('button[type="submit"]');
  350 | 
  351 |   // Wait for toast
```