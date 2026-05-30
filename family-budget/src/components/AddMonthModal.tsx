import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { supabase } from "@/lib/supabase";
import { useToast } from "./ui/Toast";
import { generateExpenses } from "@/budget-engine/recurring";
import type { RecurringTemplate, SourceStub } from "@/budget-engine/recurring";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface AddMonthModalProps {
  open: boolean;
  householdId: string;
  onClose: () => void;
  onCreated: () => void;
}

export function AddMonthModal({ open, householdId, onClose, onCreated }: AddMonthModalProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [monthNum, setMonthNum] = useState(new Date().getMonth() + 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { show: showToast } = useToast();

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const label = `${MONTH_NAMES[monthNum - 1]} ${year}`;

    const { data: newMonth, error: insertErr } = await supabase
      .from("months")
      .insert({ household_id: householdId, year, month_num: monthNum, label })
      .select()
      .single();

    if (insertErr) {
      setSaving(false);
      if (insertErr.code === "23505") {
        setError("This month already exists for your household.");
      } else {
        setError(insertErr.message);
      }
      return;
    }

    // Materialise recurring expenses for the new month
    const [{ data: templatesData }, { data: sourcesData }] = await Promise.all([
      supabase
        .from("recurring_expense_templates")
        .select("*")
        .eq("household_id", householdId),
      supabase
        .from("sources")
        .select("id, name")
        .eq("month_id", newMonth.id),
    ]);

    const templates = (templatesData ?? []).map(
      (t): RecurringTemplate => ({
        id: t.id,
        name: t.name,
        category: t.category,
        half: t.half,
        default_amount: t.default_amount,
        default_source_name: t.default_source_name,
        tag: t.tag,
        cadence: t.cadence as "monthly" | "quarterly" | "yearly",
        active: t.active,
        start_year_month: t.start_year_month,
      })
    );

    const sources = (sourcesData ?? []) as SourceStub[];

    const expenses = generateExpenses(templates, newMonth.id, year, monthNum, sources);

    if (expenses.length > 0) {
      await supabase.from("expenses").insert(expenses);
      const count = expenses.length;
      showToast(
        `${count} recurring expense${count !== 1 ? "s" : ""} generated — review and adjust`,
        "success"
      );
    }

    setSaving(false);
    onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Add Month">
      <form
        onSubmit={handleSubmit}
        data-testid="add-month-form"
        style={{ display: "flex", flexDirection: "column", gap: 16 }}
      >
        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-ink-3)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Year
          </label>
          <select
            data-testid="add-month-year"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--color-rule)",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--color-ink)",
              background: "var(--color-linen)",
              cursor: "pointer",
            }}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--color-ink-3)",
              display: "block",
              marginBottom: 6,
            }}
          >
            Month
          </label>
          <select
            data-testid="add-month-month"
            value={monthNum}
            onChange={(e) => setMonthNum(Number(e.target.value))}
            style={{
              width: "100%",
              padding: "8px 12px",
              border: "1px solid var(--color-rule)",
              borderRadius: 6,
              fontSize: 14,
              color: "var(--color-ink)",
              background: "var(--color-linen)",
              cursor: "pointer",
            }}
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            data-testid="add-month-error"
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
            {saving ? "Adding…" : "Add Month"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
