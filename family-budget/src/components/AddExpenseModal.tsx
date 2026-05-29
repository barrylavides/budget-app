import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { supabase } from "@/lib/supabase";
import { CATEGORIES, TAGS, HALVES } from "@/lib/categories";
import type { Category, Tag, Half } from "@/lib/categories";
import type { SourceRow } from "@/hooks/useExpenses";

interface AddExpenseModalProps {
  open: boolean;
  monthId: string;
  sources: SourceRow[];
  onClose: () => void;
  onCreated: () => void;
}

export function AddExpenseModal({
  open,
  monthId,
  sources,
  onClose,
  onCreated,
}: AddExpenseModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Bills");
  const [half, setHalf] = useState<Half>("half1");
  const [amount, setAmount] = useState("");
  const [sourceId, setSourceId] = useState<string>("");
  const [tag, setTag] = useState<Tag | "">("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const { error: insertErr } = await supabase.from("expenses").insert({
      month_id: monthId,
      name: name.trim(),
      category,
      half,
      amount: amountNum,
      source_id: sourceId || null,
      tag: tag || null,
    });

    setSaving(false);

    if (insertErr) {
      setError(insertErr.message);
      return;
    }

    onCreated();
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
    <Modal open={open} onClose={onClose} title="Add Expense">
      <form
        onSubmit={handleSubmit}
        data-testid="add-expense-form"
        style={{ display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Name */}
        <div>
          <label style={fieldLabel}>Name</label>
          <input
            data-testid="expense-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Electricity bill"
            style={fieldInput}
          />
        </div>

        {/* Category */}
        <div>
          <label style={fieldLabel}>Category</label>
          <select
            data-testid="expense-category"
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
            data-testid="expense-half"
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
            data-testid="expense-amount"
            type="number"
            min="0"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            style={fieldInput}
          />
        </div>

        {/* Source */}
        <div>
          <label style={fieldLabel}>Source (optional)</label>
          <select
            data-testid="expense-source"
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
                data-testid={`tag-option-${t === "" ? "none" : t}`}
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
            data-testid="add-expense-error"
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
            {saving ? "Saving…" : "Add Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
