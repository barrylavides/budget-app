import { describe, it, expect } from "vitest";
import {
  shouldGenerate,
  matchSourceByName,
  generateExpenses,
  type RecurringTemplate,
  type SourceStub,
} from "./recurring";

function makeTemplate(overrides: Partial<RecurringTemplate> = {}): RecurringTemplate {
  return {
    id: "tpl-1",
    name: "Electric Bill",
    category: "Utilities",
    half: "half1",
    default_amount: 3500,
    default_source_name: "Wife Payroll",
    tag: "needs",
    cadence: "monthly",
    active: true,
    start_year_month: 202601,
    ...overrides,
  };
}

const SOURCES: SourceStub[] = [
  { id: "src-1", name: "Wife Payroll" },
  { id: "src-2", name: "Barry Payroll" },
  { id: "src-3", name: "Savings Fund" },
];

describe("shouldGenerate — monthly cadence", () => {
  it("generates for every month of the year", () => {
    const t = makeTemplate({ cadence: "monthly" });
    for (let m = 1; m <= 12; m++) {
      expect(shouldGenerate(t, 2026, m)).toBe(true);
    }
  });

  it("generates in subsequent years too", () => {
    const t = makeTemplate({ cadence: "monthly" });
    expect(shouldGenerate(t, 2027, 3)).toBe(true);
  });
});

describe("shouldGenerate — quarterly cadence", () => {
  it("generates on months 1, 4, 7, 10", () => {
    const t = makeTemplate({ cadence: "quarterly" });
    expect(shouldGenerate(t, 2026, 1)).toBe(true);
    expect(shouldGenerate(t, 2026, 4)).toBe(true);
    expect(shouldGenerate(t, 2026, 7)).toBe(true);
    expect(shouldGenerate(t, 2026, 10)).toBe(true);
  });

  it("does not generate on non-quarter months", () => {
    const t = makeTemplate({ cadence: "quarterly" });
    [2, 3, 5, 6, 8, 9, 11, 12].forEach((m) => {
      expect(shouldGenerate(t, 2026, m)).toBe(false);
    });
  });
});

describe("shouldGenerate — yearly cadence", () => {
  it("generates once on the start month number each year", () => {
    const t = makeTemplate({ cadence: "yearly", start_year_month: 202603 });
    expect(shouldGenerate(t, 2026, 3)).toBe(true);
    expect(shouldGenerate(t, 2027, 3)).toBe(true);
  });

  it("does not generate on other months in the year", () => {
    const t = makeTemplate({ cadence: "yearly", start_year_month: 202603 });
    [1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((m) => {
      expect(shouldGenerate(t, 2026, m)).toBe(false);
    });
  });
});

describe("shouldGenerate — inactive templates", () => {
  it("skips inactive monthly template", () => {
    const t = makeTemplate({ active: false, cadence: "monthly" });
    expect(shouldGenerate(t, 2026, 5)).toBe(false);
  });

  it("skips inactive quarterly template on a quarter month", () => {
    const t = makeTemplate({ active: false, cadence: "quarterly" });
    expect(shouldGenerate(t, 2026, 4)).toBe(false);
  });

  it("skips inactive yearly template on the correct month", () => {
    const t = makeTemplate({ active: false, cadence: "yearly", start_year_month: 202601 });
    expect(shouldGenerate(t, 2026, 1)).toBe(false);
  });
});

describe("shouldGenerate — start_year_month gate", () => {
  it("does not generate for months before start_year_month", () => {
    const t = makeTemplate({ start_year_month: 202606, cadence: "monthly" });
    expect(shouldGenerate(t, 2026, 5)).toBe(false);
    expect(shouldGenerate(t, 2026, 1)).toBe(false);
    expect(shouldGenerate(t, 2025, 12)).toBe(false);
  });

  it("generates on the exact start_year_month", () => {
    const t = makeTemplate({ start_year_month: 202605, cadence: "monthly" });
    expect(shouldGenerate(t, 2026, 5)).toBe(true);
  });

  it("generates for all months after start_year_month", () => {
    const t = makeTemplate({ start_year_month: 202605, cadence: "monthly" });
    expect(shouldGenerate(t, 2026, 6)).toBe(true);
    expect(shouldGenerate(t, 2027, 1)).toBe(true);
  });
});

describe("matchSourceByName", () => {
  it("matches source by exact name", () => {
    expect(matchSourceByName(SOURCES, "Wife Payroll")).toBe("src-1");
    expect(matchSourceByName(SOURCES, "Barry Payroll")).toBe("src-2");
    expect(matchSourceByName(SOURCES, "Savings Fund")).toBe("src-3");
  });

  it("matches case-insensitively", () => {
    expect(matchSourceByName(SOURCES, "wife payroll")).toBe("src-1");
    expect(matchSourceByName(SOURCES, "WIFE PAYROLL")).toBe("src-1");
    expect(matchSourceByName(SOURCES, "barry payroll")).toBe("src-2");
  });

  it("returns null when no source matches", () => {
    expect(matchSourceByName(SOURCES, "No Such Source")).toBeNull();
  });

  it("returns null when name is null", () => {
    expect(matchSourceByName(SOURCES, null)).toBeNull();
  });

  it("returns null for empty source list", () => {
    expect(matchSourceByName([], "Wife Payroll")).toBeNull();
  });
});

describe("generateExpenses", () => {
  const templates: RecurringTemplate[] = [
    makeTemplate({ id: "tpl-1", name: "Electric Bill", cadence: "monthly", default_source_name: "Wife Payroll", default_amount: 3500 }),
    makeTemplate({ id: "tpl-2", name: "Quarterly Fee", cadence: "quarterly", default_source_name: "Barry Payroll", default_amount: 1000 }),
    makeTemplate({ id: "tpl-3", name: "Annual Insurance", cadence: "yearly", start_year_month: 202601, default_source_name: "Barry Payroll", default_amount: 5000 }),
    makeTemplate({ id: "tpl-4", name: "Inactive Bill", cadence: "monthly", active: false, default_source_name: null, default_amount: 500 }),
  ];

  it("generates monthly expenses for every month", () => {
    const result = generateExpenses(templates, "month-1", 2026, 5, SOURCES);
    expect(result.map((e) => e.name)).toContain("Electric Bill");
  });

  it("does not include quarterly on non-quarter months", () => {
    const result = generateExpenses(templates, "month-1", 2026, 5, SOURCES);
    expect(result.map((e) => e.name)).not.toContain("Quarterly Fee");
  });

  it("includes quarterly on quarter months (month 4)", () => {
    const result = generateExpenses(templates, "month-1", 2026, 4, SOURCES);
    expect(result.map((e) => e.name)).toContain("Quarterly Fee");
  });

  it("includes yearly on the correct month", () => {
    const result = generateExpenses(templates, "month-1", 2026, 1, SOURCES);
    expect(result.map((e) => e.name)).toContain("Annual Insurance");
  });

  it("does not include yearly on wrong months", () => {
    const result = generateExpenses(templates, "month-1", 2026, 5, SOURCES);
    expect(result.map((e) => e.name)).not.toContain("Annual Insurance");
  });

  it("skips inactive templates", () => {
    const result = generateExpenses(templates, "month-1", 2026, 5, SOURCES);
    expect(result.map((e) => e.name)).not.toContain("Inactive Bill");
  });

  it("matches source_id by name", () => {
    const result = generateExpenses(templates, "month-1", 2026, 5, SOURCES);
    const electric = result.find((e) => e.name === "Electric Bill");
    expect(electric?.source_id).toBe("src-1");
  });

  it("sets null source_id when no name match", () => {
    const noMatch: RecurringTemplate[] = [
      makeTemplate({ default_source_name: "Nonexistent Bank", cadence: "monthly" }),
    ];
    const result = generateExpenses(noMatch, "month-1", 2026, 5, SOURCES);
    expect(result[0].source_id).toBeNull();
  });

  it("sets null source_id when default_source_name is null", () => {
    const noName: RecurringTemplate[] = [
      makeTemplate({ default_source_name: null, cadence: "monthly" }),
    ];
    const result = generateExpenses(noName, "month-1", 2026, 5, SOURCES);
    expect(result[0].source_id).toBeNull();
  });

  it("sets the correct month_id on generated expenses", () => {
    const result = generateExpenses(templates, "my-month-id", 2026, 5, SOURCES);
    result.forEach((e) => expect(e.month_id).toBe("my-month-id"));
  });

  it("returns empty array when all templates are inactive", () => {
    const inactive = templates.map((t) => ({ ...t, active: false }));
    const result = generateExpenses(inactive, "month-1", 2026, 5, SOURCES);
    expect(result).toHaveLength(0);
  });
});
