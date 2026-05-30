import { useState } from "react";
import { expPaid, expStatus, type ExpenseHalf } from "@/budget-engine";
import { StatusPill } from "./ui/StatusPill";
import { PaymentsModal } from "./PaymentsModal";
import type { Database } from "@/lib/database.types";
import type { ExpenseWithPayments } from "@/hooks/useExpenses";

type Source = Database["public"]["Tables"]["sources"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];

function formatPHP(amount: number): string {
  return "₱ " + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface ExpensesTableProps {
  expenses: ExpenseWithPayments[];
  sources: Source[];
  loading: boolean;
  halfFilter: "all" | "half1" | "half2";
  onAddPayment: (
    expenseId: string,
    data: { paid_on: string; amount: number; source_id: string | null; note: string | null }
  ) => Promise<string | null>;
  onDeletePayment: (paymentId: string) => Promise<string | null>;
}

export function ExpensesTable({
  expenses,
  sources,
  loading,
  halfFilter,
  onAddPayment,
  onDeletePayment,
}: ExpensesTableProps) {
  const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
  const selectedExpense = selectedExpenseId
    ? (expenses.find((e) => e.id === selectedExpenseId) ?? null)
    : null;

  const filteredExpenses = expenses.filter((e) => {
    if (halfFilter === "all") return true;
    return e.half === halfFilter;
  });

  const totalBudgeted = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalPaid = filteredExpenses.reduce((sum, e) => {
    const ep = expPaid({ id: e.id, amount: e.amount, sourceId: e.source_id ?? "", half: e.half as ExpenseHalf, payments: e.payments.map((p) => ({ id: p.id, amount: p.amount, sourceId: p.source_id ?? "" })) });
    return sum + ep;
  }, 0);

  function toEngineExpense(e: ExpenseWithPayments) {
    return {
      id: e.id,
      amount: e.amount,
      sourceId: e.source_id ?? "",
      half: e.half as ExpenseHalf,
      payments: e.payments.map((p: Payment) => ({ id: p.id, amount: p.amount, sourceId: p.source_id ?? "" })),
    };
  }

  return (
    <div data-testid="expenses-table">
      {/* Panel header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--color-ink-4)", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "block", width: 13, height: 1.5, background: "var(--color-ink-5)" }} />
            Expenses
          </div>
          {filteredExpenses.length > 0 && (
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--color-ink-4)" }}>
              {formatPHP(totalBudgeted)}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div
        data-testid="expenses-summary-cards"
        style={{ display: "flex", gap: 10, marginBottom: 16 }}
      >
        <div
          data-testid="summary-total-budgeted"
          style={{ flex: 1, background: "var(--color-linen)", border: "1px solid var(--color-rule)", borderRadius: 8, padding: "10px 14px" }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 4 }}>
            Budgeted
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--color-ink)" }}>
            {formatPHP(totalBudgeted)}
          </div>
        </div>
        <div
          data-testid="summary-total-paid"
          style={{ flex: 1, background: "var(--color-linen)", border: "1px solid var(--color-rule)", borderRadius: 8, padding: "10px 14px" }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 4 }}>
            Total Paid
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--color-green)" }}>
            {formatPHP(totalPaid)}
          </div>
        </div>
        <div
          data-testid="summary-remaining"
          style={{ flex: 1, background: "var(--color-linen)", border: "1px solid var(--color-rule)", borderRadius: 8, padding: "10px 14px" }}
        >
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 4 }}>
            Remaining
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: totalBudgeted - totalPaid < 0 ? "var(--color-red)" : "var(--color-ink)" }}>
            {formatPHP(totalBudgeted - totalPaid)}
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ border: "1px solid var(--color-rule)", borderRadius: 8, overflow: "hidden", background: "var(--color-linen)" }}>
        {loading ? (
          <div style={{ padding: "20px", fontSize: 13, color: "var(--color-ink-4)", textAlign: "center" }}>
            Loading…
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div data-testid="expenses-empty" style={{ padding: "24px 20px", fontSize: 13, color: "var(--color-ink-4)", textAlign: "center" }}>
            No expenses yet.
          </div>
        ) : (
          filteredExpenses.map((expense, idx) => {
            const engineExp = toEngineExpense(expense);
            const status = expStatus(engineExp);
            const paid = expPaid(engineExp);
            const sourceLabel = sources.find((s) => s.id === expense.source_id)?.name ?? null;

            return (
              <div
                key={expense.id}
                data-testid={`expense-row-${expense.id}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  borderBottom: idx < filteredExpenses.length - 1 ? "1px solid var(--color-rule)" : "none",
                }}
              >
                {/* Status pill / pay button */}
                <StatusPill
                  status={status}
                  data-testid={`status-pill-${expense.id}`}
                  onClick={() => setSelectedExpenseId(expense.id)}
                />

                {/* Name + source + category */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {expense.name}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-ink-4)", marginTop: 1, display: "flex", gap: 6 }}>
                    <span>{expense.category}</span>
                    {sourceLabel && <span>· {sourceLabel}</span>}
                    {expense.tag && <span>· {expense.tag}</span>}
                  </div>
                </div>

                {/* Paid / budgeted */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "var(--color-ink)" }}>
                    {formatPHP(expense.amount)}
                  </div>
                  {paid > 0 && (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--color-ink-4)", marginTop: 1 }}>
                      {formatPHP(paid)} paid
                    </div>
                  )}
                </div>

                {/* Pay button */}
                <button
                  data-testid={`pay-btn-${expense.id}`}
                  onClick={() => setSelectedExpenseId(expense.id)}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-3)",
                    background: "var(--color-linen-2)",
                    border: "1px solid var(--color-rule)",
                    borderRadius: 4,
                    padding: "4px 9px",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                >
                  Pay
                </button>
              </div>
            );
          })
        )}
      </div>

      <PaymentsModal
        open={!!selectedExpense}
        onClose={() => setSelectedExpenseId(null)}
        expense={selectedExpense}
        sources={sources}
        onAddPayment={onAddPayment}
        onDeletePayment={onDeletePayment}
      />
    </div>
  );
}
