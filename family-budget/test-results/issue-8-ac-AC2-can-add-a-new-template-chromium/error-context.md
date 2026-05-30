# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: issue-8-ac.spec.ts >> AC2: can add a new template
- Location: e2e/issue-8-ac.spec.ts:152:0

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: waitForSelector: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[data-testid="add-template-btn"]') to be visible

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]: FB
      - generic [ref=e7]:
        - generic [ref=e8]: FamilyBudget
        - generic [ref=e9]: Expense Tracker
    - generic [ref=e10]: Phase 1
  - generic [ref=e11]:
    - complementary [ref=e12]:
      - generic [ref=e13]:
        - generic [ref=e14]: Months
        - generic [ref=e15]:
          - button "Add month" [ref=e16] [cursor=pointer]: +
          - button "Collapse sidebar" [ref=e17] [cursor=pointer]: ←
      - generic [ref=e18]:
        - link "↻ Recurring" [ref=e20] [cursor=pointer]:
          - /url: /recurring
          - generic [ref=e21]: ↻
          - generic [ref=e22]: Recurring
        - link "◎ Statistics" [ref=e23] [cursor=pointer]:
          - /url: /statistics
          - generic [ref=e24]: ◎
          - generic [ref=e25]: Statistics
    - main [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: Templates
          - heading "Recurring Expenses" [level=1] [ref=e31]
        - generic [ref=e33]: No recurring templates yet. Add one to auto-generate expenses when creating new months.
```

# Test source

```ts
  54  |     `months?household_id=eq.${HOUSEHOLD_ID}&id=neq.00000000-0000-0000-0000-000000000010`
  55  |   );
  56  | }
  57  | 
  58  | // Fully reset all seed templates to their original values
  59  | async function resetSeedTemplates() {
  60  |   const seeds = [
  61  |     { id: INTERNET_BILL_ID,    name: "Internet Bill",    category: "Utilities", half: "half1", default_amount: 1500, default_source_name: "Wife Payroll",  tag: "needs", cadence: "monthly",   active: true,  start_year_month: 202601 },
  62  |     { id: QUARTERLY_TAX_ID,    name: "Quarterly Tax",    category: "Bills",     half: "half2", default_amount: 2000, default_source_name: null,            tag: "needs", cadence: "quarterly", active: true,  start_year_month: 202601 },
  63  |     { id: ANNUAL_INSURANCE_ID, name: "Annual Insurance", category: "Bills",     half: "half1", default_amount: 5000, default_source_name: "Barry Payroll", tag: "needs", cadence: "yearly",    active: true,  start_year_month: 202601 },
  64  |     { id: INACTIVE_SERVICE_ID, name: "Inactive Service", category: "Bills",     half: "half1", default_amount:  500, default_source_name: null,            tag: "needs", cadence: "monthly",   active: false, start_year_month: 202601 },
  65  |     { id: FUTURE_SERVICE_ID,   name: "Future Service",   category: "Bills",     half: "half1", default_amount:  750, default_source_name: null,            tag: "needs", cadence: "monthly",   active: true,  start_year_month: 202801 },
  66  |   ];
  67  |   await Promise.all(
  68  |     seeds.map(({ id, ...fields }) =>
  69  |       fetch(`${SUPABASE_URL}/rest/v1/recurring_expense_templates?id=eq.${id}`, {
  70  |         method: "PATCH",
  71  |         headers: {
  72  |           apikey: SERVICE_ROLE_KEY,
  73  |           Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  74  |           "Content-Type": "application/json",
  75  |         },
  76  |         body: JSON.stringify(fields),
  77  |       })
  78  |     )
  79  |   );
  80  | }
  81  | 
  82  | // Clean up test-created templates (keep seeded ones)
  83  | async function cleanupTestTemplates() {
  84  |   const seedIds = [
  85  |     INTERNET_BILL_ID,
  86  |     QUARTERLY_TAX_ID,
  87  |     ANNUAL_INSURANCE_ID,
  88  |     INACTIVE_SERVICE_ID,
  89  |     FUTURE_SERVICE_ID,
  90  |   ].join(",");
  91  |   await apiDelete(
  92  |     `recurring_expense_templates?household_id=eq.${HOUSEHOLD_ID}&id=not.in.(${seedIds})`
  93  |   );
  94  | }
  95  | 
  96  | test.beforeEach(async () => {
  97  |   await Promise.all([cleanupTestMonths(), cleanupTestTemplates()]);
  98  |   await resetSeedTemplates();
  99  | });
  100 | 
  101 | test.afterEach(async () => {
  102 |   await Promise.all([cleanupTestMonths(), cleanupTestTemplates()]);
  103 | });
  104 | 
  105 | // AC1: /recurring page lists all templates with: name, category, half, amount, cadence, tag, active toggle
  106 | test("AC1: /recurring page lists templates with name, category, half, amount, cadence, tag, active toggle", async ({ page }) => {
  107 |   await page.goto("/recurring");
  108 | 
  109 |   // Wait for templates to load
  110 |   await page.waitForSelector('[data-testid="templates-list"]');
  111 |   await page.waitForFunction(() => {
  112 |     const list = document.querySelector('[data-testid="templates-list"]');
  113 |     return list && !list.textContent?.includes("Loading");
  114 |   });
  115 | 
  116 |   // Check that seeded templates are visible
  117 |   const list = page.locator('[data-testid="templates-list"]');
  118 |   await expect(list).toBeVisible();
  119 | 
  120 |   // Verify "Internet Bill" appears
  121 |   const internetBillRow = page.locator(`[data-testid="template-name-${INTERNET_BILL_ID}"]`);
  122 |   await expect(internetBillRow).toBeVisible();
  123 |   await expect(internetBillRow).toHaveText("Internet Bill");
  124 | 
  125 |   // Verify category column is shown
  126 |   const category = page.locator(`[data-testid="template-category-${INTERNET_BILL_ID}"]`);
  127 |   await expect(category).toHaveText("Utilities");
  128 | 
  129 |   // Verify half column
  130 |   const half = page.locator(`[data-testid="template-half-${INTERNET_BILL_ID}"]`);
  131 |   await expect(half).toHaveText("1st Half");
  132 | 
  133 |   // Verify amount column
  134 |   const amount = page.locator(`[data-testid="template-amount-${INTERNET_BILL_ID}"]`);
  135 |   await expect(amount).toContainText("1,500.00");
  136 | 
  137 |   // Verify cadence column
  138 |   const cadence = page.locator(`[data-testid="template-cadence-${INTERNET_BILL_ID}"]`);
  139 |   await expect(cadence).toHaveText("Monthly");
  140 | 
  141 |   // Verify tag column
  142 |   const tag = page.locator(`[data-testid="template-tag-${INTERNET_BILL_ID}"]`);
  143 |   await expect(tag).toHaveText("needs");
  144 | 
  145 |   // Verify active toggle button is visible
  146 |   const toggle = page.locator(`[data-testid="template-toggle-${INTERNET_BILL_ID}"]`);
  147 |   await expect(toggle).toBeVisible();
  148 |   await expect(toggle).toHaveText("Active");
  149 | });
  150 | 
  151 | // AC2: Add/edit/delete templates
  152 | test("AC2: can add a new template", async ({ page }) => {
  153 |   await page.goto("/recurring");
> 154 |   await page.waitForSelector('[data-testid="add-template-btn"]');
      |             ^ Error: waitForSelector: Test timeout of 30000ms exceeded.
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
  251 |   await expect(toggle).toHaveText("Active");
  252 | 
  253 |   // Deactivate
  254 |   await toggle.click();
```