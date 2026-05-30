/**
 * Tests verifying the budget-engine exports required by issue #5:
 * - expTotal(): sums budgeted amounts across a list of expenses
 * - expPaid(): returns total paid (uses payments; stubs return 0 when no payments)
 * - expStatus(): returns payment status
 *
 * These are already implemented; this file validates the exported API contract
 * explicitly for the issue acceptance criterion.
 */
import { describe, it, expect } from "vitest";
import { expTotal, expPaid, expStatus, type Expense } from "./index";

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "e1",
    amount: 1000,
    sourceId: "s1",
    half: "half1",
    payments: [],
    ...overrides,
  };
}

describe("issue #5 budget-engine contract", () => {
  describe("expTotal()", () => {
    it("is exported and callable", () => {
      expect(typeof expTotal).toBe("function");
    });

    it("returns 0 for empty list", () => {
      expect(expTotal([])).toBe(0);
    });

    it("sums budgeted amounts", () => {
      expect(
        expTotal([
          makeExpense({ id: "e1", amount: 500 }),
          makeExpense({ id: "e2", amount: 1500 }),
        ])
      ).toBe(2000);
    });
  });

  describe("expPaid()", () => {
    it("is exported and callable", () => {
      expect(typeof expPaid).toBe("function");
    });

    it("returns 0 when expense has no payments (stub case)", () => {
      expect(expPaid(makeExpense({ payments: [] }))).toBe(0);
    });

    it("returns sum of payments when payments exist", () => {
      const expense = makeExpense({
        payments: [
          { id: "p1", amount: 300, sourceId: "s1" },
          { id: "p2", amount: 200, sourceId: "s1" },
        ],
      });
      expect(expPaid(expense)).toBe(500);
    });
  });

  describe("expStatus()", () => {
    it("is exported and callable", () => {
      expect(typeof expStatus).toBe("function");
    });

    it('returns "unpaid" for stub case (no payments)', () => {
      expect(expStatus(makeExpense({ payments: [] }))).toBe("unpaid");
    });

    it('returns "partial" when paid < amount', () => {
      const expense = makeExpense({
        amount: 1000,
        payments: [{ id: "p1", amount: 400, sourceId: "s1" }],
      });
      expect(expStatus(expense)).toBe("partial");
    });

    it('returns "paid" when fully paid', () => {
      const expense = makeExpense({
        amount: 1000,
        payments: [{ id: "p1", amount: 1000, sourceId: "s1" }],
      });
      expect(expStatus(expense)).toBe("paid");
    });
  });
});
