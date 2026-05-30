import type { ExpenseRow } from "@/hooks/useExpenses";
import { computeCategoryStats } from "@/lib/categoryStats";

interface CategoryGridViewProps {
  expenses: ExpenseRow[];
  onCategoryClick: (category: string) => void;
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CategoryGridView({ expenses, onCategoryClick }: CategoryGridViewProps) {
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
      data-testid="category-grid"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 14,
      }}
    >
      {nonEmpty.map((stat) => {
        const pct = stat.total > 0 ? Math.min((stat.paid / stat.total) * 100, 100) : 0;

        return (
          <button
            key={stat.category}
            data-testid={`category-card-${stat.category}`}
            onClick={() => onCategoryClick(stat.category)}
            style={{
              background: "var(--color-linen)",
              border: "1px solid var(--color-rule)",
              borderRadius: 10,
              padding: "18px 16px",
              cursor: "pointer",
              textAlign: "left",
              display: "flex",
              flexDirection: "column",
              gap: 10,
              transition: "box-shadow 0.15s",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 2px 12px rgba(14,14,11,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
            }}
          >
            {/* Icon + Category name */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 22, lineHeight: 1 }}>{stat.icon}</span>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--color-ink)",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {stat.category}
                </div>
                <div style={{ fontSize: 11, color: "var(--color-ink-4)", marginTop: 1 }}>
                  {stat.count} expense{stat.count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {/* Total amount */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--color-ink)",
                letterSpacing: "-0.02em",
              }}
            >
              ₱{formatAmount(stat.total)}
            </div>

            {/* Progress bar */}
            <div>
              <div
                style={{
                  height: 4,
                  background: "var(--color-linen-3)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  data-testid={`category-progress-${stat.category}`}
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: pct >= 100 ? "var(--color-green)" : "var(--color-ink-4)",
                    borderRadius: 2,
                    transition: "width 0.3s",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--color-ink-5)",
                  marginTop: 4,
                  fontFamily: "var(--font-mono)",
                }}
              >
                {pct.toFixed(0)}% paid
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
