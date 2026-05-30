import { useState, useMemo } from "react";
import { useMonths } from "@/hooks/useMonths";
import { useStatisticsData } from "@/hooks/useStatisticsData";
import {
  aggregateByCategory,
  aggregateByTag,
  computeStatsSummary,
  type CategoryAggregate,
  type TagAggregate,
} from "@/budget-engine/statistics";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatPHP(amount: number): string {
  return (
    "₱ " +
    amount.toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function monthLabel(year: number, monthNum: number, label: string | null): string {
  if (label) return label;
  const date = new Date(year, monthNum - 1);
  return date.toLocaleString("en-PH", { month: "long", year: "numeric" });
}

// ── Category color palette ────────────────────────────────────────────────────

const CATEGORY_COLORS = [
  "#1d4ed8", // blue
  "#16a34a", // green
  "#b45309", // amber
  "#dc2626", // red
  "#7c3aed", // violet
  "#0891b2", // cyan
  "#be185d", // pink
  "#d97706", // orange
  "#0e0e0b", // ink
  "#5a5a52", // ink-3
  "#9a9a8e", // ink-4
  "#c8c8bc", // ink-5
];

function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// ── Tag color map ─────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  needs: "#1d4ed8",
  wants: "#b45309",
  savings: "#16a34a",
  investment: "#5a5a52",
  business: "#0e0e0b",
  untagged: "#c8c8bc",
};

function getTagColor(tag: string): string {
  return TAG_COLORS[tag] ?? "#9a9a8e";
}

// ── Donut Chart ───────────────────────────────────────────────────────────────

interface DonutSlice {
  label: string;
  amount: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  testId: string;
  legendTestIdPrefix: string;
}

function DonutChart({ slices, testId, legendTestIdPrefix }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const outerR = 70;
  const innerR = 44;
  const gap = 0.015; // radians gap between slices

  const total = slices.reduce((s, sl) => s + sl.amount, 0);

  // Build arc paths
  const arcs = useMemo(() => {
    if (total === 0 || slices.length === 0) return [];

    let angle = -Math.PI / 2; // start at top
    return slices.map((sl, i) => {
      const fraction = sl.amount / total;
      const sweep = fraction * 2 * Math.PI - gap;
      const startAngle = angle + gap / 2;
      const endAngle = startAngle + sweep;

      const x1 = cx + outerR * Math.cos(startAngle);
      const y1 = cy + outerR * Math.sin(startAngle);
      const x2 = cx + outerR * Math.cos(endAngle);
      const y2 = cy + outerR * Math.sin(endAngle);
      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArc = sweep > Math.PI ? 1 : 0;

      const d = [
        `M ${x1} ${y1}`,
        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${ix1} ${iy1}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
        "Z",
      ].join(" ");

      angle += fraction * 2 * Math.PI;
      return { d, color: sl.color, index: i };
    });
  }, [slices, total, cx, cy, outerR, innerR, gap]);

  const hoveredSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div
      data-testid={testId}
      style={{
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 10,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 24,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* SVG donut */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width={size} height={size}>
            {slices.length === 0 || total === 0 ? (
              <circle
                cx={cx}
                cy={cy}
                r={(outerR + innerR) / 2}
                fill="none"
                stroke="var(--color-linen-3)"
                strokeWidth={outerR - innerR}
              />
            ) : (
              arcs.map((arc) => (
                <path
                  key={arc.index}
                  d={arc.d}
                  fill={arc.color}
                  opacity={
                    hovered === null || hovered === arc.index ? 1 : 0.4
                  }
                  style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                  onMouseEnter={() => setHovered(arc.index)}
                  onMouseLeave={() => setHovered(null)}
                />
              ))
            )}
          </svg>
          {/* Center label */}
          {hoveredSlice && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: size,
                height: size,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--color-ink)",
                  fontFamily: "var(--font-mono)",
                  maxWidth: innerR * 2 - 8,
                  textAlign: "center",
                  wordBreak: "break-word",
                  lineHeight: 1.2,
                }}
              >
                {hoveredSlice.percentage}%
              </div>
            </div>
          )}
        </div>

        {/* Legend */}
        <div
          style={{
            flex: 1,
            minWidth: 160,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            paddingTop: 4,
          }}
        >
          {slices.map((sl, i) => (
            <div
              key={sl.label}
              data-testid={`${legendTestIdPrefix}-${sl.label}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                cursor: "default",
                opacity: hovered === null || hovered === i ? 1 : 0.4,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 2,
                  background: sl.color,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "var(--color-ink-2)",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {sl.label}
                </div>
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  color: "var(--color-ink-3)",
                  whiteSpace: "nowrap",
                  marginLeft: "auto",
                }}
              >
                {formatPHP(sl.amount)}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10,
                  color: "var(--color-ink-5)",
                  width: 30,
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                {sl.percentage}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Horizontal Bar Chart ──────────────────────────────────────────────────────

interface BarChartProps {
  categories: CategoryAggregate[];
}

function HorizontalBarChart({ categories }: BarChartProps) {
  const max = categories.length > 0 ? categories[0].amount : 0;

  return (
    <div
      data-testid="stats-bar-chart"
      style={{
        background: "var(--color-linen)",
        border: "1px solid var(--color-rule)",
        borderRadius: 10,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--color-ink-4)",
          marginBottom: 4,
        }}
      >
        Spending by Category
      </div>
      {categories.map((cat, i) => {
        const widthPct = max > 0 ? (cat.amount / max) * 100 : 0;
        return (
          <div
            key={cat.category}
            data-testid={`stats-bar-${cat.category}`}
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              style={{
                width: 100,
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--color-ink-2)",
                textTransform: "capitalize",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: "right",
              }}
            >
              {cat.category}
            </div>
            <div
              style={{
                flex: 1,
                height: 16,
                background: "var(--color-linen-3)",
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${widthPct}%`,
                  background: getCategoryColor(i),
                  borderRadius: 4,
                  transition: "width 0.3s",
                }}
              />
            </div>
            <div
              style={{
                width: 90,
                flexShrink: 0,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--color-ink-3)",
                textAlign: "right",
                whiteSpace: "nowrap",
              }}
            >
              {formatPHP(cat.amount)}
            </div>
          </div>
        );
      })}
      {categories.length === 0 && (
        <div style={{ color: "var(--color-ink-4)", fontSize: 13, textAlign: "center", padding: "16px 0" }}>
          No category data
        </div>
      )}
    </div>
  );
}

// ── Summary Cards ─────────────────────────────────────────────────────────────

interface StatsSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
  netRemaining: number;
}

function StatsSummaryCards({ totalIncome, totalExpenses, netRemaining }: StatsSummaryCardsProps) {
  const isPositive = netRemaining >= 0;

  const cardStyle: React.CSSProperties = {
    flex: "1 1 0",
    minWidth: 130,
    background: "var(--color-linen)",
    border: "1px solid var(--color-rule)",
    borderRadius: 8,
    padding: "12px 14px",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: "var(--color-ink-4)",
    marginBottom: 6,
  };

  const valueStyle = (colored?: "green" | "red"): React.CSSProperties => ({
    fontFamily: "var(--font-mono)",
    fontSize: 16,
    fontWeight: 600,
    color:
      colored === "green"
        ? "var(--color-green)"
        : colored === "red"
        ? "var(--color-red)"
        : "var(--color-ink)",
    lineHeight: 1.2,
  });

  return (
    <div
      data-testid="stats-summary-cards"
      style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}
    >
      <div style={cardStyle} data-testid="stats-total-income">
        <div style={labelStyle}>Total Income</div>
        <div style={valueStyle()}>{formatPHP(totalIncome)}</div>
      </div>
      <div style={cardStyle} data-testid="stats-total-expenses">
        <div style={labelStyle}>Total Expenses</div>
        <div style={valueStyle()}>{formatPHP(totalExpenses)}</div>
      </div>
      <div
        style={{
          ...cardStyle,
          border: isPositive
            ? "1px solid var(--color-rule)"
            : "1px solid var(--color-red-rule)",
        }}
        data-testid="stats-net-remaining"
      >
        <div style={labelStyle}>Net Remaining</div>
        <div style={valueStyle(isPositive ? "green" : "red")}>{formatPHP(netRemaining)}</div>
      </div>
    </div>
  );
}

// ── Section heading helper ────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: "var(--color-ink-4)",
        marginBottom: 8,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function StatisticsPage() {
  const { months, loading: monthsLoading } = useMonths();

  // Default to the most recent month
  const [selectedMonthId, setSelectedMonthId] = useState<string | null>(null);

  // Once months are loaded, default to the last one
  const resolvedMonthId = useMemo(() => {
    if (selectedMonthId !== null) return selectedMonthId;
    if (months.length === 0) return null;
    return months[months.length - 1].id;
  }, [selectedMonthId, months]);

  const { expenses, sources, loading: dataLoading, error } = useStatisticsData(resolvedMonthId);

  const summary = useMemo(
    () => computeStatsSummary(sources, expenses),
    [sources, expenses]
  );

  const categoryAggregates: CategoryAggregate[] = useMemo(
    () => aggregateByCategory(expenses),
    [expenses]
  );

  const tagAggregates: TagAggregate[] = useMemo(
    () => aggregateByTag(expenses),
    [expenses]
  );

  const categorySlices = useMemo(
    () =>
      categoryAggregates.map((ca, i) => ({
        label: ca.category,
        amount: ca.amount,
        percentage: ca.percentage,
        color: getCategoryColor(i),
      })),
    [categoryAggregates]
  );

  const tagSlices = useMemo(
    () =>
      tagAggregates.map((ta) => ({
        label: ta.tag,
        amount: ta.amount,
        percentage: ta.percentage,
        color: getTagColor(ta.tag),
      })),
    [tagAggregates]
  );

  const loading = monthsLoading || dataLoading;
  const hasData = expenses.length > 0;

  return (
    <div>
      {/* Page header */}
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
          Analytics
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 700,
            color: "var(--color-ink)",
            letterSpacing: "-0.03em",
          }}
        >
          Statistics
        </h1>
      </div>

      {/* Month selector */}
      <div style={{ marginBottom: 20 }}>
        <select
          data-testid="month-select"
          value={resolvedMonthId ?? ""}
          onChange={(e) => setSelectedMonthId(e.target.value || null)}
          disabled={monthsLoading}
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--color-ink)",
            background: "var(--color-linen)",
            border: "1px solid var(--color-rule)",
            borderRadius: 6,
            padding: "6px 10px",
            cursor: "pointer",
            appearance: "none",
            WebkitAppearance: "none",
            minWidth: 180,
          }}
        >
          {months.map((m) => (
            <option key={m.id} value={m.id}>
              {monthLabel(m.year, m.month_num, m.label)}
            </option>
          ))}
          {months.length === 0 && <option value="">No months</option>}
        </select>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            color: "var(--color-ink-4)",
            fontSize: 14,
            padding: "28px 0",
            textAlign: "center",
          }}
        >
          Loading...
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div
          style={{
            color: "var(--color-red)",
            fontSize: 13,
            padding: "12px 16px",
            background: "var(--color-red-bg)",
            border: "1px solid var(--color-red-rule)",
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasData && (
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
          No data for this month
        </div>
      )}

      {/* Main content — shown when data is available */}
      {!loading && !error && hasData && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Summary cards */}
          <StatsSummaryCards
            totalIncome={summary.totalIncome}
            totalExpenses={summary.totalExpenses}
            netRemaining={summary.netRemaining}
          />

          {/* Donut charts row */}
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              <SectionHeading>By Category</SectionHeading>
              <DonutChart
                testId="stats-donut-category"
                legendTestIdPrefix="stats-legend-category"
                slices={categorySlices}
              />
            </div>
            <div style={{ flex: "1 1 300px" }}>
              <SectionHeading>By Tag</SectionHeading>
              <DonutChart
                testId="stats-donut-tag"
                legendTestIdPrefix="stats-legend-tag"
                slices={tagSlices}
              />
            </div>
          </div>

          {/* Horizontal bar chart */}
          <div>
            <HorizontalBarChart categories={categoryAggregates} />
          </div>
        </div>
      )}
    </div>
  );
}
