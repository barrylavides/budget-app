import type { ExpenseRow } from "@/hooks/useExpenses";
import { computeCategoryStats } from "@/lib/categoryStats";

interface CategoryListViewProps {
  expenses: ExpenseRow[];
  onCategoryClick: (category: string) => void;
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CategoryListView({ expenses, onCategoryClick }: CategoryListViewProps) {
  const stats = computeCategoryStats(expenses);
  const nonEmpty = stats.filter((s) => s.count > 0);

  if (nonEmpty.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-linen-2)",
          border: "1px solid var(--color-rule)",
          borderRadius: 8,
          padding: "40px 28px",
          color: "var(--color-ink-4)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        No expenses yet. Click "Add Expense" to get started.
      </div>
    );
  }

  return (
    <div
      data-testid="category-list"
      style={{
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {nonEmpty.map((stat, idx) => {
        const pct = stat.total > 0 ? Math.min((stat.paid / stat.total) * 100, 100) : 0;
        const isLast = idx === nonEmpty.length - 1;

        return (
          <button
            key={stat.category}
            data-testid={`category-row-${stat.category}`}
            onClick={() => onCategoryClick(stat.category)}
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              borderBottom: isLast ? "none" : "1px solid var(--color-rule)",
              padding: "14px 18px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              transition: "background 0.1s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "var(--color-linen-2)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            {/* Icon */}
            <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>{stat.icon}</span>

            {/* Name + count */}
            <div style={{ flex: "0 0 120px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-ink)" }}>
                {stat.category}
              </div>
              <div style={{ fontSize: 11, color: "var(--color-ink-4)" }}>
                {stat.count} item{stat.count !== 1 ? "s" : ""}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ flex: 1, minWidth: 80 }}>
              <div
                style={{
                  height: 4,
                  background: "var(--color-linen-3)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  data-testid={`list-progress-${stat.category}`}
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: pct >= 100 ? "var(--color-green)" : "var(--color-ink-4)",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

            {/* Total */}
            <div
              style={{
                flex: "0 0 auto",
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                fontWeight: 500,
                color: "var(--color-ink)",
                minWidth: 100,
                textAlign: "right",
              }}
            >
              ₱{formatAmount(stat.total)}
            </div>

            {/* Chevron */}
            <span
              style={{ color: "var(--color-ink-5)", fontSize: 14, flexShrink: 0 }}
              aria-hidden="true"
            >
              ›
            </span>
          </button>
        );
      })}
    </div>
  );
}
