import { describe, it, expect } from "vitest";
import {
  aggregateByCategory,
  aggregateByTag,
  computeStatsSummary,
  type StatsExpense,
  type StatsSource,
} from "./statistics";

describe("aggregateByCategory", () => {
  it("returns empty array for empty input", () => {
    expect(aggregateByCategory([])).toEqual([]);
  });

  it("single-category month returns 100%", () => {
    const expenses: StatsExpense[] = [
      { amount: 500, category: "Food", tag: null },
      { amount: 300, category: "Food", tag: "groceries" },
    ];
    const result = aggregateByCategory(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe("Food");
    expect(result[0].amount).toBe(800);
    expect(result[0].percentage).toBe(100);
  });

  it("percentage rounding sums to 100% with multiple categories", () => {
    // Three categories with amounts that produce non-round percentages
    const expenses: StatsExpense[] = [
      { amount: 100, category: "Food", tag: null },
      { amount: 100, category: "Rent", tag: null },
      { amount: 100, category: "Transport", tag: null },
    ];
    const result = aggregateByCategory(expenses);
    const total = result.reduce((s, r) => s + r.percentage, 0);
    expect(total).toBe(100);
  });

  it("percentage rounding sums to 100% with uneven split", () => {
    // 1/3 each — classic largest-remainder scenario
    const expenses: StatsExpense[] = [
      { amount: 1, category: "A", tag: null },
      { amount: 1, category: "B", tag: null },
      { amount: 1, category: "C", tag: null },
    ];
    const result = aggregateByCategory(expenses);
    const total = result.reduce((s, r) => s + r.percentage, 0);
    expect(total).toBe(100);
  });

  it("sorts by amount descending", () => {
    const expenses: StatsExpense[] = [
      { amount: 50, category: "Coffee", tag: null },
      { amount: 500, category: "Rent", tag: null },
      { amount: 200, category: "Food", tag: null },
    ];
    const result = aggregateByCategory(expenses);
    expect(result[0].category).toBe("Rent");
    expect(result[1].category).toBe("Food");
    expect(result[2].category).toBe("Coffee");
  });
});

describe("aggregateByTag", () => {
  it("returns empty array for empty input", () => {
    expect(aggregateByTag([])).toEqual([]);
  });

  it("expenses with no tags returns untagged group", () => {
    const expenses: StatsExpense[] = [
      { amount: 100, category: "Food", tag: null },
      { amount: 200, category: "Rent", tag: null },
    ];
    const result = aggregateByTag(expenses);
    expect(result).toHaveLength(1);
    expect(result[0].tag).toBe("untagged");
    expect(result[0].amount).toBe(300);
    expect(result[0].percentage).toBe(100);
  });

  it("groups null tags as untagged alongside named tags", () => {
    const expenses: StatsExpense[] = [
      { amount: 100, category: "Food", tag: "essentials" },
      { amount: 50, category: "Coffee", tag: null },
      { amount: 50, category: "Snacks", tag: null },
    ];
    const result = aggregateByTag(expenses);
    const essentials = result.find((r) => r.tag === "essentials");
    const untagged = result.find((r) => r.tag === "untagged");
    expect(essentials).toBeDefined();
    expect(untagged).toBeDefined();
    expect(untagged!.amount).toBe(100);
    const total = result.reduce((s, r) => s + r.percentage, 0);
    expect(total).toBe(100);
  });

  it("percentage rounding sums to 100%", () => {
    const expenses: StatsExpense[] = [
      { amount: 1, category: "A", tag: "x" },
      { amount: 1, category: "B", tag: "y" },
      { amount: 1, category: "C", tag: "z" },
    ];
    const result = aggregateByTag(expenses);
    const total = result.reduce((s, r) => s + r.percentage, 0);
    expect(total).toBe(100);
  });

  it("sorts by amount descending", () => {
    const expenses: StatsExpense[] = [
      { amount: 10, category: "A", tag: "small" },
      { amount: 200, category: "B", tag: "large" },
    ];
    const result = aggregateByTag(expenses);
    expect(result[0].tag).toBe("large");
    expect(result[1].tag).toBe("small");
  });
});

describe("computeStatsSummary", () => {
  it("empty month produces zero totals", () => {
    const summary = computeStatsSummary([], []);
    expect(summary).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netRemaining: 0,
    });
  });

  it("sums sources as totalIncome", () => {
    const sources: StatsSource[] = [{ balance: 1000 }, { balance: 500 }];
    const summary = computeStatsSummary(sources, []);
    expect(summary.totalIncome).toBe(1500);
    expect(summary.totalExpenses).toBe(0);
    expect(summary.netRemaining).toBe(1500);
  });

  it("sums expense amounts as totalExpenses", () => {
    const expenses: StatsExpense[] = [
      { amount: 300, category: "Rent", tag: null },
      { amount: 100, category: "Food", tag: null },
    ];
    const summary = computeStatsSummary([], expenses);
    expect(summary.totalIncome).toBe(0);
    expect(summary.totalExpenses).toBe(400);
    expect(summary.netRemaining).toBe(-400);
  });

  it("computes netRemaining = totalIncome - totalExpenses", () => {
    const sources: StatsSource[] = [{ balance: 2000 }];
    const expenses: StatsExpense[] = [
      { amount: 800, category: "Rent", tag: null },
      { amount: 200, category: "Food", tag: null },
    ];
    const summary = computeStatsSummary(sources, expenses);
    expect(summary.totalIncome).toBe(2000);
    expect(summary.totalExpenses).toBe(1000);
    expect(summary.netRemaining).toBe(1000);
  });
});
