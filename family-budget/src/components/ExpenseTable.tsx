import { useState } from "react";
import type { ExpenseRow, SourceRow } from "@/hooks/useExpenses";
import { TAG_COLORS } from "@/lib/categories";
import type { Tag } from "@/lib/categories";

interface ExpenseTableProps {
  expenses: ExpenseRow[];
  sources: SourceRow[];
  onEdit: (expense: ExpenseRow) => void;
  onDelete: (expense: ExpenseRow) => void;
}

function formatAmount(n: number): string {
  return n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function TagPill({ tag }: { tag: string }) {
  const colors = TAG_COLORS[tag as Tag] ?? {
    bg: "var(--color-linen-2)",
    text: "var(--color-ink-3)",
    border: "var(--color-rule)",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
      }}
    >
      {tag}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    unpaid: { bg: "var(--color-linen-3)", text: "var(--color-ink-4)" },
    partial: { bg: "var(--color-amber-bg)", text: "var(--color-amber)" },
    paid: { bg: "var(--color-green-bg)", text: "var(--color-green)" },
    overpaid: { bg: "var(--color-red-bg)", text: "var(--color-red)" },
  };
  const colors = colorMap[status] ?? colorMap.unpaid;

  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 8px",
        borderRadius: 10,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.05em",
        background: colors.bg,
        color: colors.text,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
}

export function ExpenseTable({ expenses, sources, onEdit, onDelete }: ExpenseTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const sourceMap = new Map(sources.map((s) => [s.id, s.name]));

  if (expenses.length === 0) {
    return (
      <div
        style={{
          background: "var(--color-linen-2)",
          border: "1px solid var(--color-rule)",
          borderRadius: 8,
          padding: "32px 28px",
          color: "var(--color-ink-4)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        No expenses in this category.
      </div>
    );
  }

  return (
    <div
      data-testid="expense-table"
      style={{
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 110px 140px 90px 80px 80px",
          gap: 0,
          padding: "10px 16px",
          background: "var(--color-linen-2)",
          borderBottom: "1px solid var(--color-rule)",
        }}
      >
        {["Name", "Amount", "Source", "Tag", "Status", ""].map((h) => (
          <div
            key={h}
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Rows */}
      {expenses.map((expense, idx) => {
        const isLast = idx === expenses.length - 1;
        const isHovered = hoveredRow === expense.id;
        const sourceName = expense.source_id ? (sourceMap.get(expense.source_id) ?? "—") : "—";

        return (
          <div
            key={expense.id}
            data-testid={`expense-row-${expense.id}`}
            onMouseEnter={() => setHoveredRow(expense.id)}
            onMouseLeave={() => setHoveredRow(null)}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 110px 140px 90px 80px 80px",
              gap: 0,
              padding: "12px 16px",
              borderBottom: isLast ? "none" : "1px solid var(--color-rule)",
              background: isHovered ? "var(--color-linen-2)" : "transparent",
              transition: "background 0.1s",
              alignItems: "center",
            }}
          >
            {/* Name */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-ink)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {expense.name}
            </div>

            {/* Amount */}
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 13,
                color: "var(--color-ink)",
              }}
            >
              ₱{formatAmount(expense.amount)}
            </div>

            {/* Source */}
            <div
              style={{
                fontSize: 12,
                color: "var(--color-ink-3)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {sourceName}
            </div>

            {/* Tag */}
            <div>
              {expense.tag ? <TagPill tag={expense.tag} /> : <span style={{ color: "var(--color-ink-5)", fontSize: 12 }}>—</span>}
            </div>

            {/* Status (stub = unpaid) */}
            <div>
              <StatusBadge status="unpaid" />
            </div>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 4,
                justifyContent: "flex-end",
                opacity: isHovered ? 1 : 0,
                transition: "opacity 0.15s",
              }}
            >
              <button
                data-testid={`edit-expense-${expense.id}`}
                onClick={() => onEdit(expense)}
                title="Edit"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  border: "1px solid var(--color-rule)",
                  background: "var(--color-linen)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--color-ink-3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✎
              </button>
              <button
                data-testid={`delete-expense-${expense.id}`}
                onClick={() => onDelete(expense)}
                title="Delete"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 5,
                  border: "1px solid var(--color-red-rule)",
                  background: "var(--color-red-bg)",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--color-red)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
