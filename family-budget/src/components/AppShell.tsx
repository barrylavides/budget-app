import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

const MONTHS = [
  { id: "2026-5", label: "May 2026", short: "MAY" },
  { id: "2026-4", label: "Apr 2026", short: "APR" },
  { id: "2026-3", label: "Mar 2026", short: "MAR" },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

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

          {/* Month list */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 0" }}>
            {MONTHS.map((m) => {
              const href = `/month/${m.id}/overview`;
              const isActive = location.pathname.startsWith(`/month/${m.id}`);
              return (
                <Link
                  key={m.id}
                  to={href}
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
                  <div
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
                    {m.short}
                  </div>
                  <div
                    style={{
                      overflow: "hidden",
                      opacity: collapsed ? 0 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-ink)" }}>
                      {m.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 9,
                        color: "var(--color-ink-5)",
                      }}
                    >
                      2 members
                    </div>
                  </div>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontSize: 11,
                      color: "var(--color-ink-4)",
                      flexShrink: 0,
                      opacity: collapsed ? 0 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >
                    👥 2
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
    </div>
  );
}
