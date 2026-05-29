import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryGridView } from "./CategoryGridView";
import type { ExpenseRow } from "@/hooks/useExpenses";

function makeExpense(overrides: Partial<ExpenseRow>): ExpenseRow {
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

describe("CategoryGridView", () => {
  it("shows empty state when no expenses", () => {
    render(<CategoryGridView expenses={[]} onCategoryClick={vi.fn()} />);
    expect(screen.getByText(/No expenses yet/i)).toBeTruthy();
  });

  it("renders category cards for categories with expenses", () => {
    const expenses = [
      makeExpense({ id: "e1", category: "Food", amount: 500 }),
      makeExpense({ id: "e2", category: "Bills", amount: 1200 }),
    ];
    render(<CategoryGridView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.getByTestId("category-card-Food")).toBeTruthy();
    expect(screen.getByTestId("category-card-Bills")).toBeTruthy();
  });

  it("does not render empty category cards", () => {
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryGridView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.queryByTestId("category-card-Bills")).toBeNull();
  });

  it("shows expense count in card", () => {
    const expenses = [
      makeExpense({ id: "e1", category: "Food", amount: 500 }),
      makeExpense({ id: "e2", category: "Food", amount: 300 }),
    ];
    render(<CategoryGridView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.getByText("2 expenses")).toBeTruthy();
  });

  it("calls onCategoryClick when card is clicked", () => {
    const onClick = vi.fn();
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryGridView expenses={expenses} onCategoryClick={onClick} />);
    fireEvent.click(screen.getByTestId("category-card-Food"));
    expect(onClick).toHaveBeenCalledWith("Food");
  });

  it("renders the grid container", () => {
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryGridView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.getByTestId("category-grid")).toBeTruthy();
  });
});
