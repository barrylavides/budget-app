import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useExpenses } from "@/hooks/useExpenses";
import type { ExpenseRow } from "@/hooks/useExpenses";
import { AddExpenseModal } from "@/components/AddExpenseModal";
import { EditExpenseModal } from "@/components/EditExpenseModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { CategoryGridView } from "@/components/CategoryGridView";
import { CategoryListView } from "@/components/CategoryListView";
import { ExpenseTable } from "@/components/ExpenseTable";

export type ViewMode = "grid" | "list";

const VIEW_MODE_KEY = "expense-view-mode";


export function ExpensesPage() {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const [year, monthStr] = (yearMonth ?? "").split("-");
  const monthNum = Number(monthStr);

  const [monthId, setMonthId] = useState<string | null>(null);
  const [monthIdLoading, setMonthIdLoading] = useState(true);

  useEffect(() => {
    if (!yearMonth) return;
    setMonthIdLoading(true);
    supabase
      .from("months")
      .select("id")
      .eq("year", Number(year))
      .eq("month_num", monthNum)
      .maybeSingle()
      .then(({ data }) => {
        setMonthId(data?.id ?? null);
        setMonthIdLoading(false);
      });
  }, [yearMonth, year, monthNum]);

  const { expenses, sources, loading, refresh } = useExpenses(monthId);

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    return (saved === "list" ? "list" : "grid") as ViewMode;
  });

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseRow | null>(null);
  const [deleteExpense, setDeleteExpense] = useState<ExpenseRow | null>(null);

  function handleViewModeChange(mode: ViewMode) {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }

  function handleCategoryClick(category: string) {
    setSelectedCategory(category);
  }

  function handleBackToCategories() {
    setSelectedCategory(null);
  }

  async function handleDeleteConfirm() {
    if (!deleteExpense) return;
    await supabase.from("expenses").delete().eq("id", deleteExpense.id);
    setDeleteExpense(null);
    refresh();
  }

  const monthName = new Date(Number(year), monthNum - 1).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });

  if (monthIdLoading || loading) {
    return (
      <div style={{ color: "var(--color-ink-4)", fontSize: 14, padding: 20 }}>
        Loading expenses…
      </div>
    );
  }

  return (
    <div>
      {/* Page header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 20,
        }}
      >
        <div>
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
            Expenses
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

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          {/* View toggle */}
          {!selectedCategory && (
            <div
              style={{
                display: "flex",
                border: "1px solid var(--color-rule)",
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              <button
                data-testid="view-toggle-grid"
                onClick={() => handleViewModeChange("grid")}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: viewMode === "grid" ? "var(--color-ink)" : "var(--color-linen)",
                  color: viewMode === "grid" ? "var(--color-linen)" : "var(--color-ink-3)",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                Grid
              </button>
              <button
                data-testid="view-toggle-list"
                onClick={() => handleViewModeChange("list")}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 600,
                  background: viewMode === "list" ? "var(--color-ink)" : "var(--color-linen)",
                  color: viewMode === "list" ? "var(--color-linen)" : "var(--color-ink-3)",
                  border: "none",
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                }}
              >
                List
              </button>
            </div>
          )}

          <button
            data-testid="add-expense-btn"
            onClick={() => setShowAddModal(true)}
            style={{
              padding: "7px 16px",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              background: "var(--color-ink)",
              color: "var(--color-linen)",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedCategory && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 16,
            fontSize: 12,
            color: "var(--color-ink-3)",
          }}
        >
          <button
            data-testid="breadcrumb-back"
            onClick={handleBackToCategories}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--color-blue)",
              fontSize: 12,
              fontWeight: 600,
              padding: 0,
            }}
          >
            All Categories
          </button>
          <span style={{ color: "var(--color-ink-5)" }}>›</span>
          <span data-testid="breadcrumb-category" style={{ color: "var(--color-ink)", fontWeight: 600 }}>
            {selectedCategory}
          </span>
        </div>
      )}

      {/* Content */}
      {selectedCategory ? (
        <ExpenseTable
          expenses={expenses.filter((e) => e.category === selectedCategory)}
          sources={sources}
          onEdit={setEditExpense}
          onDelete={setDeleteExpense}
        />
      ) : viewMode === "grid" ? (
        <CategoryGridView
          expenses={expenses}
          onCategoryClick={handleCategoryClick}
        />
      ) : (
        <CategoryListView
          expenses={expenses}
          onCategoryClick={handleCategoryClick}
        />
      )}

      {/* Modals */}
      {showAddModal && monthId && (
        <AddExpenseModal
          open={showAddModal}
          monthId={monthId}
          sources={sources}
          onClose={() => setShowAddModal(false)}
          onCreated={() => {
            setShowAddModal(false);
            refresh();
          }}
        />
      )}

      {editExpense && (
        <EditExpenseModal
          open={!!editExpense}
          expense={editExpense}
          sources={sources}
          onClose={() => setEditExpense(null)}
          onSaved={() => {
            setEditExpense(null);
            refresh();
          }}
        />
      )}

      {deleteExpense && (
        <DeleteConfirmDialog
          open={!!deleteExpense}
          expenseName={deleteExpense.name}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteExpense(null)}
        />
      )}
    </div>
  );
}
