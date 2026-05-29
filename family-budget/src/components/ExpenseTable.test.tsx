import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ExpenseTable } from "./ExpenseTable";
import type { ExpenseRow, SourceRow } from "@/hooks/useExpenses";

function makeExpense(overrides: Partial<ExpenseRow>): ExpenseRow {
  return {
    id: "e1",
    name: "Electricity",
    category: "Utilities",
    half: "half1",
    amount: 2500,
    month_id: "m1",
    source_id: "s1",
    tag: "needs",
    created_at: new Date().toISOString(),
    created_by: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeSource(overrides: Partial<SourceRow>): SourceRow {
  return {
    id: "s1",
    name: "Savings Account",
    half: "half1",
    balance: 50000,
    month_id: "m1",
    type: "savings",
    account_label: null,
    created_at: new Date().toISOString(),
    created_by: null,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe("ExpenseTable", () => {
  it("shows empty state when no expenses", () => {
    render(<ExpenseTable expenses={[]} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText(/No expenses in this category/i)).toBeTruthy();
  });

  it("renders the table container", () => {
    const expenses = [makeExpense({ id: "e1" })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByTestId("expense-table")).toBeTruthy();
  });

  it("renders expense name", () => {
    const expenses = [makeExpense({ id: "e1", name: "Internet Bill" })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Internet Bill")).toBeTruthy();
  });

  it("renders expense amount in currency format", () => {
    const expenses = [makeExpense({ id: "e1", amount: 2500 })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("₱2,500.00")).toBeTruthy();
  });

  it("shows source name when source is present", () => {
    const expenses = [makeExpense({ id: "e1", source_id: "s1" })];
    const sources = [makeSource({ id: "s1", name: "Savings Account" })];
    render(<ExpenseTable expenses={expenses} sources={sources} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("Savings Account")).toBeTruthy();
  });

  it("shows dash when no source", () => {
    const expenses = [makeExpense({ id: "e1", source_id: null })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    const row = screen.getByTestId("expense-row-e1");
    // Shows — for source
    expect(row.textContent).toContain("—");
  });

  it("shows tag pill when tag is set", () => {
    const expenses = [makeExpense({ id: "e1", tag: "needs" })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("needs")).toBeTruthy();
  });

  it("shows unpaid status (stub)", () => {
    const expenses = [makeExpense({ id: "e1" })];
    render(<ExpenseTable expenses={expenses} sources={[]} onEdit={vi.fn()} onDelete={vi.fn()} />);
    expect(screen.getByText("unpaid")).toBeTruthy();
  });

  it("calls onEdit when edit button is clicked", () => {
    const onEdit = vi.fn();
    const expense = makeExpense({ id: "e1" });
    render(<ExpenseTable expenses={[expense]} sources={[]} onEdit={onEdit} onDelete={vi.fn()} />);
    const editBtn = screen.getByTestId("edit-expense-e1");
    fireEvent.click(editBtn);
    expect(onEdit).toHaveBeenCalledWith(expense);
  });

  it("calls onDelete when delete button is clicked", () => {
    const onDelete = vi.fn();
    const expense = makeExpense({ id: "e1" });
    render(
      <ExpenseTable expenses={[expense]} sources={[]} onEdit={vi.fn()} onDelete={onDelete} />
    );
    const deleteBtn = screen.getByTestId("delete-expense-e1");
    fireEvent.click(deleteBtn);
    expect(onDelete).toHaveBeenCalledWith(expense);
  });
});
