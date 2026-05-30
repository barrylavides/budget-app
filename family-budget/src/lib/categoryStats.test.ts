import { describe, it, expect } from "vitest";
import { computeCategoryStats } from "./categoryStats";
import type { ExpenseRow } from "@/hooks/useExpenses";

function makeExpenseRow(overrides: Partial<ExpenseRow>): ExpenseRow {
  return {
    id: "e1",
    name: "Test",
    category: "Food",
    half: "half1",
    amount: 1000,
    month_id: "m1",
    source_id: null,
    tag: null,
    created_at: new Date().toISOString(),
    created_by: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("computeCategoryStats", () => {
  it("returns all 8 categories", () => {
    const stats = computeCategoryStats([]);
    expect(stats.length).toBe(8);
  });

  it("returns zero count and total for empty expenses", () => {
    const stats = computeCategoryStats([]);
    for (const s of stats) {
      expect(s.count).toBe(0);
      expect(s.total).toBe(0);
    }
  });

  it("correctly sums amounts per category", () => {
    const expenses: ExpenseRow[] = [
      makeExpenseRow({ id: "e1", category: "Food", amount: 500 }),
      makeExpenseRow({ id: "e2", category: "Food", amount: 300 }),
      makeExpenseRow({ id: "e3", category: "Bills", amount: 1200 }),
    ];
    const stats = computeCategoryStats(expenses);
    const food = stats.find((s) => s.category === "Food")!;
    const bills = stats.find((s) => s.category === "Bills")!;
    const utilities = stats.find((s) => s.category === "Utilities")!;

    expect(food.count).toBe(2);
    expect(food.total).toBe(800);
    expect(bills.count).toBe(1);
    expect(bills.total).toBe(1200);
    expect(utilities.count).toBe(0);
    expect(utilities.total).toBe(0);
  });

  it("returns correct icon for each category", () => {
    const stats = computeCategoryStats([]);
    const food = stats.find((s) => s.category === "Food")!;
    expect(food.icon).toBe("🍽");

    const bills = stats.find((s) => s.category === "Bills")!;
    expect(bills.icon).toBe("🧾");
  });

  it("stubs paid as 0", () => {
    const expenses: ExpenseRow[] = [
      makeExpenseRow({ id: "e1", category: "Food", amount: 500 }),
    ];
    const stats = computeCategoryStats(expenses);
    const food = stats.find((s) => s.category === "Food")!;
    expect(food.paid).toBe(0);
  });
});
