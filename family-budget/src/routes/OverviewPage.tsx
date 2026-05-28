import { useParams } from "react-router-dom";

export function OverviewPage() {
  const { yearMonth } = useParams<{ yearMonth: string }>();
  const [year, month] = (yearMonth ?? "").split("-");

  const monthName = new Date(Number(year), Number(month) - 1).toLocaleString("en-PH", {
    month: "long",
    year: "numeric",
  });

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
          Overview
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
        Month overview for {monthName} — budget data will appear here.
      </div>
    </div>
  );
}
