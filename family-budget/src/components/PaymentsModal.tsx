import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { expPaid, type ExpenseHalf } from "@/budget-engine";
import type { Database } from "@/lib/database.types";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Source = Database["public"]["Tables"]["sources"]["Row"];

function formatPHP(amount: number): string {
  return "₱ " + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface PaymentFormData {
  paid_on: string;
  amount: string;
  source_id: string;
  note: string;
}

const EMPTY_FORM: PaymentFormData = {
  paid_on: new Date().toISOString().split("T")[0],
  amount: "",
  source_id: "",
  note: "",
};

interface PaymentsModalProps {
  open: boolean;
  onClose: () => void;
  expense: (Expense & { payments: Payment[] }) | null;
  sources: Source[];
  onAddPayment: (
    expenseId: string,
    data: { paid_on: string; amount: number; source_id: string | null; note: string | null }
  ) => Promise<string | null>;
  onDeletePayment: (paymentId: string) => Promise<string | null>;
}

export function PaymentsModal({
  open,
  onClose,
  expense,
  sources,
  onAddPayment,
  onDeletePayment,
}: PaymentsModalProps) {
  const [form, setForm] = useState<PaymentFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!expense) return null;

  const totalDue = expense.amount;
  const totalPaid = expPaid({ id: expense.id, amount: expense.amount, sourceId: expense.source_id ?? "", half: expense.half as ExpenseHalf, payments: expense.payments.map((p) => ({ id: p.id, amount: p.amount, sourceId: p.source_id ?? "" })) });
  const remaining = totalDue - totalPaid;

  function handleChange(field: keyof PaymentFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    setSaving(true);
    setSaveError(null);
    const err = await onAddPayment(expense!.id, {
      paid_on: form.paid_on,
      amount: parseFloat(form.amount),
      source_id: form.source_id || null,
      note: form.note.trim() || null,
    });
    setSaving(false);
    if (err) {
      setSaveError(err);
    } else {
      setForm(EMPTY_FORM);
    }
  }

  async function handleDelete(paymentId: string) {
    setDeletingId(paymentId);
    await onDeletePayment(paymentId);
    setDeletingId(null);
  }

  function handleClose() {
    setForm(EMPTY_FORM);
    setSaveError(null);
    onClose();
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-ink-3)",
    display: "block",
    marginBottom: 5,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "7px 10px",
    border: "1px solid var(--color-rule)",
    borderRadius: 6,
    fontSize: 13,
    color: "var(--color-ink)",
    background: "var(--color-linen)",
    fontFamily: "var(--font-sans)",
  };

  return (
    <Modal open={open} onClose={handleClose} title={`Payments — ${expense.name}`}>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Total strip */}
        <div
          data-testid="payments-total-strip"
          style={{
            display: "flex",
            gap: 0,
            border: "1px solid var(--color-rule)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          {[
            { label: "Total Due", value: totalDue, testId: "strip-total-due" },
            { label: "Total Paid", value: totalPaid, testId: "strip-total-paid" },
            { label: "Remaining", value: remaining, testId: "strip-remaining" },
          ].map(({ label, value, testId }, i) => (
            <div
              key={label}
              data-testid={testId}
              style={{
                flex: 1,
                padding: "10px 12px",
                borderRight: i < 2 ? "1px solid var(--color-rule)" : "none",
                background: i === 2 && remaining < 0 ? "var(--color-red-bg)" : "var(--color-linen-2)",
              }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 3 }}>
                {label}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: i === 2 && remaining < 0 ? "var(--color-red)" : "var(--color-ink)" }}>
                {formatPHP(value)}
              </div>
            </div>
          ))}
        </div>

        {/* Existing payments list */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 8 }}>
            Payments
          </div>
          {expense.payments.length === 0 ? (
            <div
              data-testid="payments-empty"
              style={{ fontSize: 13, color: "var(--color-ink-4)", padding: "12px 0" }}
            >
              No payments yet.
            </div>
          ) : (
            <div style={{ border: "1px solid var(--color-rule)", borderRadius: 8, overflow: "hidden" }}>
              {expense.payments.map((p, idx) => {
                const sourceLabel = sources.find((s) => s.id === p.source_id)?.name ?? null;
                return (
                  <div
                    key={p.id}
                    data-testid={`payment-row-${p.id}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      borderBottom: idx < expense.payments.length - 1 ? "1px solid var(--color-rule)" : "none",
                      background: "var(--color-linen)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--color-ink-3)", marginBottom: 1 }}>
                        {p.paid_on}
                      </div>
                      {sourceLabel && (
                        <div style={{ fontSize: 11, color: "var(--color-ink-4)" }}>{sourceLabel}</div>
                      )}
                      {p.note && (
                        <div style={{ fontSize: 11, color: "var(--color-ink-4)", fontStyle: "italic" }}>{p.note}</div>
                      )}
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 500, color: "var(--color-ink)", flexShrink: 0 }}>
                      {formatPHP(p.amount)}
                    </div>
                    <button
                      data-testid={`delete-payment-${p.id}`}
                      disabled={deletingId === p.id}
                      onClick={() => handleDelete(p.id)}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--color-red)",
                        background: "var(--color-red-bg)",
                        border: "1px solid var(--color-red-rule)",
                        borderRadius: 4,
                        padding: "3px 7px",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {deletingId === p.id ? "…" : "Delete"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add payment form */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--color-ink-4)", marginBottom: 10 }}>
            Add Payment
          </div>
          <form onSubmit={handleAdd} data-testid="add-payment-form" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Date</label>
                <input
                  data-testid="payment-form-date"
                  type="date"
                  value={form.paid_on}
                  onChange={(e) => handleChange("paid_on", e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Amount (₱)</label>
                <input
                  data-testid="payment-form-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={(e) => handleChange("amount", e.target.value)}
                  required
                  placeholder="0.00"
                  style={inputStyle}
                />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select
                data-testid="payment-form-source"
                value={form.source_id}
                onChange={(e) => handleChange("source_id", e.target.value)}
                style={inputStyle}
              >
                <option value="">— none —</option>
                {sources.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Note</label>
              <input
                data-testid="payment-form-note"
                type="text"
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                placeholder="Optional"
                style={inputStyle}
              />
            </div>

            {saveError && (
              <div style={{ fontSize: 12, color: "var(--color-red)", background: "var(--color-red-bg)", border: "1px solid var(--color-red-rule)", borderRadius: 6, padding: "8px 12px" }}>
                {saveError}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button variant="ink" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Add Payment"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
}
