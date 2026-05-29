import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { useMonths } from "@/hooks/useMonths";
import { AddMonthModal } from "./AddMonthModal";

const MONTH_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [showAddMonth, setShowAddMonth] = useState(false);
  const location = useLocation();
  const { months, memberCount, householdId, loading, refresh } = useMonths();

  function handleMonthCreated() {
    setShowAddMonth(false);
    refresh();
  }

  return (
    <div
      data-testid="app-shell"
      style={{
        minWidth: 900,
        minHeight: "100vh",
        background: "var(--color-linen)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* TOPBAR */}
      <header
        data-testid="topbar"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          borderBottom: "1px solid var(--color-rule)",
          background: "var(--color-linen)",
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "var(--topbar-h)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              background: "var(--color-ink)",
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-linen)",
              fontSize: 14,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            FB
          </div>
          <div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "var(--color-ink)",
                letterSpacing: "-0.02em",
                whiteSpace: "nowrap",
              }}
            >
              FamilyBudget
            </div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 600,
                color: "var(--color-ink-5)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginTop: 1,
              }}
            >
              Expense Tracker
            </div>
          </div>
        </div>

        <div
          data-testid="topbar-badge"
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "var(--color-green)",
            border: "1.5px solid var(--color-green-rule)",
            borderRadius: 4,
            padding: "3px 9px",
            background: "var(--color-green-bg)",
            textTransform: "uppercase",
          }}
        >
          Phase 1
        </div>
      </header>

      {/* MAIN LAYOUT */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* SIDEBAR */}
        <aside
          data-testid="sidebar"
          style={{
            width: collapsed ? "var(--sidebar-collapsed-w)" : "var(--sidebar-w)",
            flexShrink: 0,
            borderRight: "1px solid var(--color-rule)",
            display: "flex",
            flexDirection: "column",
            position: "sticky",
            top: "var(--topbar-h)",
            height: "calc(100vh - var(--topbar-h))",
            overflow: "hidden",
            transition: "width 0.25s cubic-bezier(0.22,1,0.36,1)",
            background: "var(--color-linen)",
          }}
        >
          {/* Sidebar toggle header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 14px 12px",
              borderBottom: "1px solid var(--color-rule)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--color-ink-4)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                opacity: collapsed ? 0 : 1,
                transition: "opacity 0.15s",
              }}
            >
              Months
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {!collapsed && (
                <button
                  data-testid="add-month-btn"
                  onClick={() => setShowAddMonth(true)}
                  aria-label="Add month"
                  title="Add month"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    border: "1px solid var(--color-rule)",
                    background: "var(--color-linen-2)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--color-ink-3)",
                    fontSize: 16,
                    lineHeight: 1,
                  }}
                >
                  +
                </button>
              )}
              <button
                onClick={() => setCollapsed((c) => !c)}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 4,
                  border: "1px solid var(--color-rule)",
                  background: "var(--color-linen-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-ink-4)",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                {collapsed ? "→" : "←"}
              </button>
            </div>
          </div>

          {/* Month list */}
          <div
            style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 0" }}
          >
            {loading && months.length === 0 && (
              <div
                style={{
                  padding: "14px",
                  fontSize: 11,
                  color: "var(--color-ink-5)",
                  opacity: collapsed ? 0 : 1,
                }}
              >
                Loading…
              </div>
            )}

            {months.map((m) => {
              const short = MONTH_SHORT[m.month_num - 1];
              const label = m.label ?? `${short[0]}${short.slice(1).toLowerCase()} ${m.year}`;
              const monthId = `${m.year}-${m.month_num}`;
              const href = `/month/${monthId}/overview`;
              const isActive = location.pathname.startsWith(`/month/${monthId}`);
              const tooltipLabel = `${label} — ${memberCount} member${memberCount !== 1 ? "s" : ""}`;

              return (
                <Link
                  key={m.id}
                  to={href}
                  data-testid={`month-item-${monthId}`}
                  title={collapsed ? tooltipLabel : undefined}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 14px",
                    cursor: "pointer",
                    borderLeft: `2.5px solid ${isActive ? "var(--color-ink)" : "transparent"}`,
                    background: isActive ? "var(--color-linen-2)" : "transparent",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    position: "relative",
                    transition: "all 0.12s",
                  }}
                >
                  {/* Month icon */}
                  <div
                    data-testid={`month-icon-${monthId}`}
                    style={{
                      width: 28,
                      height: 28,
                      background: isActive ? "var(--color-ink)" : "var(--color-green)",
                      borderRadius: 5,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {short}
                  </div>

                  {/* Month name + sub-label */}
                  <div
                    style={{
                      overflow: "hidden",
                      opacity: collapsed ? 0 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <div
                      data-testid={`month-label-${monthId}`}
                      style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}
                    >
                      {label}
                    </div>
                    <div
                      data-testid={`month-sublabel-${monthId}`}
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--color-ink-5)",
                      }}
                    >
                      {memberCount} member{memberCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                  {/* User count indicator */}
                  <span
                    data-testid={`month-user-count-${monthId}`}
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--color-ink-4)",
                      flexShrink: 0,
                      opacity: collapsed ? 0 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    👥 {memberCount}
                  </span>
                </Link>
              );
            })}

            {/* Navigation links */}
            <div
              style={{
                height: 1,
                background: "var(--color-rule)",
                margin: "10px 14px",
              }}
            />
            <Link
              to="/recurring"
              title={collapsed ? "Recurring" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                cursor: "pointer",
                borderLeft: `2.5px solid ${location.pathname === "/recurring" ? "var(--color-ink)" : "transparent"}`,
                background:
                  location.pathname === "/recurring" ? "var(--color-linen-2)" : "transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "var(--color-ink-5)",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                ↻
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-ink-3)",
                  opacity: collapsed ? 0 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                Recurring
              </span>
            </Link>

            <Link
              to="/statistics"
              title={collapsed ? "Statistics" : undefined}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 14px",
                cursor: "pointer",
                borderLeft: `2.5px solid ${location.pathname === "/statistics" ? "var(--color-ink)" : "transparent"}`,
                background:
                  location.pathname === "/statistics" ? "var(--color-linen-2)" : "transparent",
                textDecoration: "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  background: "var(--color-ink-5)",
                  borderRadius: 5,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: 12,
                  flexShrink: 0,
                }}
              >
                ◎
              </div>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--color-ink-3)",
                  opacity: collapsed ? 0 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                Statistics
              </span>
            </Link>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main
          data-testid="content-area"
          style={{
            flex: 1,
            padding: "28px 36px",
            overflowY: "auto",
            minWidth: 0,
          }}
        >
          {children}
        </main>
      </div>

      {/* Add Month Modal */}
      {householdId && (
        <AddMonthModal
          open={showAddMonth}
          householdId={householdId}
          onClose={() => setShowAddMonth(false)}
          onCreated={handleMonthCreated}
        />
      )}
    </div>
  );
}
