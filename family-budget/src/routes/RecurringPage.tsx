export function RecurringPage() {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
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
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.03em",
          }}
        >
          Recurring Expenses
        </h1>
      </div>

      <div
        style={{
          background: "var(--color-linen-2)",
          border: "1px solid var(--color-rule)",
          borderRadius: 8,
          padding: "28px",
          color: "var(--color-ink-3)",
          fontSize: 14,
          textAlign: "center",
        }}
      >
        Recurring expense templates will appear here.
      </div>
    </div>
  );
}
