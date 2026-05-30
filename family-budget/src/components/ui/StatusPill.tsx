import type { ExpenseStatus } from "@/budget-engine";

const STATUS_CONFIG: Record<ExpenseStatus, { label: string; bg: string; color: string }> = {
  paid: { label: "Paid", bg: "var(--color-green-bg)", color: "var(--color-green)" },
  partial: { label: "Partial", bg: "var(--color-amber-bg)", color: "var(--color-amber)" },
  unpaid: { label: "Unpaid", bg: "var(--color-linen-3)", color: "var(--color-ink-4)" },
  overpaid: { label: "Overpaid", bg: "var(--color-blue-bg)", color: "var(--color-blue)" },
};

interface StatusPillProps {
  status: ExpenseStatus;
  onClick?: () => void;
  "data-testid"?: string;
}

export function StatusPill({ status, onClick, "data-testid": testId }: StatusPillProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 20,
        border: "none",
        background: cfg.bg,
        color: cfg.color,
        cursor: onClick ? "pointer" : "default",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </button>
  );
}
