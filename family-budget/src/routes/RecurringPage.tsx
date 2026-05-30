import { useState } from "react";
import { useMonths } from "@/hooks/useMonths";
import { useRecurringTemplates } from "@/hooks/useRecurringTemplates";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import type { Database } from "@/lib/database.types";

type Template = Database["public"]["Tables"]["recurring_expense_templates"]["Row"];

const CATEGORIES = ["Bills", "Food", "Utilities", "Home", "Travel", "Health", "Education", "Other"] as const;
const TAGS = ["needs", "wants", "savings", "investment", "business"] as const;
const CADENCES = ["monthly", "quarterly", "yearly"] as const;
const HALVES = [
  { value: "half1", label: "1st Half" },
  { value: "half2", label: "2nd Half" },
];

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const CADENCE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

const HALF_LABELS: Record<string, string> = {
  half1: "1st Half",
  half2: "2nd Half",
};

const CADENCE_COLORS: Record<string, string> = {
  monthly: "var(--color-green)",
  quarterly: "var(--color-amber)",
  yearly: "var(--color-blue)",
};

function formatPHP(amount: number): string {
  return "₱ " + amount.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface TemplateFormData {
  name: string;
  category: string;
  half: string;
  default_amount: string;
  default_source_name: string;
  tag: string;
  cadence: string;
  active: boolean;
  start_year: string;
  start_month: string;
}

const currentYear = new Date().getFullYear();

const EMPTY_FORM: TemplateFormData = {
  name: "",
  category: "Bills",
  half: "half1",
  default_amount: "",
  default_source_name: "",
  tag: "needs",
  cadence: "monthly",
  active: true,
  start_year: String(currentYear),
  start_month: "1",
};

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
  boxSizing: "border-box",
};

interface TemplateFormProps {
  initial?: TemplateFormData;
  saving: boolean;
  error: string | null;
  onSubmit: (data: TemplateFormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

function TemplateForm({
  initial = EMPTY_FORM,
  saving,
  error,
  onSubmit,
  onCancel,
  submitLabel = "Add Template",
}: TemplateFormProps) {
  const [form, setForm] = useState<TemplateFormData>(initial);

  function set(field: keyof TemplateFormData, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
      style={{ display: "flex", flexDirection: "column", gap: 14 }}
    >
      <div>
        <label style={labelStyle}>Name</label>
        <input
          data-testid="template-form-name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
          placeholder="e.g. Electric Bill"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            data-testid="template-form-category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            style={inputStyle}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Half</label>
          <select
            data-testid="template-form-half"
            value={form.half}
            onChange={(e) => set("half", e.target.value)}
            style={inputStyle}
          >
            {HALVES.map((h) => (
              <option key={h.value} value={h.value}>
                {h.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Amount (₱)</label>
          <input
            data-testid="template-form-amount"
            type="number"
            min="0"
            step="0.01"
            value={form.default_amount}
            onChange={(e) => set("default_amount", e.target.value)}
            required
            placeholder="0.00"
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Cadence</label>
          <select
            data-testid="template-form-cadence"
            value={form.cadence}
            onChange={(e) => set("cadence", e.target.value)}
            style={inputStyle}
          >
            {CADENCES.map((c) => (
              <option key={c} value={c}>
                {CADENCE_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Default Source Name (optional)</label>
        <input
          data-testid="template-form-source-name"
          value={form.default_source_name}
          onChange={(e) => set("default_source_name", e.target.value)}
          placeholder="e.g. Wife Payroll — matched by name when generating"
          style={inputStyle}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label style={labelStyle}>Tag</label>
          <select
            data-testid="template-form-tag"
            value={form.tag}
            onChange={(e) => set("tag", e.target.value)}
            style={inputStyle}
          >
            <option value="">None</option>
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Active</label>
          <select
            data-testid="template-form-active"
            value={form.active ? "true" : "false"}
            onChange={(e) => set("active", e.target.value === "true")}
            style={inputStyle}
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Start Month</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <select
            data-testid="template-form-start-year"
            value={form.start_year}
            onChange={(e) => set("start_year", e.target.value)}
            style={inputStyle}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            data-testid="template-form-start-month"
            value={form.start_month}
            onChange={(e) => set("start_month", e.target.value)}
            style={inputStyle}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>
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

function formToInsert(
  form: TemplateFormData,
  householdId: string
): Omit<Template, "id" | "created_at" | "updated_at" | "created_by"> {
  return {
    household_id: householdId,
    name: form.name,
    category: form.category,
    half: form.half,
    default_amount: parseFloat(form.default_amount) || 0,
    default_source_name: form.default_source_name.trim() || null,
    tag: form.tag || null,
    cadence: form.cadence,
    active: form.active,
    start_year_month:
      parseInt(form.start_year, 10) * 100 + parseInt(form.start_month, 10),
  };
}

function templateToForm(t: Template): TemplateFormData {
  const year = Math.floor(t.start_year_month / 100);
  const month = t.start_year_month % 100;
  return {
    name: t.name,
    category: t.category,
    half: t.half,
    default_amount: String(t.default_amount),
    default_source_name: t.default_source_name ?? "",
    tag: t.tag ?? "",
    cadence: t.cadence,
    active: t.active,
    start_year: String(year),
    start_month: String(month),
  };
}

export function RecurringPage() {
  const { householdId } = useMonths();
  const { templates, loading, error, addTemplate, updateTemplate, deleteTemplate } =
    useRecurringTemplates(householdId);

  const [showAdd, setShowAdd] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editTemplate, setEditTemplate] = useState<Template | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [deleteTemplate_, setDeleteTemplate] = useState<Template | null>(null);
  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toggleLoading, setToggleLoading] = useState<string | null>(null);

  async function handleAdd(form: TemplateFormData) {
    if (!householdId) return;
    setAddSaving(true);
    setAddError(null);
    const err = await addTemplate(formToInsert(form, householdId));
    setAddSaving(false);
    if (err) {
      setAddError(err);
    } else {
      setShowAdd(false);
    }
  }

  async function handleEdit(form: TemplateFormData) {
    if (!editTemplate || !householdId) return;
    setEditSaving(true);
    setEditError(null);
    const err = await updateTemplate(editTemplate.id, formToInsert(form, householdId));
    setEditSaving(false);
    if (err) {
      setEditError(err);
    } else {
      setEditTemplate(null);
    }
  }

  async function handleDelete() {
    if (!deleteTemplate_) return;
    setDeleteConfirming(true);
    setDeleteError(null);
    const err = await deleteTemplate(deleteTemplate_.id);
    setDeleteConfirming(false);
    if (err) {
      setDeleteError(err);
    } else {
      setDeleteTemplate(null);
    }
  }

  async function handleToggleActive(t: Template) {
    setToggleLoading(t.id);
    await updateTemplate(t.id, { active: !t.active });
    setToggleLoading(null);
  }

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "var(--color-ink-4)",
            marginBottom: 4,
          }}
        >
          Templates
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "var(--color-ink)",
              letterSpacing: "-0.03em",
              margin: 0,
            }}
          >
            Recurring Expenses
          </h1>
          {householdId && (
            <button
              data-testid="add-template-btn"
              onClick={() => {
                setShowAdd(true);
                setAddError(null);
              }}
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--color-ink-3)",
                background: "var(--color-linen-2)",
                border: "1px solid var(--color-rule)",
                borderRadius: 5,
                padding: "7px 14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              + Add Template
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div
          style={{
            fontSize: 13,
            color: "var(--color-red)",
            background: "var(--color-red-bg)",
            border: "1px solid var(--color-red-rule)",
            borderRadius: 6,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          {error}
        </div>
      )}

      {/* Template list */}
      <div
        data-testid="templates-list"
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
              padding: "24px",
              fontSize: 13,
              color: "var(--color-ink-4)",
              textAlign: "center",
            }}
          >
            Loading…
          </div>
        ) : templates.length === 0 ? (
          <div
            data-testid="templates-empty"
            style={{
              padding: "32px 24px",
              fontSize: 13,
              color: "var(--color-ink-4)",
              textAlign: "center",
            }}
          >
            No recurring templates yet. Add one to auto-generate expenses when creating new months.
          </div>
        ) : (
          <>
            {/* Header row */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 130px",
                gap: 8,
                padding: "8px 16px",
                borderBottom: "1px solid var(--color-rule)",
                background: "var(--color-linen-2)",
              }}
            >
              {["Name", "Category", "Half", "Amount", "Cadence", "Tag", ""].map((col) => (
                <div
                  key={col}
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--color-ink-4)",
                  }}
                >
                  {col}
                </div>
              ))}
            </div>

            {templates.map((t, idx) => (
              <div
                key={t.id}
                data-testid={`template-row-${t.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 130px",
                  gap: 8,
                  padding: "12px 16px",
                  alignItems: "center",
                  borderBottom:
                    idx < templates.length - 1 ? "1px solid var(--color-rule)" : "none",
                  opacity: t.active ? 1 : 0.55,
                }}
              >
                {/* Name */}
                <div
                  data-testid={`template-name-${t.id}`}
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--color-ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {t.name}
                </div>

                {/* Category */}
                <div
                  data-testid={`template-category-${t.id}`}
                  style={{ fontSize: 12, color: "var(--color-ink-3)" }}
                >
                  {t.category}
                </div>

                {/* Half */}
                <div
                  data-testid={`template-half-${t.id}`}
                  style={{ fontSize: 12, color: "var(--color-ink-3)" }}
                >
                  {HALF_LABELS[t.half] ?? t.half}
                </div>

                {/* Amount */}
                <div
                  data-testid={`template-amount-${t.id}`}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    color: "var(--color-ink)",
                  }}
                >
                  {formatPHP(t.default_amount)}
                </div>

                {/* Cadence */}
                <div
                  data-testid={`template-cadence-${t.id}`}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    color: CADENCE_COLORS[t.cadence] ?? "var(--color-ink-3)",
                  }}
                >
                  {CADENCE_LABELS[t.cadence] ?? t.cadence}
                </div>

                {/* Tag */}
                <div
                  data-testid={`template-tag-${t.id}`}
                  style={{ fontSize: 11, color: "var(--color-ink-4)" }}
                >
                  {t.tag ?? "—"}
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <button
                    data-testid={`template-toggle-${t.id}`}
                    onClick={() => handleToggleActive(t)}
                    disabled={toggleLoading === t.id}
                    title={t.active ? "Deactivate" : "Activate"}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: t.active ? "var(--color-green)" : "var(--color-ink-4)",
                      background: t.active ? "var(--color-green-bg)" : "var(--color-linen-3)",
                      border: `1px solid ${t.active ? "var(--color-green-rule)" : "var(--color-rule)"}`,
                      borderRadius: 4,
                      padding: "3px 7px",
                      cursor: "pointer",
                    }}
                  >
                    {t.active ? "Active" : "Inactive"}
                  </button>
                  <button
                    data-testid={`template-edit-${t.id}`}
                    onClick={() => {
                      setEditTemplate(t);
                      setEditError(null);
                    }}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--color-ink-3)",
                      background: "var(--color-linen-3)",
                      border: "1px solid var(--color-rule)",
                      borderRadius: 4,
                      padding: "3px 7px",
                      cursor: "pointer",
                    }}
                  >
                    Edit
                  </button>
                  <button
                    data-testid={`template-delete-${t.id}`}
                    onClick={() => {
                      setDeleteTemplate(t);
                      setDeleteError(null);
                    }}
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      color: "var(--color-red)",
                      background: "var(--color-red-bg)",
                      border: "1px solid var(--color-red-rule)",
                      borderRadius: 4,
                      padding: "3px 7px",
                      cursor: "pointer",
                    }}
                  >
                    Del
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Add Template Modal */}
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Recurring Template">
        <TemplateForm
          saving={addSaving}
          error={addError}
          onSubmit={handleAdd}
          onCancel={() => setShowAdd(false)}
          submitLabel="Add Template"
        />
      </Modal>

      {/* Edit Template Modal */}
      <Modal
        open={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title="Edit Recurring Template"
      >
        {editTemplate && (
          <TemplateForm
            initial={templateToForm(editTemplate)}
            saving={editSaving}
            error={editError}
            onSubmit={handleEdit}
            onCancel={() => setEditTemplate(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!deleteTemplate_}
        onClose={() => setDeleteTemplate(null)}
        title="Delete Template"
      >
        {deleteTemplate_ && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 14, color: "var(--color-ink-2)", lineHeight: 1.5, margin: 0 }}>
              Delete <strong>{deleteTemplate_.name}</strong>? This cannot be undone.
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
              <Button variant="outline" type="button" onClick={() => setDeleteTemplate(null)}>
                Cancel
              </Button>
              <Button
                data-testid="confirm-delete-template"
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
