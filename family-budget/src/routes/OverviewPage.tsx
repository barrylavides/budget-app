import { useState } from "react";
import { useParams } from "react-router-dom";
import { useMonthId } from "@/hooks/useMonthId";
import { useSources } from "@/hooks/useSources";
import { useExpenses } from "@/hooks/useExpenses";
import { SourcesPanel } from "@/components/SourcesPanel";
import {
  sourcesTotalAll,
  halfIncome,
  halfExpenses,
  expTotal,
  totalPaid,
  type Source as EngineSource,
  type ExpenseHalf,
} from "@/budget-engine";
import type { Database } from "@/lib/database.types";

type HalfFilter = "all" | "half1" | "half2";
type DbSource = Database["public"]["Tables"]["sources"]["Row"];

function formatPHP(amount: number): string {
  return "₱ " + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPHPCompact(amount: number): string {
  if (Math.abs(amount) >= 1000) {
    return "₱" + (amount / 1000).toLocaleString("en-PH", { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "k";
  }
  return "₱" + amount.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

interface SummaryCardProps {
  label: string;
  value: string;
  red?: boolean;
  children?: React.ReactNode;
  testId?: string;
}

function SummaryCard({ label, value, red, children, testId }: SummaryCardProps) {
  return (
    <div
      data-testid={testId}
      style={{
        flex: "1 1 0",
        minWidth: 120,
        background: "var(--color-linen)",
        border: `1px solid ${red ? "var(--color-red-rule)" : "var(--color-rule)"}`,
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-4)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 16,
          fontWeight: 600,
          color: red ? "var(--color-red)" : "var(--color-ink)",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {children}
    </div>
  );
}

interface BudgetCardProps {
  budgeted: number;
  target: number;
  onTargetChange: (v: number) => void;
}

function BudgetCard({ budgeted, target, onTargetChange }: BudgetCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(target));

  const progress = target > 0 ? Math.min(budgeted / target, 1) : 0;
  const progressPct = Math.round(progress * 100);
  const overBudget = target > 0 && budgeted > target;

  function handleBlur() {
    const v = parseFloat(draft);
    if (!isNaN(v) && v >= 0) onTargetChange(v);
    setEditing(false);
  }

  return (
    <div
      data-testid="summary-card-budget"
      style={{
        flex: "1 1 0",
        minWidth: 140,
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 8,
        padding: "12px 14px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-4)",
          marginBottom: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <span>Budget Target</span>
        <button
          data-testid="budget-target-edit-btn"
          onClick={() => { setDraft(String(target)); setEditing(true); }}
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-ink-4)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Edit
        </button>
      </div>

      {editing ? (
        <input
          data-testid="budget-target-input"
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => { if (e.key === "Enter") handleBlur(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 14,
            fontWeight: 600,
            color: "var(--color-ink)",
            background: "var(--color-linen-2)",
            border: "1px solid var(--color-rule)",
            borderRadius: 4,
            padding: "2px 6px",
            width: "100%",
            marginBottom: 8,
          }}
        />
      ) : (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 16,
            fontWeight: 600,
            color: overBudget ? "var(--color-red)" : "var(--color-ink)",
            lineHeight: 1.2,
            marginBottom: 8,
          }}
        >
          {target > 0 ? `${progressPct}%` : "—"}
        </div>
      )}

      {/* Progress bar */}
      <div
        data-testid="budget-progress-bar"
        style={{
          height: 4,
          borderRadius: 2,
          background: "var(--color-linen-3)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progressPct}%`,
            background: overBudget ? "var(--color-red)" : "var(--color-green)",
            borderRadius: 2,
            transition: "width 0.3s",
          }}
        />
      </div>
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          color: "var(--color-ink-4)",
          marginTop: 4,
        }}
      >
        {formatPHP(budgeted)} of {target > 0 ? formatPHP(target) : "no target"}
      </div>
    </div>
  );
}

interface HalfBreakdownCardProps {
  halfLabel: string;
  income: number;
  budgeted: number;
  paid: number;
  testId: string;
}

function HalfBreakdownCard({ halfLabel, income, budgeted, paid, testId }: HalfBreakdownCardProps) {
  const remaining = income - budgeted;
  const isOverBudget = remaining < 0;

  return (
    <div
      data-testid={testId}
      style={{
        flex: 1,
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 8,
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-4)",
          marginBottom: 12,
        }}
      >
        {halfLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <BreakdownRow label="Income" value={income} />
        <BreakdownRow label="Budgeted" value={budgeted} />
        <BreakdownRow label="Paid" value={paid} />
        <div style={{ height: 1, background: "var(--color-rule)", margin: "2px 0" }} />
        <BreakdownRow label="Remaining" value={remaining} red={isOverBudget} />
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, red }: { label: string; value: number; red?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <span style={{ fontSize: 11, color: "var(--color-ink-4)" }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 500,
          color: red ? "var(--color-red)" : "var(--color-ink)",
        }}
      >
        {formatPHP(value)}
      </span>
    </div>
  );
}

const BUDGET_TARGET_KEY = "budget_target_";

export function OverviewPage() {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const [year, month] = (yearMonth ?? "").split("-");
  const [halfFilter, setHalfFilter] = useState<HalfFilter>("all");

  const [budgetTarget, setBudgetTargetState] = useState<number>(() => {
    const saved = localStorage.getItem(BUDGET_TARGET_KEY + yearMonth);
    return saved ? parseFloat(saved) : 0;
  });

  function setBudgetTarget(v: number) {
    setBudgetTargetState(v);
    localStorage.setItem(BUDGET_TARGET_KEY + yearMonth, String(v));
  }

  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });

  const { monthId, loading: monthIdLoading } = useMonthId(yearMonth ?? "");
  const { sources, payments, loading: sourcesLoading, addSource, updateSource, deleteSource } = useSources(monthId);
  const { expenses, loading: expensesLoading } = useExpenses(monthId);

  const loading = monthIdLoading || sourcesLoading || expensesLoading;

  // Engine-format sources
  const engineSources: EngineSource[] = sources.map((s) => ({
    id: s.id,
    balance: s.balance,
    half: s.half as "half1" | "half2" | "both",
  }));

  // Engine-format expenses with payments
  const engineExpenses = expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    sourceId: e.source_id ?? "",
    half: e.half as ExpenseHalf,
    payments: e.payments.map((p) => ({
      id: p.id,
      amount: p.amount,
      sourceId: p.source_id ?? "",
    })),
  }));

  // Half salary totals for segmented control labels
  const half1Income = halfIncome(engineSources, "half1");
  const half2Income = halfIncome(engineSources, "half2");

  // Summary values (scoped to current halfFilter)
  const scopedSources =
    halfFilter === "all"
      ? engineSources
      : engineSources.filter((s) => {
          const dbSource = sources.find((ds) => ds.id === s.id) as DbSource | undefined;
          return dbSource ? dbSource.half === halfFilter || dbSource.half === "both" : false;
        });

  const scopedExpenses =
    halfFilter === "all"
      ? engineExpenses
      : halfExpenses(engineExpenses, halfFilter as ExpenseHalf);

  const totalIncome = sourcesTotalAll(scopedSources);
  const totalBudgeted = expTotal(scopedExpenses);
  const totalPaidAmount = totalPaid(scopedExpenses);
  const remaining = totalIncome - totalBudgeted;
  const isRemainingRed = remaining < 0;

  // Per-half breakdown (always shown regardless of filter)
  const half1Expenses = halfExpenses(engineExpenses, "half1");
  const half2Expenses = halfExpenses(engineExpenses, "half2");

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

      {/* Segmented control */}
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
          {!loading && half1Income > 0 && (
            <span
              data-testid="half1-salary-total"
              style={{ marginLeft: 4, opacity: 0.75, fontWeight: 500 }}
            >
              {formatPHPCompact(half1Income)}
            </span>
          )}
        </button>
        <button
          data-testid="half-filter-half2"
          style={filterBtnStyle(halfFilter === "half2")}
          onClick={() => setHalfFilter("half2")}
        >
          2nd Half
          {!loading && half2Income > 0 && (
            <span
              data-testid="half2-salary-total"
              style={{ marginLeft: 4, opacity: 0.75, fontWeight: 500 }}
            >
              {formatPHPCompact(half2Income)}
            </span>
          )}
        </button>
      </div>

      {/* Summary cards row */}
      <div
        data-testid="summary-cards"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
          flexWrap: "wrap",
        }}
      >
        <SummaryCard
          testId="summary-card-income"
          label="Total Income"
          value={loading ? "—" : formatPHP(totalIncome)}
        />
        <SummaryCard
          testId="summary-card-budgeted"
          label="Total Budgeted"
          value={loading ? "—" : formatPHP(totalBudgeted)}
        />
        <SummaryCard
          testId="summary-card-paid"
          label="Total Paid"
          value={loading ? "—" : formatPHP(totalPaidAmount)}
        />
        <SummaryCard
          testId="summary-card-remaining"
          label="Remaining"
          value={loading ? "—" : formatPHP(remaining)}
          red={!loading && isRemainingRed}
        />
        <BudgetCard
          budgeted={totalBudgeted}
          target={budgetTarget}
          onTargetChange={setBudgetTarget}
        />
      </div>

      {/* Per-half breakdown panel */}
      <div
        data-testid="half-breakdown-panel"
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 20,
        }}
      >
        <HalfBreakdownCard
          testId="half-breakdown-half1"
          halfLabel="1st Half"
          income={halfIncome(engineSources, "half1")}
          budgeted={expTotal(half1Expenses)}
          paid={totalPaid(half1Expenses)}
        />
        <HalfBreakdownCard
          testId="half-breakdown-half2"
          halfLabel="2nd Half"
          income={halfIncome(engineSources, "half2")}
          budgeted={expTotal(half2Expenses)}
          paid={totalPaid(half2Expenses)}
        />
      </div>

      <SourcesPanel
        monthId={monthId ?? ""}
        sources={sources}
        payments={payments}
        loading={loading}
        halfFilter={halfFilter}
        onAddSource={addSource}
        onUpdateSource={updateSource}
        onDeleteSource={deleteSource}
      />
    </div>
  );
}
