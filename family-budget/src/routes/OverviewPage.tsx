import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMonthId } from "@/hooks/useMonthId";
import { useSources } from "@/hooks/useSources";
import { useExpenses } from "@/hooks/useExpenses";
import { SourcesPanel } from "@/components/SourcesPanel";
import { ExpensesTable } from "@/components/ExpensesTable";

type HalfFilter = "all" | "half1" | "half2";

export function OverviewPage() {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const [year, month] = (yearMonth ?? "").split("-");
  const [halfFilter, setHalfFilter] = useState<HalfFilter>("all");

  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const { monthId, loading: monthIdLoading } = useMonthId(yearMonth ?? "");
  const { sources, loading: sourcesLoading, addSource, updateSource, deleteSource } = useSources(monthId);
  const { expenses, loading: expensesLoading, addPayment, deletePayment } = useExpenses(monthId);

  // Derive all payments from expenses so SourcesPanel balance reflects actual payment data
  // (re-computed whenever useExpenses refreshes after add/delete payment)
  const allPayments = expenses.flatMap((e) =>
    e.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      source_id: p.source_id,
      expense_id: p.expense_id,
      paid_on: p.paid_on,
      note: p.note,
      created_at: p.created_at,
      created_by: p.created_by,
      updated_at: p.updated_at,
    }))
  );

  const loading = monthIdLoading || sourcesLoading;

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    padding: "5px 12px",
    borderRadius: 5,
    cursor: "pointer",
    border: active ? "1px solid var(--color-ink-3)" : "1px solid var(--color-rule)",
    background: active ? "var(--color-ink)" : "var(--color-linen-2)",
    color: active ? "var(--color-linen)" : "var(--color-ink-3)",
    transition: "background 0.1s, color 0.1s, border-color 0.1s",
  });

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-ink-4)",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              display: "block",
              width: 13,
              height: 1.5,
              background: "var(--color-ink-5)",
            }}
          />
          Overview
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
          }}
        >
          {monthName}
        </h1>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 20,
        }}
      >
        <button
          data-testid="half-filter-all"
          style={filterBtnStyle(halfFilter === "all")}
          onClick={() => setHalfFilter("all")}
        >
          All
        </button>
        <button
          data-testid="half-filter-half1"
          style={filterBtnStyle(halfFilter === "half1")}
          onClick={() => setHalfFilter("half1")}
        >
          1st Half
        </button>
        <button
          data-testid="half-filter-half2"
          style={filterBtnStyle(halfFilter === "half2")}
          onClick={() => setHalfFilter("half2")}
        >
          2nd Half
        </button>
      </div>

      <SourcesPanel
        monthId={monthId ?? ""}
        sources={sources}
        payments={allPayments}
        loading={loading}
        halfFilter={halfFilter}
        onAddSource={addSource}
        onUpdateSource={updateSource}
        onDeleteSource={deleteSource}
      />

      <div style={{ marginTop: 24 }}>
        <ExpensesTable
          expenses={expenses}
          sources={sources}
          loading={monthIdLoading || expensesLoading}
          halfFilter={halfFilter}
          onAddPayment={addPayment}
          onDeletePayment={deletePayment}
        />
      </div>
    </div>
  );
}
