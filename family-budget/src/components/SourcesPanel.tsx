import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { sourceRemaining, sourcesTotal, sourcesTotalAll } from "@/budget-engine";
import type { Database } from "@/lib/database.types";

type Source = Database["public"]["Tables"]["sources"]["Row"];
type Payment = Database["public"]["Tables"]["payments"]["Row"];
type Half = "half1" | "half2" | "both";

const SOURCE_TYPES = [
  { value: "salary", label: "Salary" },
  { value: "debt_collected", label: "Debt Collected" },
  { value: "savings_withdrawal", label: "Savings Withdrawal" },
] as const;

const TYPE_ICONS: Record<string, string> = {
  salary: "💵",
  debt_collected: "💰",
  savings_withdrawal: "🏦",
};

const HALF_LABELS: Record<Half, string> = {
  half1: "1st",
  half2: "2nd",
  both: "Both",
};

const HALF_COLORS: Record<Half, string> = {
  half1: "var(--color-blue)",
  half2: "var(--color-amber)",
  both: "var(--color-green)",
};

function formatPHP(amount: number): string {
  return "₱ " + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface SourceFormData {
  name: string;
  type: string;
  account_label: string;
  half: string;
  balance: string;
}

const EMPTY_FORM: SourceFormData = {
  name: "",
  type: "salary",
  account_label: "",
  half: "half1",
  balance: "",
};

interface SourceFormProps {
  initial?: SourceFormData;
  saving: boolean;
  error: string | null;
  onSubmit: (data: SourceFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

function SourceForm({ initial = EMPTY_FORM, saving, error, onSubmit, onCancel, submitLabel = "Add Source" }: SourceFormProps) {
  const [form, setForm] = useState<SourceFormData>(initial);

  function handleChange(field: keyof SourceFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-ink-3)",
    display: "block",
    marginBottom: 6,
  };

  const inputStyle: React.CSSProperties = {
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
    <form
      onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <label style={labelStyle}>Name</label>
        <input
          data-testid="source-form-name"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          required
          placeholder="e.g. Wife Payroll"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Type</label>
        <select
          data-testid="source-form-type"
          value={form.type}
          onChange={(e) => handleChange("type", e.target.value)}
          style={inputStyle}
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label style={labelStyle}>Account Label</label>
        <input
          data-testid="source-form-account-label"
          value={form.account_label}
          onChange={(e) => handleChange("account_label", e.target.value)}
          placeholder="e.g. BDO"
          style={inputStyle}
        />
      </div>

      <div>
        <label style={labelStyle}>Half</label>
        <select
          data-testid="source-form-half"
          value={form.half}
          onChange={(e) => handleChange("half", e.target.value)}
          style={inputStyle}
        >
          <option value="half1">1st Half</option>
          <option value="half2">2nd Half</option>
          <option value="both">Both</option>
        </select>
      </div>

      <div>
        <label style={labelStyle}>Balance (₱)</label>
        <input
          data-testid="source-form-balance"
          type="number"
          min="0"
          step="0.01"
          value={form.balance}
          onChange={(e) => handleChange("balance", e.target.value)}
          required
          placeholder="0.00"
          style={inputStyle}
        />
      </div>

      {error && (
        <div
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
        <Button variant="outline" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="ink" type="submit" disabled={saving}>
          {saving ? "Saving…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

interface SourcesPanelProps {
  monthId: string;
  sources: Source[];
  payments: Payment[];
  loading: boolean;
  halfFilter: "all" | "half1" | "half2";
  onAddSource: (data: Omit<Source, "id" | "created_at" | "updated_at" | "created_by">) => Promise<string | null>;
  onUpdateSource: (id: string, data: Partial<Omit<Source, "id" | "created_at" | "updated_at" | "created_by">>) => Promise<string | null>;
  onDeleteSource: (id: string) => Promise<string | null>;
}

export function SourcesPanel({
  monthId,
  sources,
  payments,
  loading,
  halfFilter,
  onAddSource,
  onUpdateSource,
  onDeleteSource,
}: SourcesPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editSource, setEditSource] = useState<Source | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteSource, setDeleteSource] = useState<Source | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filteredSources = sources.filter((s) => {
    if (halfFilter === "all") return true;
    return s.half === halfFilter || s.half === "both";
  });

  const enginePayments = payments.map((p) => ({
    id: p.id,
    amount: p.amount,
    sourceId: p.source_id ?? "",
  }));

  const engineSources = filteredSources.map((s) => ({
    id: s.id,
    balance: s.balance,
    half: s.half as Half,
  }));

  const totalBalance = sourcesTotalAll(engineSources);
  void sourcesTotal; // both are used in unit tests

  async function handleAdd(form: SourceFormData) {
    setAddSaving(true);
    setAddError(null);
    const err = await onAddSource({
      month_id: monthId,
      name: form.name,
      type: form.type,
      account_label: form.account_label || null,
      half: form.half,
      balance: parseFloat(form.balance) || 0,
    });
    setAddSaving(false);
    if (err) {
      setAddError(err);
    } else {
      setShowAdd(false);
    }
  }

  async function handleEdit(form: SourceFormData) {
    if (!editSource) return;
    setEditSaving(true);
    setEditError(null);
    const err = await onUpdateSource(editSource.id, {
      name: form.name,
      type: form.type,
      account_label: form.account_label || null,
      half: form.half,
      balance: parseFloat(form.balance) || 0,
    });
    setEditSaving(false);
    if (err) {
      setEditError(err);
    } else {
      setEditSource(null);
    }
  }

  async function handleDelete() {
    if (!deleteSource) return;
    setDeleteConfirming(true);
    setDeleteError(null);
    const err = await onDeleteSource(deleteSource.id);
    setDeleteConfirming(false);
    if (err) {
      setDeleteError(err);
    } else {
      setDeleteSource(null);
    }
  }

  return (
    <div data-testid="sources-panel">
      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "var(--color-ink-4)",
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
            Income Sources
          </div>
          {filteredSources.length > 0 && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--color-ink-4)",
              }}
            >
              {formatPHP(totalBalance)}
            </span>
          )}
        </div>
        <button
          data-testid="add-source-btn"
          onClick={() => { setShowAdd(true); setAddError(null); }}
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--color-ink-3)",
            background: "var(--color-linen-2)",
            border: "1px solid var(--color-rule)",
            borderRadius: 5,
            padding: "5px 10px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          + Add
        </button>
      </div>

      {/* Sources list */}
      <div
        style={{
          border: "1px solid var(--color-rule)",
          borderRadius: 8,
          overflow: "hidden",
          background: "var(--color-linen)",
        }}
      >
        {loading ? (
          <div
            style={{
              padding: "20px",
              fontSize: 13,
              color: "var(--color-ink-4)",
              textAlign: "center",
            }}
          >
            Loading…
          </div>
        ) : filteredSources.length === 0 ? (
          <div
            data-testid="sources-empty"
            style={{
              padding: "24px 20px",
              fontSize: 13,
              color: "var(--color-ink-4)",
              textAlign: "center",
            }}
          >
            No income sources yet. Add one to get started.
          </div>
        ) : (
          filteredSources.map((source, idx) => {
            const remaining = sourceRemaining(
              { id: source.id, balance: source.balance, half: source.half as Half },
              enginePayments
            );
            const icon = TYPE_ICONS[source.type] ?? "💵";
            const isHovered = hoveredId === source.id;

            return (
              <div
                key={source.id}
                data-testid={`source-row-${source.id}`}
                onMouseEnter={() => setHoveredId(source.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  borderBottom: idx < filteredSources.length - 1 ? "1px solid var(--color-rule)" : "none",
                  background: isHovered ? "var(--color-linen-2)" : "transparent",
                  transition: "background 0.1s",
                  position: "relative",
                }}
              >
                {/* Type icon */}
                <div
                  data-testid={`source-icon-${source.id}`}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    background: "var(--color-linen-3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>

                {/* Name + account label */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    data-testid={`source-name-${source.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--color-ink)",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {source.name}
                  </div>
                  {source.account_label && (
                    <div
                      data-testid={`source-account-${source.id}`}
                      style={{
                        fontSize: 10,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-ink-4)",
                        marginTop: 1,
                      }}
                    >
                      {source.account_label}
                    </div>
                  )}
                </div>

                {/* Half dot */}
                <div
                  data-testid={`source-half-${source.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    flexShrink: 0,
                  }}
                >
                  {(source.half === "half1" || source.half === "both") && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: HALF_COLORS["half1"],
                        display: "block",
                      }}
                    />
                  )}
                  {(source.half === "half2" || source.half === "both") && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: HALF_COLORS["half2"],
                        display: "block",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      color: HALF_COLORS[source.half as Half] ?? "var(--color-ink-4)",
                      textTransform: "uppercase",
                      marginLeft: 2,
                    }}
                  >
                    {HALF_LABELS[source.half as Half] ?? source.half}
                  </span>
                </div>

                {/* Balance */}
                <div
                  data-testid={`source-balance-${source.id}`}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 500,
                    color: remaining < 0 ? "var(--color-red)" : "var(--color-ink)",
                    flexShrink: 0,
                    minWidth: 110,
                    textAlign: "right",
                  }}
                >
                  {formatPHP(remaining)}
                </div>

                {/* Hover actions */}
                {isHovered && (
                  <div
                    style={{
                      display: "flex",
                      gap: 4,
                      flexShrink: 0,
                      marginLeft: 4,
                    }}
                  >
                    <button
                      data-testid={`source-edit-${source.id}`}
                      onClick={() => {
                        setEditSource(source);
                        setEditError(null);
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--color-ink-3)",
                        background: "var(--color-linen-3)",
                        border: "1px solid var(--color-rule)",
                        borderRadius: 4,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      data-testid={`source-delete-${source.id}`}
                      onClick={() => {
                        setDeleteSource(source);
                        setDeleteError(null);
                      }}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                        color: "var(--color-red)",
                        background: "var(--color-red-bg)",
                        border: "1px solid var(--color-red-rule)",
                        borderRadius: 4,
                        padding: "3px 8px",
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Source Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Source">
        <SourceForm
          saving={addSaving}
          error={addError}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          submitLabel="Add Source"
        />
      </Modal>

      {/* Edit Source Modal */}
      <Modal open={!!editSource} onClose={() => setEditSource(null)} title="Edit Source">
        {editSource && (
          <SourceForm
            initial={{
              name: editSource.name,
              type: editSource.type,
              account_label: editSource.account_label ?? "",
              half: editSource.half,
              balance: String(editSource.balance),
            }}
            saving={editSaving}
            error={editError}
            onSubmit={handleEdit}
            onCancel={() => setEditSource(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteSource} onClose={() => setDeleteSource(null)} title="Delete Source">
        {deleteSource && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "var(--color-ink-2)", lineHeight: 1.5 }}>
              Delete <strong>{deleteSource.name}</strong>? This cannot be undone.
            </p>
            {deleteError && (
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-red)",
                  background: "var(--color-red-bg)",
                  border: "1px solid var(--color-red-rule)",
                  borderRadius: 6,
                  padding: "8px 12px",
                }}
              >
                {deleteError}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <Button variant="outline" type="button" onClick={() => setDeleteSource(null)}>
                Cancel
              </Button>
              <Button
                data-testid="confirm-delete-source"
                variant="danger"
                type="button"
                disabled={deleteConfirming}
                onClick={handleDelete}
              >
                {deleteConfirming ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
