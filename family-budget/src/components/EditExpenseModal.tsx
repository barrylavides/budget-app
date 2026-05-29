import { useState, useEffect } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, TAGS, HALVES } from "@/lib/categories";
import type { Category, Tag, Half } from "@/lib/categories";
import type { ExpenseRow, SourceRow } from "@/hooks/useExpenses";

interface EditExpenseModalProps {
  open: boolean;
  expense: ExpenseRow;
  sources: SourceRow[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditExpenseModal({
  open,
  expense,
  sources,
  onClose,
  onSaved,
}: EditExpenseModalProps) {
  const [name, setName] = useState(expense.name);
  const [category, setCategory] = useState<Category>(expense.category as Category);
  const [half, setHalf] = useState<Half>(expense.half as Half);
  const [amount, setAmount] = useState(String(expense.amount));
  const [sourceId, setSourceId] = useState<string>(expense.source_id ?? "");
  const [tag, setTag] = useState<Tag | "">(expense.tag as Tag | "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(expense.name);
    setCategory(expense.category as Category);
    setHalf(expense.half as Half);
    setAmount(String(expense.amount));
    setSourceId(expense.source_id ?? "");
    setTag(expense.tag as Tag | "");
  }, [expense]);

  const filteredSources = sources.filter((s) => s.half === half || s.half === "both");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError("Amount must be a positive number.");
      return;
    }

    setSaving(true);
    setError(null);

    const { error: updateErr } = await supabase
      .from("expenses")
      .update({
        name: name.trim(),
        category,
        half,
        amount: amountNum,
        source_id: sourceId || null,
        tag: tag || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expense.id);

    setSaving(false);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    onSaved();
  }

  const fieldLabel: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-ink-3)",
    display: "block",
    marginBottom: 6,
  };

  const fieldInput: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    border: "1px solid var(--color-rule)",
    borderRadius: 6,
    fontSize: 14,
    color: "var(--color-ink)",
    background: "var(--color-linen)",
    fontFamily: "var(--font-sans)",
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Expense">
      <form
        onSubmit={handleSubmit}
        data-testid="edit-expense-form"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Name */}
        <div>
          <label style={fieldLabel}>Name</label>
          <input
            data-testid="edit-expense-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={fieldInput}
          />
        </div>

        {/* Category */}
        <div>
          <label style={fieldLabel}>Category</label>
          <select
            data-testid="edit-expense-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            style={{ ...fieldInput, cursor: "pointer" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Half */}
        <div>
          <label style={fieldLabel}>Half</label>
          <select
            data-testid="edit-expense-half"
            value={half}
            onChange={(e) => {
              setHalf(e.target.value as Half);
              setSourceId("");
            }}
            style={{ ...fieldInput, cursor: "pointer" }}
          >
            {HALVES.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>

        {/* Amount */}
        <div>
          <label style={fieldLabel}>Amount</label>
          <input
            data-testid="edit-expense-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={fieldInput}
          />
        </div>

        {/* Source */}
        <div>
          <label style={fieldLabel}>Source (optional)</label>
          <select
            data-testid="edit-expense-source"
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            style={{ ...fieldInput, cursor: "pointer" }}
          >
            <option value="">— None —</option>
            {filteredSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tag */}
        <div>
          <label style={fieldLabel}>Tag (optional)</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(["", ...TAGS] as Array<Tag | "">).map((t) => (
              <button
                key={t === "" ? "none" : t}
                type="button"
                data-testid={`edit-tag-option-${t === "" ? "none" : t}`}
                onClick={() => setTag(t)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border:
                    tag === t
                      ? "1.5px solid var(--color-ink)"
                      : "1px solid var(--color-rule)",
                  background: tag === t ? "var(--color-ink)" : "var(--color-linen-2)",
                  color: tag === t ? "var(--color-linen)" : "var(--color-ink-3)",
                  transition: "all 0.12s",
                }}
              >
                {t === "" ? "None" : t}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div
            data-testid="edit-expense-error"
            style={{
              fontSize: 12,
              color: "var(--color-red)",
              background: "var(--color-red-bg)",
              border: "1px solid var(--color-red-rule)",
              borderRadius: 6,
              padding: "8px 12px",
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <Button variant="outline" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="ink" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
