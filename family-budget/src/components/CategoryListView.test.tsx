import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryListView } from "./CategoryListView";
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

describe("CategoryListView", () => {
  it("shows empty state when no expenses", () => {
    render(<CategoryListView expenses={[]} onCategoryClick={vi.fn()} />);
    expect(screen.getByText(/No expenses yet/i)).toBeTruthy();
  });

  it("renders rows for categories with expenses", () => {
    const expenses = [
      makeExpense({ id: "e1", category: "Food", amount: 500 }),
      makeExpense({ id: "e2", category: "Bills", amount: 1200 }),
    ];
    render(<CategoryListView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.getByTestId("category-row-Food")).toBeTruthy();
    expect(screen.getByTestId("category-row-Bills")).toBeTruthy();
  });

  it("calls onCategoryClick when row is clicked", () => {
    const onClick = vi.fn();
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryListView expenses={expenses} onCategoryClick={onClick} />);
    fireEvent.click(screen.getByTestId("category-row-Food"));
    expect(onClick).toHaveBeenCalledWith("Food");
  });

  it("renders the list container", () => {
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryListView expenses={expenses} onCategoryClick={vi.fn()} />);
    expect(screen.getByTestId("category-list")).toBeTruthy();
  });

  it("shows chevron icon for each row", () => {
    const expenses = [makeExpense({ id: "e1", category: "Food", amount: 500 })];
    render(<CategoryListView expenses={expenses} onCategoryClick={vi.fn()} />);
    const row = screen.getByTestId("category-row-Food");
    expect(row.textContent).toContain("›");
  });
});
