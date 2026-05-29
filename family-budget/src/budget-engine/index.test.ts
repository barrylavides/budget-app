import { describe, it, expect } from "vitest";
import {
  expPaid,
  expStatus,
  expTotal,
  sourceRemaining,
  sourcesTotal,
  sourcesTotalAll,
  sourceEffectiveRemaining,
  type Expense,
  type Source,
  type Payment,
  type CarryOver,
} from "./index";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "exp-1",
    amount: 1000,
    sourceId: "src-1",
    payments: [],
    ...overrides,
  };
}

function makeSource(overrides: Partial<Source> = {}): Source {
  return {
    id: "src-1",
    balance: 50000,
    half: "half1",
    ...overrides,
  };
}

function makePayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: "pay-1",
    amount: 500,
    sourceId: "src-1",
    ...overrides,
  };
}

describe("expPaid", () => {
  it("returns 0 for an expense with no payments", () => {
    expect(expPaid(makeExpense())).toBe(0);
  });

  it("returns the sum of all payment amounts", () => {
    const expense = makeExpense({
      payments: [
        makePayment({ id: "p1", amount: 300 }),
        makePayment({ id: "p2", amount: 700 }),
      ],
    });
    expect(expPaid(expense)).toBe(1000);
  });

  it("handles multiple partial payments", () => {
    const expense = makeExpense({
      amount: 5000,
      payments: [
        makePayment({ id: "p1", amount: 1000 }),
        makePayment({ id: "p2", amount: 2000 }),
        makePayment({ id: "p3", amount: 500 }),
      ],
    });
    expect(expPaid(expense)).toBe(3500);
  });
});

describe("expStatus", () => {
  it('returns "unpaid" when there are no payments', () => {
    expect(expStatus(makeExpense())).toBe("unpaid");
  });

  it('returns "partial" when paid < amount', () => {
    const expense = makeExpense({
      amount: 1000,
      payments: [makePayment({ amount: 500 })],
    });
    expect(expStatus(expense)).toBe("partial");
  });

  it('returns "paid" when paid === amount', () => {
    const expense = makeExpense({
      amount: 1000,
      payments: [makePayment({ amount: 1000 })],
    });
    expect(expStatus(expense)).toBe("paid");
  });

  it('returns "overpaid" when paid > amount', () => {
    const expense = makeExpense({
      amount: 1000,
      payments: [makePayment({ amount: 1200 })],
    });
    expect(expStatus(expense)).toBe("overpaid");
  });
});

describe("expTotal", () => {
  it("returns 0 for empty expense list", () => {
    expect(expTotal([])).toBe(0);
  });

  it("sums all expense amounts", () => {
    const expenses = [
      makeExpense({ id: "e1", amount: 3500 }),
      makeExpense({ id: "e2", amount: 1500 }),
      makeExpense({ id: "e3", amount: 8000 }),
    ];
    expect(expTotal(expenses)).toBe(13000);
  });
});

describe("sourceRemaining", () => {
  it("returns full balance when no payments drawn from it", () => {
    const source = makeSource({ balance: 40000 });
    expect(sourceRemaining(source, [])).toBe(40000);
  });

  it("deducts only payments belonging to this source", () => {
    const source = makeSource({ id: "src-1", balance: 40000 });
    const payments: Payment[] = [
      makePayment({ id: "p1", sourceId: "src-1", amount: 5000 }),
      makePayment({ id: "p2", sourceId: "src-1", amount: 3000 }),
      makePayment({ id: "p3", sourceId: "src-2", amount: 9999 }),
    ];
    expect(sourceRemaining(source, payments)).toBe(32000);
  });

  it("allows negative remaining (overspent)", () => {
    const source = makeSource({ balance: 1000 });
    const payments: Payment[] = [makePayment({ amount: 1500 })];
    expect(sourceRemaining(source, payments)).toBe(-500);
  });

  it("returns balance unchanged when payments are for other sources", () => {
    const source = makeSource({ id: "src-A", balance: 20000 });
    const payments: Payment[] = [
      makePayment({ id: "p1", sourceId: "src-B", amount: 5000 }),
    ];
    expect(sourceRemaining(source, payments)).toBe(20000);
  });
});

describe("sourcesTotal", () => {
  it("returns 0 for empty list", () => {
    expect(sourcesTotal([])).toBe(0);
  });

  it("sums balances of all sources", () => {
    const sources = [
      makeSource({ id: "s1", balance: 40000 }),
      makeSource({ id: "s2", balance: 35000 }),
      makeSource({ id: "s3", balance: 10000 }),
    ];
    expect(sourcesTotal(sources)).toBe(85000);
  });

  it("handles a single source", () => {
    const sources = [makeSource({ id: "s1", balance: 12345 })];
    expect(sourcesTotal(sources)).toBe(12345);
  });
});

describe("sourcesTotalAll", () => {
  it("returns 0 for empty list", () => {
    expect(sourcesTotalAll([])).toBe(0);
  });

  it("sums balances of all sources regardless of half", () => {
    const sources = [
      makeSource({ id: "s1", balance: 40000, half: "half1" }),
      makeSource({ id: "s2", balance: 35000, half: "half2" }),
      makeSource({ id: "s3", balance: 10000, half: "both" }),
    ];
    expect(sourcesTotalAll(sources)).toBe(85000);
  });

  it("sums mixed halves correctly", () => {
    const sources = [
      makeSource({ id: "s1", balance: 50000, half: "half1" }),
      makeSource({ id: "s2", balance: 50000, half: "half2" }),
      makeSource({ id: "s3", balance: 5000, half: "both" }),
    ];
    expect(sourcesTotalAll(sources)).toBe(105000);
  });

  it("handles a single source", () => {
    const sources = [makeSource({ id: "s1", balance: 99999 })];
    expect(sourcesTotalAll(sources)).toBe(99999);
  });
});

describe("sourceEffectiveRemaining", () => {
  it("equals sourceRemaining when no carry-overs", () => {
    const source = makeSource({ balance: 40000 });
    const payments: Payment[] = [makePayment({ amount: 5000 })];
    expect(sourceEffectiveRemaining(source, payments, [])).toBe(35000);
  });

  it("deducts only unresolved carry-overs", () => {
    const source = makeSource({ id: "src-1", balance: 50000 });
    const payments: Payment[] = [];
    const carryOvers: CarryOver[] = [
      { id: "co1", amount: 5000, sourceId: "src-1", resolvedAt: null },
      { id: "co2", amount: 3000, sourceId: "src-1", resolvedAt: "2026-05-01" },
      { id: "co3", amount: 2000, sourceId: "src-2", resolvedAt: null },
    ];
    expect(sourceEffectiveRemaining(source, payments, carryOvers)).toBe(45000);
  });

  it("combines payment deductions with carry-over deductions", () => {
    const source = makeSource({ id: "src-1", balance: 40000 });
    const payments: Payment[] = [makePayment({ sourceId: "src-1", amount: 10000 })];
    const carryOvers: CarryOver[] = [
      { id: "co1", amount: 5000, sourceId: "src-1", resolvedAt: null },
    ];
    expect(sourceEffectiveRemaining(source, payments, carryOvers)).toBe(25000);
  });

  it("handles zero-balance source", () => {
    const source = makeSource({ balance: 0 });
    expect(sourceEffectiveRemaining(source, [], [])).toBe(0);
  });
});
