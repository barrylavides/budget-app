import { useState, useCallback } from "react";

/* ─── GLOBAL STYLES ─────────────────────────────────────── */
const G = `
@import url('https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body, #root { height: 100%; width: 100%; }

:root {
  --linen:      #fafaf7; --linen-2: #f3f2ec; --linen-3: #eae9e1; --linen-4: #dddbd0;
  --ink: #0e0e0b; --ink-2: #2a2a25; --ink-3: #5a5a52; --ink-4: #9a9a8e; --ink-5: #c8c8bc;
  --rule: #e2e1d8;
  --green: #16a34a; --green-bg: #f0fdf4; --green-rule: #bbf7d0;
  --red: #dc2626; --red-bg: #fef2f2; --red-rule: #fecaca;
  --amber: #b45309; --amber-bg: #fffbeb; --amber-rule: #fde68a;
  --blue: #1d4ed8; --blue-bg: #eff6ff; --blue-rule: #bfdbfe;
  --sans: 'DM Sans', system-ui, sans-serif;
  --mono: 'DM Mono', 'Courier New', monospace;
  --sidebar-w: 230px; --sidebar-collapsed-w: 56px; --topbar-h: 57px;
}

body { font-family: var(--sans); background: #e8e7e0; min-height: 100vh; overflow-x: auto; overflow-y: auto; }

.fb-shell { min-width: 900px; min-height: 100vh; background: var(--linen); display: flex; flex-direction: column; }

/* TOPBAR */
.fb-topbar { display: flex; align-items: center; justify-content: space-between; padding: 16px 32px; border-bottom: 1px solid var(--rule); background: var(--linen); position: sticky; top: 0; z-index: 50; height: var(--topbar-h); }
.fb-logo-wrap { display: flex; align-items: center; gap: 10px; }
.fb-logo-icon { width: 30px; height: 30px; background: var(--ink); border-radius: 6px; display: flex; align-items: center; justify-content: center; color: var(--linen); font-size: 14px; font-weight: 700; flex-shrink: 0; }
.fb-logo-name { font-size: 16px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; white-space: nowrap; }
.fb-logo-sub  { font-size: 9px; font-weight: 600; color: var(--ink-5); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 1px; white-space: nowrap; }
.fb-badge { font-size: 9px; font-weight: 700; letter-spacing: 0.08em; color: var(--ink-3); border: 1.5px solid var(--rule); border-radius: 4px; padding: 3px 9px; background: var(--linen-2); text-transform: uppercase; white-space: nowrap; }
.fb-badge.green { color: var(--green); border-color: var(--green-rule); background: var(--green-bg); }
.fb-badge.red   { color: var(--red);   border-color: var(--red-rule);   background: var(--red-bg); }

/* LAYOUT */
.fb-main { display: flex; flex: 1; min-height: 0; }

/* SIDEBAR */
.fb-sidebar { width: var(--sidebar-w); flex-shrink: 0; border-right: 1px solid var(--rule); display: flex; flex-direction: column; position: sticky; top: var(--topbar-h); height: calc(100vh - var(--topbar-h)); overflow: hidden; transition: width 0.25s cubic-bezier(0.22,1,0.36,1); background: var(--linen); }
.fb-sidebar.collapsed { width: var(--sidebar-collapsed-w); }
.fb-sidebar-toggle { display: flex; align-items: center; justify-content: space-between; padding: 16px 14px 12px; border-bottom: 1px solid var(--rule); flex-shrink: 0; }
.fb-sidebar-toggle-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-4); white-space: nowrap; overflow: hidden; transition: opacity 0.15s; }
.fb-sidebar.collapsed .fb-sidebar-toggle-lbl { opacity: 0; width: 0; }
.fb-collapse-btn { width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--rule); background: var(--linen-2); cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--ink-4); font-size: 12px; flex-shrink: 0; transition: all 0.15s; }
.fb-collapse-btn:hover { border-color: var(--ink-5); color: var(--ink); background: var(--linen-3); }
.fb-sidebar-scroll { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 10px 0; }
.fb-month-item { display: flex; align-items: center; gap: 10px; padding: 9px 14px; cursor: pointer; border-left: 2.5px solid transparent; transition: all 0.12s; user-select: none; white-space: nowrap; overflow: hidden; position: relative; }
.fb-month-item:hover { background: var(--linen-2); }
.fb-month-item.active { background: var(--linen-2); border-left-color: var(--ink); }
.fb-month-icon { width: 28px; height: 28px; background: var(--green); border-radius: 5px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 10px; font-weight: 700; flex-shrink: 0; transition: background 0.15s; }
.fb-month-item.active .fb-month-icon { background: var(--ink); }
.fb-month-info { overflow: hidden; transition: opacity 0.15s; }
.fb-sidebar.collapsed .fb-month-info { opacity: 0; width: 0; }
.fb-month-name { font-size: 12px; font-weight: 600; color: var(--ink); }
.fb-month-sub  { font-family: var(--mono); font-size: 9px; color: var(--ink-5); }
.fb-month-users { margin-left: auto; font-size: 11px; color: var(--ink-4); flex-shrink: 0; transition: opacity 0.15s; }
.fb-sidebar.collapsed .fb-month-users { opacity: 0; width: 0; overflow: hidden; }
.fb-month-item .fb-tooltip { display: none; position: absolute; left: calc(var(--sidebar-collapsed-w) + 4px); top: 50%; transform: translateY(-50%); background: var(--ink); color: var(--linen); font-size: 11px; font-weight: 600; padding: 5px 10px; border-radius: 4px; white-space: nowrap; z-index: 100; pointer-events: none; }
.fb-sidebar.collapsed .fb-month-item:hover .fb-tooltip { display: block; }
.fb-divider { height: 1px; background: var(--rule); margin: 10px 14px; }
.fb-add-month-btn { display: flex; align-items: center; gap: 8px; padding: 9px 14px; cursor: pointer; color: var(--ink-4); font-family: var(--sans); font-size: 11px; font-weight: 600; border: none; background: none; width: 100%; text-align: left; transition: color 0.12s; white-space: nowrap; overflow: hidden; }
.fb-add-month-btn:hover { color: var(--ink); }
.fb-add-month-icon { width: 28px; height: 28px; flex-shrink: 0; border: 1.5px dashed var(--ink-4); border-radius: 5px; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: border-color 0.12s; }
.fb-add-month-btn:hover .fb-add-month-icon { border-color: var(--ink); }
.fb-add-month-lbl { transition: opacity 0.15s; }
.fb-sidebar.collapsed .fb-add-month-lbl { opacity: 0; width: 0; overflow: hidden; }

/* CONTENT */
.fb-content { flex: 1; padding: 28px 36px; overflow-y: auto; min-width: 0; }
.fb-page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px; }
.fb-eyebrow { font-size: 9px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.fb-eyebrow::before { content: ''; display: block; width: 13px; height: 1.5px; background: var(--ink-5); }
.fb-page-title { font-size: 26px; font-weight: 700; color: var(--ink); letter-spacing: -0.03em; line-height: 1.1; }
.fb-header-actions { display: flex; gap: 8px; align-items: center; }

/* SEGMENTED CONTROL */
.fb-seg-wrap { display: flex; align-items: center; gap: 10px; margin-bottom: 22px; flex-wrap: wrap; }
.fb-seg { display: inline-flex; padding: 3px; background: var(--linen-2); border: 1px solid var(--rule); border-radius: 7px; gap: 2px; }
.fb-seg-btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 5px; border: none; background: transparent; cursor: pointer; font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: var(--ink-4); transition: all 0.15s; white-space: nowrap; }
.fb-seg-btn:hover { color: var(--ink-3); background: var(--linen-3); }
.fb-seg-btn.active { background: var(--linen); color: var(--ink); box-shadow: 0 1px 3px rgba(14,14,11,0.12), 0 0 0 1px var(--rule); }
.fb-seg-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; transition: background 0.15s; }
.fb-seg-salary { font-family: var(--mono); font-size: 9px; font-weight: 400; color: var(--ink-4); letter-spacing: 0; text-transform: none; background: var(--linen-3); border: 1px solid var(--rule); border-radius: 3px; padding: 1px 6px; white-space: nowrap; }

/* BUTTONS */
.fb-btn { font-family: var(--sans); font-size: 11px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; border-radius: 5px; padding: 9px 16px; cursor: pointer; border: none; transition: all 0.15s; }
.fb-btn:active { transform: scale(0.97); }
.fb-btn-ink { background: var(--ink); color: var(--linen); }
.fb-btn-ink:hover { background: var(--ink-2); }
.fb-btn-outline { background: transparent; border: 1.5px solid var(--linen-4); color: var(--ink-2); }
.fb-btn-outline:hover { border-color: var(--ink-5); background: var(--linen-2); }
.fb-btn-danger { background: var(--red); color: #fff; }
.fb-btn-danger:hover { background: #b91c1c; }

/* SUMMARY CARDS */
.fb-summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 24px; }
.fb-sum-card { background: var(--linen); border: 1px solid var(--rule); border-radius: 8px; padding: 14px 15px; transition: border-color 0.15s; }
.fb-sum-card:hover { border-color: var(--ink-5); }
.fb-sum-card.hero { background: var(--ink); border-color: var(--ink); }
.fb-sum-lbl { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 5px; }
.fb-sum-card.hero .fb-sum-lbl { color: rgba(250,250,247,0.4); }
.fb-sum-val { font-family: var(--mono); font-size: 17px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; line-height: 1.2; }
.fb-sum-card.hero .fb-sum-val { color: var(--linen); }
.fb-sum-val.green { color: var(--green); }
.fb-sum-val.red   { color: var(--red); }
.fb-sum-sub { font-size: 9px; color: var(--ink-5); margin-top: 3px; }
.fb-sum-card.hero .fb-sum-sub { color: rgba(250,250,247,0.25); }
.fb-prog-wrap { height: 3px; background: var(--linen-3); border-radius: 2px; margin-top: 8px; overflow: hidden; }
.fb-prog-bar  { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.fb-budget-input { font-family: var(--sans); width: 100%; padding: 6px 8px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 4px; font-size: 11px; color: var(--linen); outline: none; margin-top: 8px; transition: border-color 0.15s; }
.fb-budget-input::placeholder { color: rgba(250,250,247,0.3); }
.fb-budget-input:focus { border-color: rgba(255,255,255,0.35); }

/* SECTION HDR */
.fb-section-hdr { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.fb-section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); }
.fb-section-meta  { font-family: var(--mono); font-size: 9px; color: var(--ink-5); }

/* VIEW TOGGLE */
.fb-view-toggle { display: flex; gap: 2px; padding: 3px; background: var(--linen-2); border: 1px solid var(--rule); border-radius: 6px; }
.fb-view-btn { width: 28px; height: 26px; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 13px; background: transparent; color: var(--ink-5); transition: all 0.12s; }
.fb-view-btn:hover { color: var(--ink-3); }
.fb-view-btn.active { background: var(--linen); color: var(--ink); box-shadow: 0 1px 3px rgba(14,14,11,0.1); }

/* CATEGORY TILE */
.fb-cat-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap: 10px; margin-bottom: 8px; }
.fb-cat-card { background: var(--linen); border: 1px solid var(--rule); border-radius: 8px; padding: 16px 18px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
.fb-cat-card:hover { border-color: var(--ink-4); background: var(--linen-2); transform: translateY(-1px); }
.fb-cat-card:active { transform: translateY(0); }
.fb-cat-card-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.fb-cat-icon { width: 32px; height: 32px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 15px; flex-shrink: 0; }
.fb-cat-count { font-family: var(--mono); font-size: 9px; color: var(--ink-5); }
.fb-cat-name  { font-size: 13px; font-weight: 700; color: var(--ink); margin-bottom: 2px; }
.fb-cat-total { font-family: var(--mono); font-size: 15px; font-weight: 500; color: var(--ink); letter-spacing: -0.01em; }
.fb-cat-paid-bar { margin-top: 10px; }
.fb-cat-paid-lbl { display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: var(--ink-5); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 4px; }
.fb-cat-arrow { position: absolute; right: 14px; bottom: 14px; font-size: 14px; color: var(--ink-5); transition: color 0.12s, transform 0.12s; }
.fb-cat-card:hover .fb-cat-arrow { color: var(--ink-3); transform: translateX(2px); }

/* CATEGORY LIST */
.fb-cat-list { display: flex; flex-direction: column; border: 1px solid var(--rule); border-radius: 8px; overflow: hidden; }
.fb-cat-list-row { display: flex; align-items: center; gap: 14px; padding: 13px 16px; cursor: pointer; border-bottom: 1px solid var(--rule); transition: background 0.1s; background: var(--linen); }
.fb-cat-list-row:last-child { border-bottom: none; }
.fb-cat-list-row:hover { background: var(--linen-2); }
.fb-cat-list-icon { width: 34px; height: 34px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.fb-cat-list-name  { font-size: 13px; font-weight: 700; color: var(--ink); min-width: 110px; }
.fb-cat-list-count { font-family: var(--mono); font-size: 9px; color: var(--ink-5); margin-top: 1px; }
.fb-cat-list-bar-wrap { flex: 1; min-width: 80px; }
.fb-cat-list-bar-lbl { display: flex; justify-content: space-between; font-size: 8px; font-weight: 600; color: var(--ink-5); letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 3px; }
.fb-cat-list-total { font-family: var(--mono); font-size: 13px; font-weight: 500; color: var(--ink); text-align: right; min-width: 90px; }
.fb-cat-list-chevron { font-size: 14px; color: var(--ink-5); flex-shrink: 0; transition: color 0.12s, transform 0.12s; }
.fb-cat-list-row:hover .fb-cat-list-chevron { color: var(--ink-3); transform: translateX(2px); }

/* BREADCRUMB */
.fb-breadcrumb { display: flex; align-items: center; gap: 6px; margin-bottom: 20px; }
.fb-breadcrumb-back { display: flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 600; color: var(--ink-4); cursor: pointer; border: none; background: none; padding: 5px 8px; border-radius: 4px; transition: all 0.12s; font-family: var(--sans); }
.fb-breadcrumb-back:hover { color: var(--ink); background: var(--linen-2); }
.fb-breadcrumb-sep { color: var(--ink-5); font-size: 12px; }
.fb-breadcrumb-current { font-size: 11px; font-weight: 600; color: var(--ink-3); }

/* TABLE */
.fb-table-wrap { overflow-x: auto; }
.fb-table { width: 100%; border-collapse: collapse; font-size: 13px; min-width: 640px; }
.fb-table thead tr { border-bottom: 1.5px solid var(--rule); }
.fb-table th { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-5); text-align: left; padding: 0 10px 10px 0; white-space: nowrap; }
.fb-table th.r { text-align: right; padding-right: 0; }
.fb-table th.c { text-align: center; }
.fb-table tbody tr { border-bottom: 1px solid var(--rule); transition: background 0.1s; }
.fb-table tbody tr:hover { background: var(--linen-2); }
.fb-table tbody tr:last-child { border-bottom: none; }
.fb-table td { padding: 10px 10px 10px 0; vertical-align: middle; }
.fb-table td.r { text-align: right; padding-right: 0; }
.fb-table td.c { text-align: center; }
.fb-td-name { font-weight: 600; color: var(--ink); }
.fb-td-mono { font-family: var(--mono); font-size: 12px; color: var(--ink-2); }
.fb-cat-pill { font-size: 9px; font-weight: 600; letter-spacing: 0.04em; color: var(--ink-4); background: var(--linen-2); border: 1px solid var(--rule); border-radius: 3px; padding: 2px 7px; display: inline-block; }

/* SPLIT DISPLAY in table */
.fb-split-cell { display: flex; flex-direction: column; gap: 3px; }
.fb-split-row  { display: flex; align-items: center; gap: 5px; font-family: var(--mono); font-size: 11px; }
.fb-split-badge { font-size: 8px; font-weight: 700; letter-spacing: 0.04em; border-radius: 3px; padding: 1px 5px; flex-shrink: 0; }
.fb-split-badge.h1 { background: var(--blue-bg); color: var(--blue); border: 1px solid var(--blue-rule); }
.fb-split-badge.h2 { background: var(--linen-2); color: var(--ink-3); border: 1px solid var(--rule); }
.fb-split-val  { color: var(--ink-2); }
.fb-split-paid { color: var(--green); }
.fb-split-none { color: var(--ink-5); }

/* CARRY-OVER */
.fb-co-banner { display:flex; align-items:flex-start; gap:12px; padding:14px 16px; background:var(--amber-bg); border:1px solid var(--amber-rule); border-radius:8px; margin-bottom:16px; }
.fb-co-banner-icon { font-size:20px; flex-shrink:0; margin-top:1px; }
.fb-co-banner-body { flex:1; min-width:0; }
.fb-co-banner-title { font-size:12px; font-weight:700; color:var(--amber); margin-bottom:4px; }
.fb-co-banner-detail { font-size:11px; color:#92400e; line-height:1.5; }
.fb-co-badge { display:inline-flex; align-items:center; gap:4px; font-size:9px; font-weight:700; letter-spacing:0.05em; border-radius:3px; padding:2px 7px; background:var(--amber-bg); color:var(--amber); border:1px solid var(--amber-rule); white-space:nowrap; }
.fb-co-list { display:flex; flex-direction:column; gap:0; border:1px solid var(--amber-rule); border-radius:7px; overflow:hidden; background:var(--linen); }
.fb-co-row { display:flex; align-items:center; gap:10px; padding:11px 14px; border-bottom:1px solid var(--amber-rule); }
.fb-co-row:last-child { border-bottom:none; }
.fb-co-from { font-size:11px; font-weight:600; color:var(--ink-2); flex:1; }
.fb-co-amount { font-family:var(--mono); font-size:13px; font-weight:600; color:var(--red); min-width:80px; text-align:right; }
.fb-co-source-pick { display:flex; flex-direction:column; gap:6px; }
.fb-co-resolved { text-decoration:line-through; opacity:0.5; }
.fb-co-resolve-btn { font-size:9px; font-weight:700; letter-spacing:0.05em; padding:3px 9px; border-radius:4px; border:1px solid var(--green-rule); background:var(--green-bg); color:var(--green); cursor:pointer; white-space:nowrap; transition:all 0.12s; font-family:var(--sans); }
.fb-co-resolve-btn:hover { background:var(--green); color:#fff; }
.fb-co-resolve-all { display:flex; align-items:center; justify-content:center; gap:5px; font-size:10px; font-weight:700; letter-spacing:0.05em; padding:6px 14px; border-radius:5px; border:1.5px solid var(--green-rule); background:var(--green-bg); color:var(--green); cursor:pointer; transition:all 0.12s; font-family:var(--sans); margin-top:8px; width:100%; }
.fb-co-resolve-all:hover { background:var(--green); color:#fff; }
.fb-co-resolved-row { display:flex; align-items:center; gap:8px; padding:6px 0; font-size:10px; color:var(--ink-3); }
.fb-co-link { color:var(--ink-2); font-weight:600; cursor:pointer; text-decoration:underline; text-decoration-color:var(--ink-5); text-underline-offset:2px; transition:color 0.1s; background:none; border:none; font-size:10px; font-family:var(--sans); padding:0; }
.fb-co-link:hover { color:var(--ink); text-decoration-color:var(--ink-3); }
.fb-co-alloc-row { display:flex; align-items:center; gap:8px; padding:8px 0; border-bottom:1px solid var(--rule); }
.fb-co-alloc-row:last-child { border-bottom:none; }
.fb-co-alloc-rm { font-size:14px; color:var(--ink-5); cursor:pointer; background:none; border:none; padding:0 4px; line-height:1; }
.fb-co-alloc-rm:hover { color:var(--red); }
.fb-co-group-hdr { font-size:10px; font-weight:700; color:#92400e; letter-spacing:0.03em; padding:6px 14px; background:rgba(217,119,6,0.06); border-bottom:1px solid var(--amber-rule); }

/* PAYMENTS MODAL */
.fb-pmt-list { display:flex; flex-direction:column; gap:0; border:1px solid var(--rule); border-radius:7px; overflow:hidden; max-height:280px; overflow-y:auto; }
.fb-pmt-row { display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid var(--rule); background:var(--linen); transition:background 0.1s; }
.fb-pmt-row:last-child { border-bottom:none; }
.fb-pmt-row:hover { background:var(--linen-2); }
.fb-pmt-date { font-family:var(--mono); font-size:10px; color:var(--ink-4); min-width:68px; }
.fb-pmt-amount { font-family:var(--mono); font-size:13px; font-weight:500; color:var(--green); min-width:80px; }
.fb-pmt-source { font-size:10px; font-weight:600; color:var(--ink-3); flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fb-pmt-half-badge { font-size:8px; font-weight:700; padding:1px 5px; border-radius:3px; flex-shrink:0; }
.fb-pmt-note { font-size:10px; color:var(--ink-5); font-style:italic; flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.fb-pmt-del { width:20px; height:20px; border-radius:3px; border:none; background:none; color:var(--ink-5); cursor:pointer; font-size:10px; display:flex; align-items:center; justify-content:center; transition:all 0.12s; flex-shrink:0; }
.fb-pmt-del:hover { color:var(--red); background:var(--red-bg); }
.fb-pmt-empty { padding:20px; text-align:center; color:var(--ink-5); font-size:11px; }
.fb-pmt-add-form { border:1px solid var(--rule); border-radius:7px; padding:14px; display:flex; flex-direction:column; gap:10px; background:var(--linen-2); }
.fb-pmt-add-title { font-size:9px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-4); }
.fb-pmt-total-strip { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:var(--linen-3); border:1px solid var(--rule); border-radius:5px; }
.fb-pmt-total-item { display:flex; flex-direction:column; gap:2px; }
.fb-pmt-total-lbl { font-size:8px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--ink-5); }
.fb-pmt-total-val { font-family:var(--mono); font-size:13px; font-weight:500; }

/* SOURCES PANEL */
.fb-sources-section { border:1px solid var(--rule); border-radius:8px; overflow:hidden; margin-bottom:22px; }
.fb-sources-hdr { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--linen-2); border-bottom:1px solid var(--rule); }
.fb-sources-title { font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--ink-3); }
.fb-source-row { display:flex; align-items:center; gap:12px; padding:11px 16px; border-bottom:1px solid var(--rule); background:var(--linen); }
.fb-source-row:last-child { border-bottom:none; }
.fb-source-icon { font-size:16px; flex-shrink:0; }
.fb-source-name { font-size:12px; font-weight:600; color:var(--ink); }
.fb-source-acct { font-size:10px; color:var(--ink-4); }
.fb-source-half-dot { width:6px; height:6px; border-radius:50%; flex-shrink:0; }
.fb-source-balance { font-family:var(--mono); font-size:13px; font-weight:500; color:var(--green); margin-left:auto; }
.fb-source-del { width:22px; height:22px; border-radius:3px; border:none; background:none; color:var(--ink-5); cursor:pointer; font-size:11px; display:flex; align-items:center; justify-content:center; transition:all 0.12s; }
.fb-source-del:hover { color:var(--red); background:var(--red-bg); }
.fb-source-add-btn { display:flex; align-items:center; gap:7px; padding:10px 16px; cursor:pointer; color:var(--ink-4); font-family:var(--sans); font-size:11px; font-weight:600; border:none; background:none; width:100%; text-align:left; border-top:1px solid var(--rule); transition:color 0.12s; }
.fb-source-add-btn:hover { color:var(--ink); background:var(--linen-2); }

/* TABLE PAY BUTTON */
.fb-pay-btn { display:inline-flex; align-items:center; gap:4px; font-size:9px; font-weight:700; letter-spacing:0.04em; padding:3px 8px; border-radius:4px; border:1px solid var(--rule); background:var(--linen-2); color:var(--ink-4); cursor:pointer; white-space:nowrap; transition:all 0.12s; font-family:var(--sans); }
.fb-pay-btn:hover { border-color:var(--green-rule); color:var(--green); background:var(--green-bg); }
.fb-pay-btn.has-payments { border-color:var(--green-rule); color:var(--green); background:var(--green-bg); }

/* MODAL WIDE */
.fb-modal-wide { width:560px; }

/* TAG PILL */
.fb-tag-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.04em; border-radius: 20px; padding: 2px 8px; white-space: nowrap; border: 1px solid; }
.fb-tag-none { display: inline-flex; align-items: center; gap: 3px; font-size: 9px; font-weight: 600; color: var(--ink-5); background: var(--linen-2); border: 1px dashed var(--linen-4); border-radius: 20px; padding: 2px 8px; cursor: pointer; white-space: nowrap; transition: all 0.12s; }
.fb-tag-none:hover { border-color: var(--ink-4); color: var(--ink-4); }

/* TAG PICKER in modal */
.fb-tag-picker { display: flex; gap: 6px; flex-wrap: wrap; }
.fb-tag-option { display: flex; align-items: center; gap: 5px; padding: 6px 12px; border-radius: 6px; border: 1.5px solid var(--rule); background: var(--linen-2); cursor: pointer; font-size: 11px; font-weight: 600; color: var(--ink-3); transition: all 0.12s; white-space: nowrap; }
.fb-tag-option:hover { border-color: var(--ink-4); color: var(--ink); background: var(--linen); }
.fb-tag-option.selected { color: #fff; border-color: transparent; }
.fb-tag-option-icon { font-size: 13px; }

/* STATUS PILL */
.fb-status-pill { display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 700; letter-spacing: 0.06em; border-radius: 20px; padding: 3px 10px; cursor: pointer; border: none; font-family: var(--sans); transition: all 0.15s; white-space: nowrap; }
.fb-status-pill.paid    { background: var(--green-bg); color: var(--green); border: 1px solid var(--green-rule); }
.fb-status-pill.partial { background: var(--amber-bg); color: var(--amber); border: 1px solid var(--amber-rule); }
.fb-status-pill.unpaid  { background: var(--linen-2);  color: var(--ink-4); border: 1px solid var(--rule); }
.fb-status-pill:hover { opacity: 0.8; }

/* ROW ACTIONS */
.fb-row-actions { display: flex; gap: 5px; justify-content: flex-end; opacity: 0; transition: opacity 0.12s; }
.fb-table tbody tr:hover .fb-row-actions { opacity: 1; }
.fb-icon-btn { width: 24px; height: 24px; border-radius: 4px; border: 1px solid var(--rule); background: var(--linen); color: var(--ink-4); font-size: 11px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.fb-icon-btn:hover     { border-color: var(--ink-4); color: var(--ink); background: var(--linen-2); }
.fb-icon-btn.del:hover { border-color: var(--red-rule); color: var(--red); background: var(--red-bg); }

/* TABLE FOOTER */
.fb-tfoot { margin-top: 6px; border-top: 1.5px solid var(--rule); }
.fb-tfoot-row { display: flex; align-items: center; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--rule); }
.fb-tfoot-row:last-child { border-bottom: none; }
.fb-tfoot-lbl { font-size: 10px; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; color: var(--ink-3); }
.fb-tfoot-val { font-family: var(--mono); font-size: 15px; font-weight: 500; color: var(--ink); }
.fb-tfoot-val.green { color: var(--green); }
.fb-tfoot-val.red   { color: var(--red); }

/* OVERVIEW HALF SPLIT */
.fb-ov-split { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.fb-ov-half-card { border: 1px solid var(--rule); border-radius: 8px; padding: 14px 16px; }
.fb-ov-half-title { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }
.fb-ov-half-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.fb-ov-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid var(--rule); }
.fb-ov-row:last-child { border-bottom: none; }
.fb-ov-lbl { font-size: 11px; color: var(--ink-3); }
.fb-ov-val { font-family: var(--mono); font-size: 12px; color: var(--ink); font-weight: 500; }
.fb-ov-val.green { color: var(--green); }
.fb-ov-val.red   { color: var(--red); }

/* CONFIRM DELETE */
.fb-confirm-box { background: var(--red-bg); border: 1px solid var(--red-rule); border-radius: 6px; padding: 13px 16px; margin: 4px 0 8px; }
.fb-confirm-msg { font-size: 12px; font-weight: 600; color: #991b1b; margin-bottom: 10px; line-height: 1.5; }
.fb-confirm-actions { display: flex; gap: 8px; }

/* MODAL */
.fb-overlay { position: fixed; inset: 0; background: rgba(14,14,11,0.38); display: flex; align-items: center; justify-content: center; z-index: 200; animation: fbFadeIn 0.15s ease; }
@keyframes fbFadeIn { from { opacity: 0; } to { opacity: 1; } }
.fb-modal { background: var(--linen); width: 480px; border-radius: 8px; box-shadow: 0 12px 40px rgba(14,14,11,0.24), 0 0 0 1px rgba(14,14,11,0.08); animation: fbSlideUp 0.22s cubic-bezier(0.22,1,0.36,1); overflow: hidden; }
@keyframes fbSlideUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.fb-modal-hdr { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px 14px; border-bottom: 1px solid var(--rule); }
.fb-modal-title { font-size: 15px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; }
.fb-modal-close { background: none; border: none; cursor: pointer; color: var(--ink-4); font-size: 16px; width: 26px; height: 26px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.12s; }
.fb-modal-close:hover { background: var(--linen-2); color: var(--ink); }
.fb-modal-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 14px; }
.fb-field-grp { display: flex; flex-direction: column; gap: 5px; }
.fb-field-row { display: flex; gap: 12px; }
.fb-field-row > * { flex: 1; }
.fb-field-lbl { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); }
.fb-field { font-family: var(--sans); width: 100%; padding: 10px 12px; background: var(--linen-2); border: 1.5px solid var(--rule); border-radius: 5px; font-size: 13px; color: var(--ink); outline: none; transition: border-color 0.15s; }
.fb-field::placeholder { color: var(--ink-5); }
.fb-field:focus { border-color: var(--ink); background: var(--linen); }
.fb-modal-section { border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
.fb-modal-section-hdr { background: var(--linen-2); padding: 8px 12px; font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); display: flex; align-items: center; gap: 6px; }
.fb-modal-section-hdr-dot { width: 5px; height: 5px; border-radius: 50%; }
.fb-modal-section-body { padding: 12px; display: flex; flex-direction: column; gap: 10px; }
.fb-modal-footer { display: flex; gap: 8px; padding: 14px 22px 18px; border-top: 1px solid var(--rule); }
.fb-modal-footer .fb-btn { flex: 1; }
.fb-split-note { font-size: 10px; color: var(--ink-5); font-style: italic; }
.fb-split-total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: var(--linen-3); border-top: 1px solid var(--rule); font-size: 11px; }
.fb-split-total-lbl { font-weight: 600; color: var(--ink-3); }
.fb-split-total-val { font-family: var(--mono); font-size: 12px; font-weight: 500; color: var(--ink); }
.fb-split-total-val.mismatch { color: var(--amber); }


/* STATISTICS */
.fb-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
.fb-stat-card { background: var(--linen); border: 1px solid var(--rule); border-radius: 10px; padding: 22px 24px; }
.fb-stat-card-title { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 18px; }
.fb-stat-chart-area { display: flex; align-items: center; gap: 24px; }
.fb-stat-legend { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
.fb-stat-leg-row { display: flex; align-items: center; gap: 8px; cursor: pointer; border-radius: 4px; padding: 3px 4px; transition: background 0.1s; }
.fb-stat-leg-row:hover { background: var(--linen-2); }
.fb-stat-leg-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.fb-stat-leg-name { font-size: 11px; font-weight: 600; color: var(--ink-2); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fb-stat-leg-val { font-family: var(--mono); font-size: 10px; color: var(--ink-4); text-align: right; white-space: nowrap; }
.fb-stat-leg-pct { font-family: var(--mono); font-size: 10px; font-weight: 600; color: var(--ink-3); min-width: 32px; text-align: right; }
.fb-stat-center-lbl { text-anchor: middle; dominant-baseline: middle; font-family: 'DM Sans', system-ui, sans-serif; }
.fb-stat-summary-row { display: flex; gap: 10px; margin-bottom: 20px; }
.fb-stat-summary-card { flex: 1; background: var(--linen-2); border: 1px solid var(--rule); border-radius: 7px; padding: 12px 14px; }
.fb-stat-summary-lbl { font-size: 8px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink-4); margin-bottom: 4px; }
.fb-stat-summary-val { font-family: var(--mono); font-size: 16px; font-weight: 500; color: var(--ink); }
.fb-stat-summary-val.green { color: var(--green); }
.fb-stat-summary-val.red { color: var(--red); }
.fb-stat-full { grid-column: span 2; }
.fb-stat-bar-list { display: flex; flex-direction: column; gap: 10px; }
.fb-stat-bar-row { display: flex; align-items: center; gap: 10px; }
.fb-stat-bar-label { font-size: 11px; font-weight: 600; color: var(--ink-2); min-width: 100px; }
.fb-stat-bar-track { flex: 1; height: 8px; background: var(--linen-3); border-radius: 4px; overflow: hidden; }
.fb-stat-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s ease; }
.fb-stat-bar-amt { font-family: var(--mono); font-size: 10px; color: var(--ink-4); min-width: 80px; text-align: right; }

/* TOAST */
.fb-toast { position: fixed; bottom: 28px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--linen); font-family: var(--sans); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; padding: 10px 20px; border-radius: 5px; z-index: 300; white-space: nowrap; animation: fbToastIn 0.2s cubic-bezier(0.22,1,0.36,1); }
@keyframes fbToastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

.fb-empty { padding: 44px 0; text-align: center; color: var(--ink-5); font-size: 12px; font-weight: 600; }
`;

/* ─── CONSTANTS ─── */
const CAT_META = {
  Bills:     { icon:"🧾", color:"#dbeafe" },
  Food:      { icon:"🛒", color:"#dcfce7" },
  Utilities: { icon:"⚡", color:"#fef9c3" },
  Home:      { icon:"🏠", color:"#ffe4e6" },
  Travel:    { icon:"✈️", color:"#e0f2fe" },
  Health:    { icon:"💊", color:"#f3e8ff" },
  Education: { icon:"📚", color:"#fce7f3" },
  Other:     { icon:"📦", color:"#f1f5f9" },
};
const getCatMeta = (cat) => CAT_META[cat] || CAT_META["Other"];
const CATEGORIES  = Object.keys(CAT_META);
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/* Financial tags — based on 50/30/20 rule philosophy */
const TAG_META = {
  needs:      { label:"Needs",      icon:"🏠", color:"#ef4444", bg:"#fef2f2", border:"#fecaca", desc:"Essentials you must pay" },
  wants:      { label:"Wants",      icon:"✨", color:"#f59e0b", bg:"#fffbeb", border:"#fde68a", desc:"Nice-to-haves, lifestyle" },
  savings:    { label:"Savings",    icon:"🏦", color:"#10b981", bg:"#ecfdf5", border:"#a7f3d0", desc:"Emergency fund, goals" },
  investment: { label:"Investment", icon:"📈", color:"#3b82f6", bg:"#eff6ff", border:"#bfdbfe", desc:"Stocks, mutual funds, etc." },
  business:   { label:"Business",   icon:"💼", color:"#8b5cf6", bg:"#f5f3ff", border:"#ddd6fe", desc:"Business-related expenses" },
};
const TAGS = Object.keys(TAG_META);
const getTagMeta = (tag) => tag ? TAG_META[tag] : null;

/*
  ─── DATA MODEL ───────────────────────────────────────────────────
  Each EXPENSE belongs to exactly ONE half (half1 OR half2).
    expense.half = "half1" | "half2"
    expense.amount = budget amount
    expense.sourceId = which source pays for it
    expense.payments = [{ id, date, amount, sourceId, note }]

  Categories can span both halves (Groceries 1st / Groceries 2nd).

  Budget Sources:
    month.sources = [{ id, name, type, accountLabel, half, balance }]
    half: "half1" | "half2" | "both"

  Carry-overs:
    month.carryOvers = [{
      id,           — unique id
      from,         — "half1" | "half2" | "prev_month" (where deficit originated)
      fromLabel,    — human label, e.g. "1st Half May 2026"
      amount,       — deficit amount (positive number)
      sourceId,     — which source in THIS month will cover it
      resolvedAt,   — ISO date string when it was marked resolved (null = pending)
    }]
    Each carry-over is a pre-deduction against its assigned source.
    sourceRemaining() already subtracts payments, so carry-overs are
    accounted separately via carryOversAgainstSource().
  ─────────────────────────────────────────────────────────────────
*/
const mkExp = (id, name, category, half, amount, sourceId=null, tag=null, payments=[]) => ({
  id, name, category, half, amount, sourceId, tag, payments,
});

const SOURCE_TYPES = {
  salary:             { label:"Salary",             icon:"💳", color:"#1d4ed8" },
  debt_collected:     { label:"Debt Collected",      icon:"🤝", color:"#059669" },
  savings_withdrawal: { label:"Savings Withdrawal",  icon:"🏦", color:"#d97706" },
};

const mkSource = (id, name, type, accountLabel, half, balance=0) => ({
  id, name, type, accountLabel, half, balance
});

const blankMonth = (id,label,num,year) => ({
  id, label, num, year,
  half1SalaryDate:"25th", half2SalaryDate:"30th",
  sources:[],
  expenses:[],
  carryOvers:[],
});

const INITIAL_MONTHS = [
  blankMonth(1,"January 2026","01","2026"),
  blankMonth(2,"February 2026","02","2026"),
  blankMonth(3,"March 2026","03","2026"),
  blankMonth(4,"April 2026","04","2026"),
  {
    id:5, label:"May 2026", num:"05", year:"2026",
    half1SalaryDate:"25th", half2SalaryDate:"30th",
    sources:[
      mkSource("s1","Wife Payroll",        "salary",             "BDO Payroll",  "half1", 40000),
      mkSource("s2","Husband Salary",      "salary",             "GCash",        "half1", 24700),
      mkSource("s3","John's debt payment", "debt_collected",     "Cash",         "half2", 5000),
      mkSource("s4","Husband Salary",      "salary",             "BDO Payroll",  "half2", 40000),
      mkSource("s5","Wife Salary",         "salary",             "Maya",         "half2", 24700),
    ],
    carryOvers:[
      { id:"co1", from:"prev_month", fromLabel:"2nd Half Apr 2026", amount:2500, sourceId:"s1", resolvedAt:null },
      { id:"co2", from:"prev_month", fromLabel:"2nd Half Apr 2026", amount:1700, sourceId:"s2", resolvedAt:null },
    ],
    expenses:[
      // half1 expenses (paid from 25th salary)
      mkExp(1,  "Baking Allowance", "Food",      "half1", 5000,   "s1", "wants",   [{id:"p1",date:"2026-05-03",amount:1450,sourceId:"s1",note:"flour, butter run"}]),
      mkExp(2,  "Groceries 1st",    "Food",      "half1", 6000,   "s1", "needs",   [{id:"p2",date:"2026-05-05",amount:3200,sourceId:"s1",note:""},{id:"p3",date:"2026-05-10",amount:2000,sourceId:"s2",note:"top-up"}]),
      mkExp(3,  "Electric Bill",    "Utilities", "half1", 8500,   "s2", "needs",   []),
      mkExp(4,  "Water Bill",       "Utilities", "half1", 1200,   "s1", "needs",   []),
      mkExp(5,  "Internet",         "Utilities", "half1", 1800,   "s2", "needs",   [{id:"p4",date:"2026-05-01",amount:1800,sourceId:"s2",note:"autopay"}]),
      mkExp(6,  "School 1st",       "Education", "half1", 3000,   "s1", "needs",   []),
      // half2 expenses (paid from 30th salary)
      mkExp(7,  "Atimonan",         "Travel",    "half2", 7000,   "s3", "wants",   []),
      mkExp(8,  "CC",               "Bills",     "half2", 5811.6, "s4", "needs",   [{id:"p5",date:"2026-05-18",amount:2000,sourceId:"s4",note:"minimum payment"}]),
      mkExp(9,  "Aircon Cleaning",  "Home",      "half2", 2000,   "s5", "needs",   []),
      mkExp(10, "Groceries 2nd",    "Food",      "half2", 6000,   "s4", "needs",   []),
      mkExp(11, "Medicine",         "Health",    "half2", 3500,   "s5", "needs",   []),
      mkExp(12, "School 2nd",       "Education", "half2", 3000,   "s4", "needs",   []),
    ],
  },
];

/* ─── HELPERS ─── */
const fmt = (n) => "₱" + Number(n).toLocaleString("en-PH", {minimumFractionDigits:0,maximumFractionDigits:2});
const fmtDate = (d) => { if (!d) return ""; const [y,m,day]=d.split("-"); return `${day}/${m}/${y}`; };

// New single-half model — each expense has .half, .amount, .sourceId, .payments
const expTotal  = (e) => Number(e.amount||0);
const expPaid   = (e) => (e.payments||[]).filter(p=>p.sourceId!=="quick").reduce((a,p)=>a+Number(p.amount),0);
const expStatus = (e) => {
  const t = expTotal(e), p = expPaid(e);
  if (p === 0) return "unpaid";
  if (p >= t)  return "paid";
  return "partial";
};
// Filter expenses by half
const halfExpenses = (expenses, hk) => expenses.filter(e => e.half === hk);

// Sources helpers
const sourcesTotal    = (sources, hk) => (sources||[]).filter(s=>s.half===hk||s.half==="both").reduce((a,s)=>a+Number(s.balance),0);
const sourcesTotalAll = (sources)     => (sources||[]).reduce((a,s)=>a+Number(s.balance),0);

// How much has been spent from a source (across all real payments, not quick-pays)
const sourceSpent = (expenses, srcId) =>
  (expenses||[]).reduce((a,e)=>(e.payments||[]).filter(p=>p.sourceId===srcId&&p.sourceId!=="quick").reduce((b,p)=>b+Number(p.amount),a), 0);

// Remaining balance = original balance minus all payments using that source
const sourceRemaining = (source, expenses) => Number(source.balance) - sourceSpent(expenses, source.id);

const carryOversAgainstSource = (carryOvers, sourceId) =>
  (carryOvers||[]).filter(co=>co.sourceId===sourceId&&!co.resolvedAt).reduce((a,co)=>a+Number(co.amount),0);

const sourceEffectiveRemaining = (source, expenses, carryOvers) =>
  sourceRemaining(source, expenses) - carryOversAgainstSource(carryOvers, source.id);

let _pid = 500;
const newPid = () => "p"+(++_pid);
let _sid = 100;
const newSid = () => "s"+(++_sid);
let _coid = 100;
const newCoId = () => "co"+(++_coid);

let _eid=300, _mid=20;
const newEid = ()=>++_eid;
const newMid = ()=>++_mid;
let toastTimer;
function fireToast(msg,setToast){ setToast(msg); clearTimeout(toastTimer); toastTimer=setTimeout(()=>setToast(null),2300); }

/* ─── EXPENSE MODAL ─── */
function ExpenseModal({ expense, defaultCategory, sources, allExpenses, onClose, onSave }) {
  const editing = !!expense;
  const [name,   setName]   = useState(expense?.name       ?? "");
  const [cat,    setCat]    = useState(expense?.category   ?? defaultCategory ?? "Bills");
  const [half,   setHalf]   = useState(expense?.half       ?? "half1");
  const [amount, setAmt]    = useState(expense?.amount     ?? "");
  const [srcId,  setSrcId]  = useState(expense?.sourceId   ?? "");
  const [tag,    setTag]    = useState(expense?.tag        ?? null);

  const amt = parseFloat(amount)||0;

  // Live remaining for a source, excluding this expense's own payments
  const liveRem = (sid) => {
    if (!sid) return null;
    const src = sources.find(s=>s.id===sid);
    if (!src) return null;
    const otherSpent = (allExpenses||[])
      .filter(e=>e.id!==expense?.id)
      .reduce((a,e)=>(e.payments||[]).filter(p=>p.sourceId===sid&&p.sourceId!=="quick").reduce((b,p)=>b+Number(p.amount),a),0);
    const ownSpent = (expense?.payments||[]).filter(p=>p.sourceId===sid&&p.sourceId!=="quick").reduce((a,p)=>a+Number(p.amount),0);
    return Number(src.balance) - otherSpent - ownSpent;
  };

  const eligibleSources = sources.filter(s=>s.half===half||s.half==="both");

  // Auto-select first eligible source when half changes and current srcId not valid
  const validSrc = eligibleSources.find(s=>s.id===srcId);

  const save = () => {
    if (!name.trim() || amt === 0) return;
    onSave({
      id: expense?.id ?? newEid(),
      name: name.trim(), category: cat, half, amount: amt,
      sourceId: validSrc ? srcId : (eligibleSources[0]?.id ?? null),
      tag, payments: expense?.payments ?? [],
    });
  };

  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal fb-modal-wide">
        <div className="fb-modal-hdr">
          <div className="fb-modal-title">{editing?"Edit Expense":"Add Expense"}</div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">

          {/* Name + Category */}
          <div className="fb-field-row">
            <div className="fb-field-grp" style={{flex:2}}>
              <div className="fb-field-lbl">Expense Name</div>
              <input className="fb-field" value={name} onChange={e=>setName(e.target.value)}
                placeholder="e.g. Electric Bill" autoFocus onKeyDown={e=>e.key==="Enter"&&save()} />
            </div>
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Category</div>
              <select className="fb-field" value={cat} onChange={e=>setCat(e.target.value)}>
                {CATEGORIES.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Half selector */}
          <div className="fb-field-grp">
            <div className="fb-field-lbl">Salary Half</div>
            <div style={{display:"flex",gap:8}}>
              {[
                {k:"half1",label:"1st Half",sub:"1–15 · salary 25th",dot:"#1d4ed8"},
                {k:"half2",label:"2nd Half",sub:"16–end · salary 30th",dot:"var(--ink-3)"},
              ].map(h=>(
                <div key={h.k} onClick={()=>{setHalf(h.k);setSrcId("");}}
                  style={{
                    flex:1,display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                    borderRadius:7,cursor:"pointer",transition:"all 0.15s",
                    border:`1.5px solid ${half===h.k?"var(--ink)":"var(--rule)"}`,
                    background:half===h.k?"var(--ink)":"var(--linen-2)",
                  }}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:half===h.k?h.dot:"var(--ink-5)",flexShrink:0}} />
                  <div>
                    <div style={{fontSize:12,fontWeight:700,color:half===h.k?"var(--linen)":"var(--ink)",lineHeight:1.2}}>{h.label}</div>
                    <div style={{fontSize:9,fontFamily:"var(--mono)",color:half===h.k?"rgba(250,250,247,0.5)":"var(--ink-5)"}}>{h.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="fb-field-row">
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Budgeted Amount (₱)</div>
              <input className="fb-field" type="number" value={amount}
                onChange={e=>setAmt(e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Source */}
          <div className="fb-field-grp">
            <div className="fb-field-lbl">
              Budget Source
              {validSrc && liveRem(srcId)!==null && (
                <span style={{marginLeft:6,fontWeight:400,textTransform:"none",letterSpacing:0,
                  color:liveRem(srcId)<0?"var(--red)":"var(--green)"}}>
                  · {fmt(liveRem(srcId))} available
                </span>
              )}
            </div>
            {sources.length===0 ? (
              <div style={{padding:"10px 12px",background:"var(--amber-bg)",border:"1px solid var(--amber-rule)",borderRadius:5,fontSize:11,color:"var(--amber)",fontWeight:600}}>
                ⚠️ No sources yet — add them in Overview first
              </div>
            ) : eligibleSources.length===0 ? (
              <div style={{padding:"10px 12px",background:"var(--linen-2)",border:"1px solid var(--rule)",borderRadius:5,fontSize:11,color:"var(--ink-4)"}}>
                No sources for {half==="half1"?"1st":"2nd"} half — add a source with "Both" or "{half==="half1"?"1st":"2nd"} Half" scope
              </div>
            ) : (
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {eligibleSources.map(s=>{
                  const r   = liveRem(s.id);
                  const ov  = r!==null && r<0;
                  const sel = srcId===s.id;
                  return (
                    <div key={s.id} onClick={()=>setSrcId(s.id)}
                      style={{
                        display:"flex",alignItems:"center",gap:8,padding:"8px 12px",
                        borderRadius:7,cursor:"pointer",transition:"all 0.12s",
                        border:`1.5px solid ${sel?"var(--ink)":"var(--rule)"}`,
                        background:sel?"var(--ink)":"var(--linen-2)",
                      }}>
                      <span style={{fontSize:14}}>{SOURCE_TYPES[s.type]?.icon||"💳"}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:700,color:sel?"var(--linen)":"var(--ink-2)",lineHeight:1.2}}>{s.name}</div>
                        <div style={{fontSize:9,color:sel?"rgba(250,250,247,0.5)":"var(--ink-5)"}}>{s.accountLabel}</div>
                      </div>
                      <div style={{marginLeft:4,textAlign:"right"}}>
                        <div style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:600,
                          color:ov?"var(--red)":sel?"#6ee7b7":"var(--green)"}}>
                          {r!==null?fmt(r):"—"}
                        </div>
                        <div style={{fontSize:8,color:sel?"rgba(250,250,247,0.4)":"var(--ink-5)"}}>left</div>
                      </div>
                      {ov && <span style={{fontSize:11}} title="Overspent">⚠️</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Financial Tag */}
          <div className="fb-field-grp">
            <div className="fb-field-lbl">Financial Tag <span style={{fontWeight:400,textTransform:"none",letterSpacing:0,color:"var(--ink-5)"}}>· optional</span></div>
            <div className="fb-tag-picker">
              <button className={`fb-tag-option${tag===null?" selected":""}`}
                style={tag===null?{background:"var(--ink-2)",borderColor:"var(--ink-2)"}:{}}
                onClick={()=>setTag(null)}>
                <span className="fb-tag-option-icon">—</span> None
              </button>
              {TAGS.map(t=>{
                const m=TAG_META[t];
                return (
                  <button key={t} className={`fb-tag-option${tag===t?" selected":""}`}
                    style={tag===t?{background:m.color,borderColor:m.color}:{}}
                    onClick={()=>setTag(t)}>
                    <span className="fb-tag-option-icon">{m.icon}</span> {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Total row */}
          <div className="fb-split-total-row">
            <span className="fb-split-total-lbl">Budget</span>
            <span className={`fb-split-total-val ${amt===0?"mismatch":""}`}>{fmt(amt)}</span>
            <span style={{fontSize:10,color:"var(--ink-5)",marginLeft:8}}>· log actual payments via the 💳 button in the table</span>
          </div>
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Cancel</button>
          <button className="fb-btn fb-btn-ink" onClick={save} style={{opacity:amt===0?0.4:1}}>
            {editing?"Save Changes":"Add Expense"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD MONTH MODAL ─── */
function AddMonthModal({ onClose, onSave }) {
  const [mo,setMo]=useState("June"); const [yr,setYr]=useState("2026");
  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal" style={{width:380}}>
        <div className="fb-modal-hdr">
          <div className="fb-modal-title">Add Month</div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">
          <div className="fb-field-row">
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Month</div>
              <select className="fb-field" value={mo} onChange={e=>setMo(e.target.value)}>
                {MONTH_NAMES.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Year</div>
              <input className="fb-field" type="number" value={yr} onChange={e=>setYr(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Cancel</button>
          <button className="fb-btn fb-btn-ink" onClick={()=>onSave(mo,yr)}>Add Month</button>
        </div>
      </div>
    </div>
  );
}

/* ─── PAYMENTS MODAL ─── */
function PaymentsModal({ expense, sources, allExpenses, onClose, onSave }) {
  // Local payments state — starts from saved. We compute source deductions live.
  const [payments, setPayments] = useState(expense.payments || []);
  const [date,   setDate]   = useState(new Date().toISOString().slice(0,10));
  const [amount, setAmount] = useState("");
  const [srcId,  setSrcId]  = useState(sources[0]?.id ?? "");
  const [half, setHalf] = useState(expense.half ?? "half1");
  const [note, setNote] = useState("");

  const total      = expTotal(expense);
  const paidNow    = payments.filter(p=>p.sourceId!=="quick").reduce((a,p)=>a+Number(p.amount),0);
  const remaining  = Math.max(0, total - paidNow);

  // Compute live source balances: start from original balance, deduct OTHER expenses' payments,
  // then deduct current local payment list for this expense
  const liveSourceBalance = (src) => {
    const otherSpent = (allExpenses||[])
      .filter(e=>e.id!==expense.id)
      .reduce((a,e)=>(e.payments||[]).filter(p=>p.sourceId===src.id&&p.sourceId!=="quick").reduce((b,p)=>b+Number(p.amount),a),0);
    const localSpent = payments.filter(p=>p.sourceId===src.id&&p.sourceId!=="quick").reduce((a,p)=>a+Number(p.amount),0);
    return Number(src.balance) - otherSpent - localSpent;
  };

  const addPayment = () => {
    const amt = parseFloat(amount);
    if (!amt || amt<=0) return;
    if (!srcId) { return; }
    const src = sources.find(s=>s.id===srcId);
    const avail = src ? liveSourceBalance(src) : 0;
    if (src && avail < amt) {
      // warn but allow — user may want to flag overdraft
    }
    setPayments(prev=>[...prev,{id:newPid(),date,amount:amt,sourceId:srcId,half,note}]);
    setAmount(""); setNote("");
  };

  const delPayment = (id) => setPayments(prev=>prev.filter(p=>p.id!==id));

  const srcById  = (id) => sources.find(s=>s.id===id);
  const srcName  = (id) => srcById(id)?.name ?? (id==="quick"?"Quick pay":"Unknown");
  const srcAcct  = (id) => srcById(id)?.accountLabel ?? "";

  // single-half model — expense.half is 'half1' or 'half2'

  const selectedSrc = sources.find(s=>s.id===srcId);
  const selectedBalance = selectedSrc ? liveSourceBalance(selectedSrc) : null;

  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal fb-modal-wide">
        <div className="fb-modal-hdr">
          <div>
            <div className="fb-modal-title">💳 Payments — {expense.name}</div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-4)",marginTop:2}}>
              Budget: {fmt(total)} · Paid: {fmt(paidNow)} · Remaining: {fmt(remaining)}
            </div>
          </div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">

          {/* expense progress strip */}
          <div className="fb-pmt-total-strip">
            <div className="fb-pmt-total-item">
              <span className="fb-pmt-total-lbl">Total Budget</span>
              <span className="fb-pmt-total-val">{fmt(total)}</span>
            </div>
            <div className="fb-pmt-total-item" style={{textAlign:"center"}}>
              <span className="fb-pmt-total-lbl">Paid</span>
              <span className="fb-pmt-total-val" style={{color:"var(--green)"}}>{fmt(paidNow)}</span>
            </div>
            <div className="fb-pmt-total-item" style={{textAlign:"right"}}>
              <span className="fb-pmt-total-lbl">Remaining</span>
              <span className="fb-pmt-total-val" style={{color:remaining>0?"var(--amber)":"var(--green)"}}>{fmt(remaining)}</span>
            </div>
          </div>
          <div className="fb-prog-wrap" style={{height:5,marginTop:2}}>
            <div className="fb-prog-bar" style={{width:Math.min(100,total>0?(paidNow/total)*100:0)+"%",background:"var(--green)"}} />
          </div>

          {/* source balances strip */}
          {sources.length>0 && (
            <div style={{display:"flex",gap:6,flexWrap:"wrap",paddingTop:2}}>
              {sources.filter(s=>s.balance>0||sourceSpent(allExpenses||[],s.id)>0).map(s=>{
                const rem = liveSourceBalance(s);
                const over = rem<0;
                return (
                  <div key={s.id}
                    onClick={()=>setSrcId(s.id)}
                    style={{
                      display:"flex",alignItems:"center",gap:6,padding:"5px 10px",
                      borderRadius:6,border:`1.5px solid ${srcId===s.id?"var(--ink)":"var(--rule)"}`,
                      background:srcId===s.id?"var(--ink)":"var(--linen-2)",
                      cursor:"pointer",transition:"all 0.12s",
                    }}>
                    <span style={{fontSize:12}}>{SOURCE_TYPES[s.type]?.icon||"💳"}</span>
                    <div>
                      <div style={{fontSize:10,fontWeight:700,color:srcId===s.id?"var(--linen)":"var(--ink-2)",lineHeight:1.2}}>{s.name}</div>
                      <div style={{fontSize:9,color:srcId===s.id?"rgba(250,250,247,0.5)":"var(--ink-5)"}}>{s.accountLabel}</div>
                    </div>
                    <div style={{marginLeft:4,textAlign:"right"}}>
                      <div style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:600,color:over?"var(--red)":srcId===s.id?"#6ee7b7":"var(--green)"}}>{fmt(rem)}</div>
                      <div style={{fontSize:8,color:srcId===s.id?"rgba(250,250,247,0.4)":"var(--ink-5)"}}>remaining</div>
                    </div>
                    {over && <span style={{fontSize:10}}>⚠️</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* payment list */}
          {payments.filter(p=>p.sourceId!=="quick").length===0
            ? <div className="fb-pmt-empty">No payments recorded yet</div>
            : <div className="fb-pmt-list">
                {payments.filter(p=>p.sourceId!=="quick").map(p=>{
                  const s=srcById(p.sourceId);
                  return (
                    <div key={p.id} className="fb-pmt-row">
                      <span className="fb-pmt-date">{fmtDate(p.date)}</span>
                      <span className="fb-pmt-amount">{fmt(p.amount)}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="fb-pmt-source">
                          {s?<span>{SOURCE_TYPES[s.type]?.icon} </span>:null}
                          {srcName(p.sourceId)}
                          <span style={{color:"var(--ink-5)"}}> · {srcAcct(p.sourceId)}</span>
                        </div>
                        {p.note&&<div className="fb-pmt-note">{p.note}</div>}
                      </div>
                      <span className={`fb-pmt-half-badge`}
                        style={p.half==="half1"?{background:"var(--blue-bg)",color:"var(--blue)",border:"1px solid var(--blue-rule)"}:{background:"var(--linen-2)",color:"var(--ink-3)",border:"1px solid var(--rule)"}}>
                        {p.half==="half1"?"1st":"2nd"}
                      </span>
                      <button className="fb-pmt-del" onClick={()=>delPayment(p.id)}>✕</button>
                    </div>
                  );
                })}
              </div>
          }

          {/* add payment form */}
          <div className="fb-pmt-add-form">
            <div className="fb-pmt-add-title">Log Payment</div>
            <div className="fb-field-row">
              <div className="fb-field-grp">
                <div className="fb-field-lbl">Date</div>
                <input className="fb-field" type="date" value={date} onChange={e=>setDate(e.target.value)} />
              </div>
              <div className="fb-field-grp">
                <div className="fb-field-lbl">Amount (₱)</div>
                <input className="fb-field" type="number" value={amount}
                  onChange={e=>setAmount(e.target.value)}
                  placeholder={remaining>0?String(remaining):"0.00"}
                  onKeyDown={e=>e.key==="Enter"&&addPayment()} />
              </div>
            </div>
            <div className="fb-field-row">
              <div className="fb-field-grp">
                <div className="fb-field-lbl">
                  Source
                  {selectedSrc && <span style={{marginLeft:6,fontWeight:400,textTransform:"none",letterSpacing:0,color:selectedBalance<0?"var(--red)":"var(--green)"}}>
                    · {fmt(selectedBalance??0)} available
                  </span>}
                </div>
                <select className="fb-field" value={srcId} onChange={e=>setSrcId(e.target.value)}>
                  {sources.length===0&&<option value="">— add sources first in Overview —</option>}
                  {sources.map(s=>{
                    const rem=liveSourceBalance(s);
                    return <option key={s.id} value={s.id}>{SOURCE_TYPES[s.type]?.icon} {s.name} · {s.accountLabel} ({fmt(rem)} left)</option>;
                  })}
                </select>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"8px 12px",background:"var(--linen-2)",border:"1px solid var(--rule)",borderRadius:5,flexShrink:0}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:expense.half==="half1"?"#1d4ed8":"var(--ink-3)",flexShrink:0}} />
                <span style={{fontSize:10,fontWeight:700,color:"var(--ink-3)",letterSpacing:"0.04em",textTransform:"uppercase"}}>
                  {expense.half==="half1"?"1st Half · 25th":"2nd Half · 30th"}
                </span>
              </div>
            </div>
            {selectedSrc && selectedBalance!==null && selectedBalance < (parseFloat(amount)||0) && (
              <div style={{background:"var(--amber-bg)",border:"1px solid var(--amber-rule)",borderRadius:5,padding:"8px 12px",fontSize:10,color:"var(--amber)",fontWeight:600}}>
                ⚠️ This payment ({fmt(parseFloat(amount)||0)}) exceeds the available balance on {selectedSrc.name} ({fmt(selectedBalance)}). It will be saved but flagged.
              </div>
            )}
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Note <span style={{fontWeight:400,textTransform:"none",letterSpacing:0}}>· optional</span></div>
              <input className="fb-field" value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. minimum payment, installment 1/3…" />
            </div>
            <button className="fb-btn fb-btn-ink" onClick={addPayment} style={{alignSelf:"flex-start",padding:"8px 18px"}}>+ Log Payment</button>
          </div>
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Cancel</button>
          <button className="fb-btn fb-btn-ink" onClick={()=>onSave(payments)}>Save &amp; Update Sources</button>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD SOURCE MODAL ─── */
function AddSourceModal({ onClose, onSave }) {
  const [name,  setName]  = useState("");
  const [type,  setType]  = useState("salary");
  const [acct,  setAcct]  = useState("");
  const [half,  setHalf]  = useState("half1");
  const [bal,   setBal]   = useState("");
  const save = () => {
    if (!name.trim()) return;
    onSave({ id:newSid(), name:name.trim(), type, accountLabel:acct.trim()||type, half, balance:parseFloat(bal)||0 });
  };
  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal" style={{width:420}}>
        <div className="fb-modal-hdr">
          <div className="fb-modal-title">Add Budget Source</div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">
          <div className="fb-field-row">
            <div className="fb-field-grp" style={{flex:2}}>
              <div className="fb-field-lbl">Source Name</div>
              <input className="fb-field" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Wife Payroll" autoFocus onKeyDown={e=>e.key==="Enter"&&save()} />
            </div>
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Type</div>
              <select className="fb-field" value={type} onChange={e=>setType(e.target.value)}>
                {Object.entries(SOURCE_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="fb-field-row">
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Account / Medium</div>
              <input className="fb-field" value={acct} onChange={e=>setAcct(e.target.value)} placeholder="e.g. BDO, GCash, Cash, Maya…" />
            </div>
            <div className="fb-field-grp">
              <div className="fb-field-lbl">Applies to Half</div>
              <select className="fb-field" value={half} onChange={e=>setHalf(e.target.value)}>
                <option value="half1">1st Half (25th)</option>
                <option value="half2">2nd Half (30th)</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>
          <div className="fb-field-grp">
            <div className="fb-field-lbl">Balance / Amount (₱)</div>
            <input className="fb-field" type="number" value={bal} onChange={e=>setBal(e.target.value)} placeholder="0.00" />
          </div>
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Cancel</button>
          <button className="fb-btn fb-btn-ink" onClick={save}>Add Source</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SOURCE DETAIL MODAL ─── */
function SourceDetailModal({ source, expenses, allSources, onClose }) {
  const spent    = sourceSpent(expenses, source.id);
  const rem      = Number(source.balance) - spent;
  const over     = rem < 0;
  const pct      = source.balance>0 ? Math.min(100,(spent/Number(source.balance))*100) : 0;
  const tm       = SOURCE_TYPES[source.type] || SOURCE_TYPES.salary;
  const halfLabel= { half1:"1st Half (25th)", half2:"2nd Half (30th)", both:"Both Halves" };

  // All payments that used this source
  const allPayments = expenses.flatMap(e=>
    (e.payments||[]).filter(p=>p.sourceId===source.id&&p.sourceId!=="quick")
      .map(p=>({...p, expName:e.name, expCat:e.category, expTag:e.tag}))
  ).sort((a,b)=>b.date.localeCompare(a.date));

  // Breakdown by category
  const catBreakdown = {};
  allPayments.forEach(p=>{
    if (!catBreakdown[p.expCat]) catBreakdown[p.expCat]={total:0,count:0};
    catBreakdown[p.expCat].total += Number(p.amount);
    catBreakdown[p.expCat].count++;
  });

  // Breakdown by tag
  const tagBreakdown = {};
  allPayments.forEach(p=>{
    const k = p.expTag||"untagged";
    if (!tagBreakdown[k]) tagBreakdown[k]={total:0};
    tagBreakdown[k].total += Number(p.amount);
  });

  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal fb-modal-wide">
        <div className="fb-modal-hdr">
          <div>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <span style={{fontSize:18}}>{tm.icon}</span>
              <div className="fb-modal-title">{source.name}</div>
            </div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-4)"}}>
              {tm.label} · {source.accountLabel} · {halfLabel[source.half]}
            </div>
          </div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">

          {/* Balance strip */}
          <div className="fb-pmt-total-strip">
            <div className="fb-pmt-total-item">
              <span className="fb-pmt-total-lbl">Total Balance</span>
              <span className="fb-pmt-total-val">{fmt(source.balance)}</span>
            </div>
            <div className="fb-pmt-total-item" style={{textAlign:"center"}}>
              <span className="fb-pmt-total-lbl">Spent</span>
              <span className="fb-pmt-total-val" style={{color:"var(--red)"}}>{fmt(spent)}</span>
            </div>
            <div className="fb-pmt-total-item" style={{textAlign:"right"}}>
              <span className="fb-pmt-total-lbl">Remaining</span>
              <span className="fb-pmt-total-val" style={{color:over?"var(--red)":"var(--green)"}}>{fmt(rem)}</span>
            </div>
          </div>
          <div className="fb-prog-wrap" style={{height:5,marginTop:2}}>
            <div className="fb-prog-bar" style={{width:pct+"%",background:over?"var(--red)":"var(--green)"}} />
          </div>

          {/* Category breakdown */}
          {Object.keys(catBreakdown).length>0 && (
            <div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:8}}>Spent by Category</div>
              {Object.entries(catBreakdown).sort((a,b)=>b[1].total-a[1].total).map(([cat,v])=>{
                const meta=getCatMeta(cat);
                const cpct=spent>0?Math.min(100,(v.total/spent)*100):0;
                return (
                  <div key={cat} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                    <span style={{fontSize:13}}>{meta.icon}</span>
                    <span style={{fontSize:11,fontWeight:600,color:"var(--ink-2)",minWidth:90}}>{cat}</span>
                    <div style={{flex:1,height:6,background:"var(--linen-3)",borderRadius:3,overflow:"hidden"}}>
                      <div style={{height:"100%",borderRadius:3,width:cpct+"%",background:meta.color,filter:"saturate(2)"}} />
                    </div>
                    <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-3)",minWidth:70,textAlign:"right"}}>{fmt(v.total)}</span>
                    <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)",minWidth:28,textAlign:"right"}}>{Math.round(cpct)}%</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tag breakdown */}
          {Object.keys(tagBreakdown).length>0 && (
            <div>
              <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:8}}>Spent by Tag</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {Object.entries(tagBreakdown).map(([k,v])=>{
                  const m = k==="untagged"?{label:"Untagged",icon:"—",color:"#64748b",bg:"#f1f5f9",border:"#cbd5e1"}:{...TAG_META[k]};
                  return (
                    <div key={k} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:`1px solid ${m.border||m.color}`,background:m.bg||"var(--linen-2)"}}>
                      <span style={{fontSize:11}}>{m.icon}</span>
                      <span style={{fontSize:10,fontWeight:600,color:m.color}}>{m.label}</span>
                      <span style={{fontFamily:"var(--mono)",fontSize:10,color:m.color,opacity:0.8}}>{fmt(v.total)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment ledger */}
          <div>
            <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:8}}>
              Payment History ({allPayments.length})
            </div>
            {allPayments.length===0
              ? <div className="fb-pmt-empty">No payments logged from this source yet</div>
              : <div className="fb-pmt-list">
                  {allPayments.map(p=>(
                    <div key={p.id} className="fb-pmt-row">
                      <span className="fb-pmt-date">{fmtDate(p.date)}</span>
                      <span className="fb-pmt-amount">{fmt(p.amount)}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div className="fb-pmt-source">{p.expName}
                          <span style={{color:"var(--ink-5)"}}> · {p.expCat}</span>
                        </div>
                        {p.note&&<div className="fb-pmt-note">{p.note}</div>}
                      </div>
                      {p.expTag&&TAG_META[p.expTag]&&(
                        <span style={{fontSize:9,fontWeight:600,padding:"1px 6px",borderRadius:3,
                          color:TAG_META[p.expTag].color,background:TAG_META[p.expTag].bg,
                          border:`1px solid ${TAG_META[p.expTag].border}`}}>
                          {TAG_META[p.expTag].icon} {TAG_META[p.expTag].label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
        <div className="fb-modal-footer" style={{justifyContent:"flex-end"}}>
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

/* ─── SOURCES PANEL (inside overview) ─── */
function SourcesPanel({ sources, expenses, carryOvers, onAddSource, onDeleteSource }) {
  const [collapsed,  setCollapsed]  = useState(true);
  const [detailSrc,  setDetailSrc]  = useState(null);

  const grandTotal  = sourcesTotalAll(sources);
  const totalSpent  = sources.reduce((a,s)=>a+sourceSpent(expenses,s.id),0);
  const totalCoOblig= sources.reduce((a,s)=>a+carryOversAgainstSource(carryOvers||[],s.id),0);
  const totalRem    = grandTotal - totalSpent - totalCoOblig;
  const halfLabel  = { half1:"1st (25th)", half2:"2nd (30th)", both:"Both" };
  const halfDotColor = { half1:"#1d4ed8", half2:"var(--ink-3)", both:"#7c3aed" };

  return (
    <>
      {detailSrc && (
        <SourceDetailModal
          source={detailSrc}
          expenses={expenses}
          allSources={sources}
          onClose={()=>setDetailSrc(null)}
        />
      )}
      <div className="fb-sources-section">
        {/* Header — always visible, clicking toggles collapse */}
        <div className="fb-sources-hdr" style={{cursor:"pointer"}} onClick={()=>setCollapsed(c=>!c)}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{fontSize:12,color:"var(--ink-5)",transition:"transform 0.2s",transform:collapsed?"rotate(0deg)":"rotate(90deg)"}}>›</div>
            <div className="fb-sources-title">Budget Sources</div>
            <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)",marginLeft:4}}>
              {sources.length} source{sources.length!==1?"s":""}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-4)"}}>
              {fmt(totalRem)} remaining of {fmt(grandTotal)}
            </span>
            <div style={{width:80,height:3,background:"var(--linen-3)",borderRadius:2,overflow:"hidden"}}>
              <div style={{height:"100%",borderRadius:2,background:"var(--green)",width:(grandTotal>0?Math.min(100,((grandTotal-totalSpent)/grandTotal)*100):0)+"%"}} />
            </div>
          </div>
        </div>

        {/* Collapsible body */}
        {!collapsed && (
          <>
            {sources.length===0 && (
              <div className="fb-pmt-empty" style={{padding:"16px"}}>
                No sources yet — add salary, debt collected, or savings withdrawal
              </div>
            )}
            {sources.map(s=>{
              const tm    = SOURCE_TYPES[s.type] || SOURCE_TYPES.salary;
              const spent = sourceSpent(expenses, s.id);
              const coObl = carryOversAgainstSource(carryOvers||[], s.id);
              const rem   = Number(s.balance) - spent - coObl;
              const over  = rem < 0;
              const usedTotal = spent + coObl;
              const pct   = s.balance>0 ? Math.min(100,(usedTotal/Number(s.balance))*100) : 0;
              return (
                <div key={s.id} className="fb-source-row" style={{cursor:"pointer"}}
                  onClick={()=>setDetailSrc(s)}>
                  <span className="fb-source-icon">{tm.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div className="fb-source-name">{s.name}</div>
                    <div className="fb-source-acct">{tm.label} · {s.accountLabel}</div>
                    <div style={{marginTop:5,display:"flex",alignItems:"center",gap:6}}>
                      <div style={{flex:1,height:3,background:"var(--linen-3)",borderRadius:2,overflow:"hidden",maxWidth:160}}>
                        <div style={{height:"100%",borderRadius:2,width:pct+"%",background:over?"var(--red)":"var(--green)",transition:"width 0.3s"}} />
                      </div>
                      <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)"}}>{fmt(spent)} spent{coObl>0?` + ${fmt(coObl)} carry-over`:""}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:5,marginLeft:8}}>
                    <div className="fb-source-half-dot" style={{background:halfDotColor[s.half]||"var(--ink-5)"}} />
                    <span style={{fontSize:9,color:"var(--ink-5)",fontWeight:600}}>{halfLabel[s.half]}</span>
                  </div>
                  <div style={{textAlign:"right",marginLeft:12}}>
                    <div className="fb-source-balance" style={{color:over?"var(--red)":"var(--green)"}}>{fmt(rem)}</div>
                    <div style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)"}}>of {fmt(s.balance)}</div>
                  </div>
                  {over && <span style={{fontSize:12,marginLeft:4}} title="Overspent">⚠️</span>}
                  <button className="fb-source-del" onClick={ev=>{ev.stopPropagation();onDeleteSource(s.id);}}>✕</button>
                </div>
              );
            })}
            <button className="fb-source-add-btn" onClick={e=>{e.stopPropagation();onAddSource();}}>
              <span style={{fontSize:14,fontWeight:700}}>+</span> Add Source
            </button>
          </>
        )}
        {collapsed && sources.length>0 && (
          <div style={{display:"flex",gap:6,flexWrap:"wrap",padding:"10px 16px",borderTop:"1px solid var(--rule)"}}>
            {sources.map(s=>{
              const tm=SOURCE_TYPES[s.type]||SOURCE_TYPES.salary;
              const rem=Number(s.balance)-sourceSpent(expenses,s.id);
              const over=rem<0;
              return (
                <div key={s.id} onClick={()=>{setCollapsed(false);setDetailSrc(s);}}
                  style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:5,
                    border:"1px solid var(--rule)",background:"var(--linen-2)",cursor:"pointer",
                    transition:"all 0.12s"}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="var(--ink-4)"}
                  onMouseLeave={e=>e.currentTarget.style.borderColor="var(--rule)"}>
                  <span style={{fontSize:12}}>{tm.icon}</span>
                  <span style={{fontSize:10,fontWeight:600,color:"var(--ink-2)"}}>{s.name}</span>
                  <span style={{fontFamily:"var(--mono)",fontSize:10,color:over?"var(--red)":"var(--green)",marginLeft:2}}>{fmt(rem)}</span>
                </div>
              );
            })}
            <button onClick={e=>{e.stopPropagation();setCollapsed(false);onAddSource();}}
              style={{display:"flex",alignItems:"center",gap:4,padding:"4px 10px",borderRadius:5,
                border:"1.5px dashed var(--ink-5)",background:"none",cursor:"pointer",
                fontSize:10,fontWeight:600,color:"var(--ink-5)"}}>
              + Add
            </button>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── CARRY-OVER MODAL — assign one or more sources to cover the deficit ─── */
function CarryOverModal({ deficitAmount, fromLabel, sources, carryOvers, allExpenses, existingAllocations, onClose, onSave }) {
  const initAllocs = (existingAllocations && existingAllocations.length > 0)
    ? existingAllocations.map(a=>({srcId:a.sourceId,amount:String(a.amount)}))
    : [{srcId:sources[0]?.id??"", amount:String(deficitAmount)}];
  const [allocs, setAllocs] = useState(initAllocs);

  const effectiveRem = (s) =>
    sourceEffectiveRemaining(s, allExpenses, carryOvers);

  const allocTotal = allocs.reduce((a,r)=>a+(Number(r.amount)||0),0);
  const unallocated = deficitAmount - allocTotal;
  const canSave = allocs.length>0 && allocs.every(r=>r.srcId&&Number(r.amount)>0) && Math.abs(unallocated)<0.01;

  const updateAlloc = (i,field,val) => setAllocs(prev=>prev.map((r,j)=>j===i?{...r,[field]:val}:r));
  const removeAlloc = (i) => setAllocs(prev=>prev.filter((_,j)=>j!==i));
  const addAlloc = () => {
    const usedIds = new Set(allocs.map(r=>r.srcId));
    const nextSrc = sources.find(s=>!usedIds.has(s.id));
    setAllocs(prev=>[...prev,{srcId:nextSrc?.id??"",amount:unallocated>0?String(Math.round(unallocated*100)/100):"0"}]);
  };

  return (
    <div className="fb-overlay" onMouseDown={e=>e.target===e.currentTarget&&onClose()}>
      <div className="fb-modal" style={{width:520}}>
        <div className="fb-modal-hdr">
          <div>
            <div className="fb-modal-title">⚡ Assign Carry-Over Sources</div>
            <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-4)",marginTop:2}}>
              Deficit from {fromLabel}: {fmt(deficitAmount)}
            </div>
          </div>
          <button className="fb-modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="fb-modal-body">
          <div style={{padding:"10px 14px",background:"var(--amber-bg)",border:"1px solid var(--amber-rule)",borderRadius:6,fontSize:11,color:"#92400e",lineHeight:1.5,marginBottom:14}}>
            Split the <strong>{fmt(deficitAmount)}</strong> deficit from <strong>{fromLabel}</strong> across one or more sources. Each allocation will be pre-deducted from the assigned source.
          </div>

          {allocs.map((alloc,i)=>{
            const src = sources.find(s=>s.id===alloc.srcId);
            const rem = src ? effectiveRem(src) : null;
            const tm = src ? (SOURCE_TYPES[src.type]||SOURCE_TYPES.salary) : null;
            return (
              <div key={i} className="fb-co-alloc-row">
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:6}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <select value={alloc.srcId} onChange={e=>updateAlloc(i,"srcId",e.target.value)}
                      style={{flex:1,padding:"6px 8px",borderRadius:5,border:"1px solid var(--rule)",fontSize:11,fontFamily:"var(--sans)",background:"var(--linen)"}}>
                      <option value="">Select source...</option>
                      {sources.map(s=>{
                        const st=SOURCE_TYPES[s.type]||SOURCE_TYPES.salary;
                        return <option key={s.id} value={s.id}>{st.icon} {s.name} · {s.accountLabel}</option>;
                      })}
                    </select>
                    <input type="number" value={alloc.amount} onChange={e=>updateAlloc(i,"amount",e.target.value)}
                      min="0" step="0.01" placeholder="Amount"
                      style={{width:100,padding:"6px 8px",borderRadius:5,border:"1px solid var(--rule)",fontSize:11,fontFamily:"var(--mono)",textAlign:"right",background:"var(--linen)"}} />
                    {allocs.length>1 && (
                      <button className="fb-co-alloc-rm" onClick={()=>removeAlloc(i)} title="Remove">✕</button>
                    )}
                  </div>
                  {src && rem!==null && (
                    <div style={{fontSize:9,color:"var(--ink-5)",paddingLeft:2}}>
                      {tm.icon} {fmt(rem)} available → <span style={{color:(rem-Number(alloc.amount))<0?"var(--red)":"var(--green)",fontFamily:"var(--mono)"}}>{fmt(rem-Number(alloc.amount))}</span> after
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:8}}>
            <button onClick={addAlloc} disabled={sources.length<=allocs.length}
              style={{fontSize:10,fontWeight:600,color:"var(--ink-4)",background:"none",border:"1px dashed var(--rule)",borderRadius:4,padding:"4px 10px",cursor:sources.length<=allocs.length?"default":"pointer",opacity:sources.length<=allocs.length?0.4:1}}>
              + Add Source
            </button>
            <div style={{fontFamily:"var(--mono)",fontSize:10,fontWeight:600,color:Math.abs(unallocated)<0.01?"var(--green)":unallocated>0?"var(--amber)":"var(--red)"}}>
              {Math.abs(unallocated)<0.01 ? "✓ Fully allocated" : unallocated>0 ? `${fmt(unallocated)} unallocated` : `${fmt(Math.abs(unallocated))} over-allocated`}
            </div>
          </div>

          {sources.length===0 && (
            <div style={{padding:"10px 12px",background:"var(--amber-bg)",border:"1px solid var(--amber-rule)",borderRadius:5,fontSize:11,color:"var(--amber)",fontWeight:600,marginTop:8}}>
              No sources yet — add sources in Overview first
            </div>
          )}
        </div>
        <div className="fb-modal-footer">
          <button className="fb-btn fb-btn-outline" onClick={onClose}>Cancel</button>
          <button className="fb-btn fb-btn-ink" onClick={()=>canSave&&onSave(allocs.map(a=>({sourceId:a.srcId,amount:Number(a.amount)})))} style={{opacity:canSave?"1":"0.4"}}>
            Assign {allocs.length>1?`${allocs.length} Sources`:"Source"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── CARRY-OVER BANNER — shown at top of half/month when carry-overs exist ─── */
function CarryOverBanner({ carryOvers, sources, expenses, onAssignSource, onResolve, onResolveAll, onViewSource, onNavigateOrigin }) {
  const pending   = carryOvers.filter(co=>!co.resolvedAt);
  const resolved  = carryOvers.filter(co=>co.resolvedAt);
  if (carryOvers.length === 0) return null;

  const groupByOrigin = (items) => {
    const groups = {};
    items.forEach(co=>{
      const k = co.fromLabel||co.from;
      if (!groups[k]) groups[k] = [];
      groups[k].push(co);
    });
    return Object.entries(groups);
  };

  return (
    <div style={{marginBottom:20}}>
      {pending.length > 0 && (
        <div className="fb-co-banner">
          <div className="fb-co-banner-icon">⚡</div>
          <div className="fb-co-banner-body">
            <div className="fb-co-banner-title">
              {pending.length} Carry-Over{pending.length!==1?"s":""} Pending — {fmt(pending.reduce((a,co)=>a+Number(co.amount),0))} total deficit
            </div>
            <div className="fb-co-list" style={{marginTop:8}}>
              {groupByOrigin(pending).map(([origin, items])=>(
                <div key={origin}>
                  <div className="fb-co-group-hdr">
                    {onNavigateOrigin ? (
                      <button className="fb-co-link" style={{color:"#92400e",fontWeight:700,fontSize:10}} onClick={()=>onNavigateOrigin(items[0].from)}>
                        From: {origin}
                      </button>
                    ) : (
                      <span>From: {origin}</span>
                    )}
                    <span style={{marginLeft:6,fontWeight:400}}>({fmt(items.reduce((a,co)=>a+Number(co.amount),0))})</span>
                  </div>
                  {items.map(co=>{
                    const src = sources.find(s=>s.id===co.sourceId);
                    const effRem = src ? sourceEffectiveRemaining(src, expenses, carryOvers) : null;
                    return (
                      <div key={co.id} className="fb-co-row">
                        <div style={{flex:1,minWidth:0}}>
                          {src ? (
                            <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
                              <span style={{fontSize:12}}>{SOURCE_TYPES[src.type]?.icon}</span>
                              <button className="fb-co-link" style={{fontSize:11,color:"var(--ink-2)"}} onClick={()=>onViewSource&&onViewSource(src)}>
                                {src.name} · {src.accountLabel}
                              </button>
                              {effRem!==null && <span style={{fontSize:9,color:effRem<0?"var(--red)":"var(--green)",fontFamily:"var(--mono)",marginLeft:4}}>{fmt(effRem)} left</span>}
                            </div>
                          ) : (
                            <button onClick={()=>onAssignSource(co)} style={{fontSize:9,fontWeight:700,color:"var(--amber)",background:"none",border:"1px dashed var(--amber-rule)",borderRadius:4,padding:"2px 8px",cursor:"pointer"}}>
                              ⚡ Assign source
                            </button>
                          )}
                        </div>
                        <div className="fb-co-amount">−{fmt(co.amount)}</div>
                        <button className="fb-co-resolve-btn" onClick={()=>onResolve(co.id)}>✓ Resolve</button>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {pending.length >= 2 && onResolveAll && (
              <button className="fb-co-resolve-all" onClick={onResolveAll}>
                ✓ Resolve All ({pending.length} items)
              </button>
            )}
            <div style={{fontSize:10,color:"#92400e",marginTop:8}}>
              These deficits are pre-deducted from their assigned sources. Resolve individually or all at once.
            </div>
          </div>
        </div>
      )}
      {resolved.length > 0 && (
        <div style={{padding:"10px 14px",background:"var(--green-bg)",border:"1px solid var(--green-rule)",borderRadius:7,marginTop:pending.length?8:0}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:resolved.length>0?8:0}}>
            <span style={{fontSize:13}}>✅</span>
            <span style={{fontSize:11,color:"var(--green)",fontWeight:700}}>
              {resolved.length} carry-over{resolved.length!==1?"s":""} resolved — {fmt(resolved.reduce((a,co)=>a+Number(co.amount),0))} cleared
            </span>
          </div>
          {groupByOrigin(resolved).map(([origin, items])=>(
            <div key={origin} style={{marginTop:4}}>
              <div style={{fontSize:9,fontWeight:700,color:"#166534",marginBottom:4}}>
                {onNavigateOrigin ? (
                  <button className="fb-co-link" style={{fontSize:9,color:"#166534"}} onClick={()=>onNavigateOrigin(items[0].from)}>
                    From: {origin}
                  </button>
                ) : (
                  <span>From: {origin}</span>
                )}
              </div>
              {items.map(co=>{
                const src = sources.find(s=>s.id===co.sourceId);
                const tm = src ? (SOURCE_TYPES[src.type]||SOURCE_TYPES.salary) : null;
                return (
                  <div key={co.id} className="fb-co-resolved-row">
                    <span style={{fontSize:10,color:"#166534"}}>{fmt(co.amount)}</span>
                    <span style={{color:"#166534"}}>→</span>
                    {src ? (
                      <button className="fb-co-link" style={{fontSize:10,color:"#166534"}} onClick={()=>onViewSource&&onViewSource(src)}>
                        {tm.icon} {src.name} · {src.accountLabel}
                      </button>
                    ) : (
                      <span style={{fontSize:10,color:"#166534",opacity:0.6}}>Source removed</span>
                    )}
                    <span style={{fontFamily:"var(--mono)",fontSize:8,color:"#16653499",marginLeft:"auto"}}>{co.resolvedAt}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── CONFIRM ROW ─── */
function ConfirmRow({ name, onConfirm, onCancel }) {
  return (
    <tr>
      <td colSpan={7} style={{padding:0}}>
        <div className="fb-confirm-box">
          <div className="fb-confirm-msg">Delete "{name}"? This cannot be undone.</div>
          <div className="fb-confirm-actions">
            <button className="fb-btn fb-btn-danger" style={{flex:1,padding:"8px 0",fontSize:"10px"}} onClick={onConfirm}>Delete</button>
            <button className="fb-btn fb-btn-outline" style={{flex:1,padding:"8px 0",fontSize:"10px"}} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </td>
    </tr>
  );
}

/* ─── BUDGET CELL — shows amount + source for single-half model ─── */
function BudgetCell({ expense, sources }) {
  const src = sources?.find(s=>s.id===expense.sourceId);
  return (
    <div>
      <span style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--ink-2)"}}>{fmt(expense.amount)}</span>
      {src && (
        <div style={{fontSize:9,color:"var(--ink-5)",marginTop:1}}>
          {SOURCE_TYPES[src.type]?.icon} {src.accountLabel||src.name}
        </div>
      )}
    </div>
  );
}

/* ─── PAID CELL ─── */
function PaidCell({ expense }) {
  const paid = expPaid(expense);
  return paid > 0
    ? <span style={{fontFamily:"var(--mono)",fontSize:12,color:"var(--green)"}}>{fmt(paid)}</span>
    : <span style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-5)"}}>—</span>;
}

/* ─── STATUS PILL ─── */
function StatusPill({ expense, onCycleStatus }) {
  const status = expStatus(expense);
  const labels = {paid:"✓ Paid", partial:"Partial", unpaid:"Unpaid"};
  return (
    <button className={`fb-status-pill ${status}`} onClick={()=>onCycleStatus(expense.id)}>
      {labels[status]}
    </button>
  );
}

/* ─── EXPENSE TABLE ─── */
function ExpenseTable({ expenses, sources, onEdit, onDelete, confirmDelId, setConfirmDelId, onCycleStatus, onPayments }) {
  if (expenses.length===0) return <div className="fb-empty">No expenses here yet — click "+ Add Expense" to get started</div>;
  return (
    <div className="fb-table-wrap">
      <table className="fb-table">
        <thead>
          <tr>
            <th style={{width:"28%"}}>Expense</th>
            <th style={{width:"11%"}}>Category</th>
            <th style={{width:"10%"}}>Tag</th>
            <th style={{width:"16%"}}>Budget / Source</th>
            <th style={{width:"12%"}} className="c">Status</th>
            <th style={{width:"12%"}} className="r">Paid</th>
            <th style={{width:"11%"}}></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map(e=>(
            <>
              <tr key={e.id}>
                <td>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span className="fb-td-name">{e.name}</span>
                    <button className={`fb-pay-btn${(e.payments&&e.payments.length>0)?" has-payments":""}`}
                      onClick={ev=>{ev.stopPropagation();onPayments(e);}}>
                      💳 {e.payments&&e.payments.length>0?e.payments.length+" pmt":"Pay"}
                    </button>
                  </div>
                </td>
                <td><span className="fb-cat-pill">{e.category}</span></td>
                <td>
                  {e.tag&&TAG_META[e.tag]
                    ? <span className="fb-tag-pill" style={{color:TAG_META[e.tag].color,background:TAG_META[e.tag].bg,borderColor:TAG_META[e.tag].border}}>
                        {TAG_META[e.tag].icon} {TAG_META[e.tag].label}
                      </span>
                    : <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-5)"}}>—</span>
                  }
                </td>
                <td><BudgetCell expense={e} sources={sources} /></td>
                <td className="c"><StatusPill expense={e} onCycleStatus={onCycleStatus} /></td>
                <td className="r"><PaidCell expense={e} /></td>
                <td className="r">
                  <div className="fb-row-actions">
                    <button className="fb-icon-btn" onClick={()=>onEdit(e)}>✎</button>
                    <button className="fb-icon-btn del" onClick={()=>setConfirmDelId(confirmDelId===e.id?null:e.id)}>✕</button>
                  </div>
                </td>
              </tr>
              {confirmDelId===e.id&&(
                <ConfirmRow key={"d"+e.id} name={e.name}
                  onConfirm={()=>onDelete(e.id)}
                  onCancel={()=>setConfirmDelId(null)} />
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─── CATEGORY HOME VIEW ─── */
function CategoryHomeView({ expenses, view, onSelectCategory }) {
  const [viewMode, setViewMode] = useState("list");

  const grouped = CATEGORIES.reduce((acc,cat)=>{
    const items = expenses.filter(e=>e.category===cat);
    if (items.length>0) acc[cat]=items;
    return acc;
  },{});
  expenses.forEach(e=>{
    if (!CATEGORIES.includes(e.category)){
      if (!grouped["Other"]) grouped["Other"]=[];
      if (!grouped["Other"].find(x=>x.id===e.id)) grouped["Other"].push(e);
    }
  });
  const cats = Object.keys(grouped);
  if (cats.length===0) return <div className="fb-empty" style={{paddingTop:48}}>No expenses — click "+ Add Expense"</div>;

  const catData = cats.map(cat=>{
    const items   = grouped[cat];
    const total   = items.reduce((a,e)=>a+expTotal(e),0);
    const paid    = items.reduce((a,e)=>a+expPaid(e),0);
    const paidPct = total>0?Math.min(100,(paid/total)*100):0;
    const meta    = getCatMeta(cat);
    const allPaid = items.every(e=>expStatus(e)==="paid");
    const nonePaid= items.every(e=>expStatus(e)==="unpaid");
    return {cat,items,total,paid,paidPct,meta,allPaid,nonePaid};
  });

  return (
    <>
      <div className="fb-section-hdr">
        <div className="fb-section-title">Categories</div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div className="fb-section-meta">{cats.length} categories · {expenses.length} items</div>
          <div className="fb-view-toggle">
            <button className={`fb-view-btn${viewMode==="tile"?" active":""}`} onClick={()=>setViewMode("tile")} title="Tile">⊞</button>
            <button className={`fb-view-btn${viewMode==="list"?" active":""}`} onClick={()=>setViewMode("list")} title="List">☰</button>
          </div>
        </div>
      </div>
      {viewMode==="tile" && (
        <div className="fb-cat-grid">
          {catData.map(({cat,items,total,paid,paidPct,meta,allPaid,nonePaid})=>(
            <div key={cat} className="fb-cat-card" onClick={()=>onSelectCategory(cat)}>
              <div className="fb-cat-card-top">
                <div className="fb-cat-icon" style={{background:meta.color}}>{meta.icon}</div>
                <span className="fb-cat-count">{items.length} item{items.length!==1?"s":""}</span>
              </div>
              <div className="fb-cat-name">{cat}</div>
              <div className="fb-cat-total">{fmt(total)}</div>
              <div className="fb-cat-paid-bar">
                <div className="fb-cat-paid-lbl">
                  <span>Paid {fmt(paid)}</span>
                  <span style={{color:allPaid?"var(--green)":nonePaid?"var(--ink-5)":"var(--amber)"}}>{allPaid?"✓ Done":nonePaid?"Unpaid":`${Math.round(paidPct)}%`}</span>
                </div>
                <div className="fb-prog-wrap"><div className="fb-prog-bar" style={{width:paidPct+"%",background:allPaid?"var(--green)":"var(--amber)"}} /></div>
              </div>
              <span className="fb-cat-arrow">›</span>
            </div>
          ))}
        </div>
      )}
      {viewMode==="list" && (
        <div className="fb-cat-list">
          {catData.map(({cat,items,total,paid,paidPct,meta,allPaid,nonePaid})=>(
            <div key={cat} className="fb-cat-list-row" onClick={()=>onSelectCategory(cat)}>
              <div className="fb-cat-list-icon" style={{background:meta.color}}>{meta.icon}</div>
              <div>
                <div className="fb-cat-list-name">{cat}</div>
                <div className="fb-cat-list-count">{items.length} item{items.length!==1?"s":""}</div>
              </div>
              <div className="fb-cat-list-bar-wrap">
                <div className="fb-cat-list-bar-lbl">
                  <span>Paid {fmt(paid)}</span>
                  <span style={{color:allPaid?"var(--green)":nonePaid?"var(--ink-5)":"var(--amber)"}}>{allPaid?"✓ Done":nonePaid?"Unpaid":`${Math.round(paidPct)}%`}</span>
                </div>
                <div className="fb-prog-wrap"><div className="fb-prog-bar" style={{width:paidPct+"%",background:allPaid?"var(--green)":"var(--amber)"}} /></div>
              </div>
              <div className="fb-cat-list-total">{fmt(total)}</div>
              <span className="fb-cat-list-chevron">›</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ─── CATEGORY DETAIL VIEW ─── */
function CategoryDetailView({ expenses, category, view, sources, onBack, onEdit, onDelete, confirmDelId, setConfirmDelId, onCycleStatus, onAdd, onPayments }) {
  const items = expenses.filter(e=>e.category===category);
  const total = items.reduce((a,e)=>a+expTotal(e),0);
  const paid  = items.reduce((a,e)=>a+expPaid(e),0);
  const meta  = getCatMeta(category);
  return (
    <>
      <div className="fb-breadcrumb">
        <button className="fb-breadcrumb-back" onClick={onBack}>← Back</button>
        <span className="fb-breadcrumb-sep">/</span>
        <span className="fb-breadcrumb-current">{category}</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
        <div className="fb-cat-icon" style={{background:meta.color,width:40,height:40,borderRadius:8,fontSize:18}}>{meta.icon}</div>
        <div>
          <div style={{fontSize:20,fontWeight:700,color:"var(--ink)",letterSpacing:"-0.02em"}}>{category}</div>
          <div style={{fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-4)"}}>{items.length} item{items.length!==1?"s":""} · {fmt(total)} budgeted · {fmt(paid)} paid</div>
        </div>
        <button className="fb-btn fb-btn-ink" style={{marginLeft:"auto"}} onClick={onAdd}>+ Add Item</button>
      </div>
      <ExpenseTable expenses={items} view={view} sources={sources} onEdit={onEdit} onDelete={onDelete} confirmDelId={confirmDelId} setConfirmDelId={setConfirmDelId} onCycleStatus={onCycleStatus} onPayments={onPayments} />
      {items.length>0&&(
        <div className="fb-tfoot">
          <div className="fb-tfoot-row"><div className="fb-tfoot-lbl">Category Total</div><div className="fb-tfoot-val">{fmt(total)}</div></div>
          <div className="fb-tfoot-row"><div className="fb-tfoot-lbl" style={{color:"var(--green)"}}>Total Paid</div><div className="fb-tfoot-val green">{fmt(paid)}</div></div>
        </div>
      )}
    </>
  );
}

/* ─── OVERVIEW VIEW ─── */
function OverviewView({ month, months, onEdit, onDelete, confirmDelId, setConfirmDelId, onCycleStatus, onPayments, onAddSource, onDeleteSource, onSaveCarryOver, onResolveCarryOver, onResolveAllCarryOvers, onNavigateView }) {
  const [activeCat,   setActiveCat]   = useState(null);
  const [coModal,     setCoModal]     = useState(null); // { deficitAmount, fromLabel, fromKey, existingCoIds }
  const [srcDetail,   setSrcDetail]   = useState(null);
  const expenses  = month.expenses;
  const carryOvers= month.carryOvers||[];

  const total  = expenses.reduce((a,e)=>a+expTotal(e),0);
  const paid   = expenses.reduce((a,e)=>a+expPaid(e),0);
  const remain = total - paid;
  const avail  = sourcesTotalAll(month.sources||[]);
  const excess = avail - total;
  const over   = excess < 0;
  const pct    = avail>0?Math.min(100,(total/avail)*100):0;

  const _h1e   = halfExpenses(expenses,"half1");
  const _h2e   = halfExpenses(expenses,"half2");
  const h1tot  = _h1e.reduce((a,e)=>a+Number(e.amount),0);
  const h1paid = _h1e.reduce((a,e)=>a+expPaid(e),0);
  const h1sal  = sourcesTotal(month.sources||[],"half1");
  const h1ex   = h1sal - h1tot;
  const h2tot  = _h2e.reduce((a,e)=>a+Number(e.amount),0);
  const h2paid = _h2e.reduce((a,e)=>a+expPaid(e),0);
  const h2sal  = sourcesTotal(month.sources||[],"half2");
  const h2ex   = h2sal - h2tot;

  if (activeCat) return (
    <CategoryDetailView
      expenses={expenses} category={activeCat} view="overview"
      sources={month.sources||[]}
      onBack={()=>setActiveCat(null)}
      onEdit={onEdit} onDelete={onDelete}
      confirmDelId={confirmDelId} setConfirmDelId={setConfirmDelId}
      onCycleStatus={onCycleStatus}
      onPayments={onPayments}
      onAdd={()=>{}}
    />
  );

  return (
    <>
      {/* Source detail modal triggered from banner links */}
      {srcDetail && (
        <SourceDetailModal
          source={srcDetail}
          expenses={expenses}
          allSources={month.sources||[]}
          onClose={()=>setSrcDetail(null)}
        />
      )}
      {/* Carry-over banner */}
      <CarryOverBanner
        carryOvers={carryOvers}
        sources={month.sources||[]}
        expenses={expenses}
        onAssignSource={(co)=>{
          const fromCos = carryOvers.filter(c=>c.from===co.from&&c.fromLabel===co.fromLabel);
          const totalDef = fromCos.reduce((a,c)=>a+Number(c.amount),0);
          setCoModal({deficitAmount:totalDef,fromLabel:co.fromLabel,fromKey:co.from,existingCoIds:fromCos.map(c=>c.id),existingAllocations:fromCos.map(c=>({sourceId:c.sourceId,amount:c.amount}))});
        }}
        onResolve={onResolveCarryOver}
        onResolveAll={onResolveAllCarryOvers}
        onViewSource={(src)=>setSrcDetail(src)}
        onNavigateOrigin={(from)=>{
          if (from==="half1"||from==="half2") onNavigateView && onNavigateView(from);
        }}
      />
      {/* Carry-over modal */}
      {coModal && (
        <CarryOverModal
          deficitAmount={coModal.deficitAmount}
          fromLabel={coModal.fromLabel}
          sources={month.sources||[]}
          carryOvers={carryOvers}
          allExpenses={expenses}
          existingAllocations={coModal.existingAllocations||[]}
          onClose={()=>setCoModal(null)}
          onSave={(allocations)=>{
            const existingIds = coModal.existingCoIds||[];
            existingIds.forEach(id=>onResolveCarryOver&&onResolveCarryOver(id,"__delete__"));
            allocations.forEach(alloc=>{
              onSaveCarryOver({
                id: newCoId(),
                from: coModal.fromKey,
                fromLabel: coModal.fromLabel,
                amount: alloc.amount,
                sourceId: alloc.sourceId,
                resolvedAt: null,
              });
            });
            setCoModal(null);
          }}
        />
      )}
      <div className="fb-summary-grid" style={{marginBottom:16}}>
        <div className="fb-sum-card hero">
          <div className="fb-sum-lbl">Total Expenses</div>
          <div className="fb-sum-val">{fmt(total)}</div>
          <div className="fb-sum-sub">Both halves combined</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Total Paid</div>
          <div className="fb-sum-val green">{fmt(paid)}</div>
          <div className="fb-sum-sub">Already settled</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Remaining</div>
          <div className="fb-sum-val">{fmt(remain)}</div>
          <div className="fb-sum-sub">Still to be paid</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Total Salary</div>
          <div className="fb-sum-val">{fmt(avail)}</div>
          <div className="fb-sum-sub">25th + 30th combined</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Month Surplus / Deficit</div>
          <div className={`fb-sum-val ${over?"red":"green"}`}>{over?"−":""}{fmt(Math.abs(excess))}</div>
          <div className="fb-sum-sub">{over?"Over budget":"Under budget"}</div>
          <div className="fb-prog-wrap"><div className="fb-prog-bar" style={{width:`${pct}%`,background:over?"var(--red)":"var(--green)"}} /></div>
        </div>
      </div>

      <div className="fb-ov-split">
        {[
          {key:"half1",label:"1st Half",dot:"#1d4ed8",salary:month.half1SalaryDate,tot:h1tot,paid:h1paid,budget:h1sal,ex:h1ex},
          {key:"half2",label:"2nd Half",dot:"var(--ink-3)",salary:month.half2SalaryDate,tot:h2tot,paid:h2paid,budget:h2sal,ex:h2ex},
        ].map(h=>{
          const halfDeficit = h.ex < 0 ? Math.abs(h.ex) : 0;
          const existingCos = carryOvers.filter(co=>co.from===h.key);
          return (
          <div key={h.label} className="fb-ov-half-card">
            <div className="fb-ov-half-title">
              <div className="fb-ov-half-dot" style={{background:h.dot}} />
              {h.label}
              <span style={{fontFamily:"var(--mono)",fontWeight:400,letterSpacing:0,textTransform:"none",fontSize:9,color:"var(--ink-5)"}}>· salary {h.salary}</span>
            </div>
            <div className="fb-ov-row"><span className="fb-ov-lbl">Expenses</span><span className="fb-ov-val">{fmt(h.tot)}</span></div>
            <div className="fb-ov-row"><span className="fb-ov-lbl">Paid</span><span className="fb-ov-val green">{fmt(h.paid)}</span></div>
            <div className="fb-ov-row"><span className="fb-ov-lbl">Salary</span><span className="fb-ov-val">{fmt(h.budget)}</span></div>
            <div className="fb-ov-row">
              <span className="fb-ov-lbl">{h.ex<0?"Deficit":"Surplus"}</span>
              <span className={`fb-ov-val ${h.ex<0?"red":"green"}`}>{h.ex<0?"−":""}{fmt(Math.abs(h.ex))}</span>
            </div>
            {halfDeficit > 0 && (
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--rule)"}}>
                {existingCos.length > 0 ? (
                  <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span className="fb-co-badge">⚡ {existingCos.length} carry-over{existingCos.length!==1?"s":""}</span>
                    <button onClick={()=>setCoModal({deficitAmount:halfDeficit,fromLabel:`${h.label} · ${month.label}`,fromKey:h.key,existingCoIds:existingCos.map(c=>c.id),existingAllocations:existingCos.map(c=>({sourceId:c.sourceId,amount:c.amount}))})}
                      style={{fontSize:9,color:"var(--ink-4)",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Edit</button>
                  </div>
                ) : (
                  <button onClick={()=>setCoModal({deficitAmount:halfDeficit,fromLabel:`${h.label} · ${month.label}`,fromKey:h.key,existingCoIds:[],existingAllocations:[]})}
                    style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:5,border:"1.5px dashed var(--amber-rule)",background:"var(--amber-bg)",cursor:"pointer",fontSize:10,fontWeight:700,color:"var(--amber)",width:"100%",justifyContent:"center"}}>
                    ⚡ Set carry-over source{(month.sources||[]).length>1?"s":""}
                  </button>
                )}
              </div>
            )}
          </div>
          );
        })}
      </div>

      <SourcesPanel sources={month.sources||[]} expenses={month.expenses||[]} carryOvers={carryOvers} onAddSource={onAddSource} onDeleteSource={onDeleteSource} />
      <CategoryHomeView expenses={expenses} view="overview" onSelectCategory={setActiveCat} />
    </>
  );
}

/* ─── HALF VIEW ─── */
function HalfView({ month, halfKey, onEdit, onDelete, confirmDelId, setConfirmDelId, onCycleStatus, onUpdateSalary, onAddExpense, onPayments, onResolveCarryOver, onResolveAllCarryOvers }) {
  const [activeCat, setActiveCat] = useState(null);
  const salary  = sourcesTotal(month.sources||[], halfKey);
  const expenses = halfExpenses(month.expenses, halfKey);

  const total   = expenses.reduce((a,e)=>a+expTotal(e),0);
  const paid    = expenses.reduce((a,e)=>a+expPaid(e),0);
  const remain  = total - paid;
  const avail   = Number(salary);
  const excess  = avail - total;
  const over    = excess < 0;
  const pct     = avail>0?Math.min(100,(total/avail)*100):0;

  if (activeCat) return (
    <CategoryDetailView
      expenses={expenses} category={activeCat} view={halfKey}
      sources={month.sources||[]}
      onBack={()=>setActiveCat(null)}
      onEdit={onEdit} onDelete={onDelete}
      confirmDelId={confirmDelId} setConfirmDelId={setConfirmDelId}
      onCycleStatus={onCycleStatus}
      onAdd={onAddExpense}
      onPayments={onPayments}
    />
  );

  const carryOvers = (month.carryOvers||[]).filter(co=>co.from===halfKey||co.from==="prev_month");

  return (
    <>
      {carryOvers.length>0 && (
        <CarryOverBanner
          carryOvers={carryOvers}
          sources={month.sources||[]}
          expenses={month.expenses||[]}
          onAssignSource={()=>{}}
          onResolve={onResolveCarryOver||(()=>{})}
          onResolveAll={onResolveAllCarryOvers}
        />
      )}
      <div className="fb-summary-grid">
        <div className="fb-sum-card hero">
          <div className="fb-sum-lbl">Total Expenses</div>
          <div className="fb-sum-val">{fmt(total)}</div>
          <div className="fb-sum-sub">This half's portion</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Total Paid</div>
          <div className="fb-sum-val green">{fmt(paid)}</div>
          <div className="fb-sum-sub">Already settled</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Remaining</div>
          <div className="fb-sum-val">{fmt(remain)}</div>
          <div className="fb-sum-sub">Still to be paid</div>
        </div>
        <div className="fb-sum-card hero">
          <div className="fb-sum-lbl">Salary / Sources</div>
          <div className="fb-sum-val">{fmt(avail)}</div>
          <div className="fb-sum-sub">From {(month.sources||[]).filter(s=>s.half===halfKey||s.half==="both").length} source(s) · manage in Overview</div>
        </div>
        <div className="fb-sum-card">
          <div className="fb-sum-lbl">Surplus / Deficit</div>
          <div className={`fb-sum-val ${over?"red":"green"}`}>{over?"−":""}{fmt(Math.abs(excess))}</div>
          <div className="fb-sum-sub">{over?"Over budget":"Under budget"}</div>
          <div className="fb-prog-wrap"><div className="fb-prog-bar" style={{width:`${pct}%`,background:over?"var(--red)":"var(--green)"}} /></div>
        </div>
      </div>
      <CategoryHomeView expenses={expenses} view={halfKey} onSelectCategory={setActiveCat} />
    </>
  );
}


/* ─── PIE CHART (pure SVG) ─── */
function PieChart({ slices, size=180, hole=0.55, hovered, setHovered }) {
  const cx = size/2, cy = size/2, r = size/2 - 2;
  const innerR = r * hole;
  let cumAngle = -Math.PI/2;
  const paths = slices.map((s,i)=>{
    const angle = (s.pct/100)*2*Math.PI;
    const startA = cumAngle;
    const endA   = cumAngle + angle;
    cumAngle = endA;
    if (s.pct <= 0) return null;
    const expand = hovered===i ? 4 : 0;
    const midA   = (startA+endA)/2;
    const ox     = Math.cos(midA)*expand, oy = Math.sin(midA)*expand;
    const x1=cx+ox+r*Math.cos(startA), y1=cy+oy+r*Math.sin(startA);
    const x2=cx+ox+r*Math.cos(endA),   y2=cy+oy+r*Math.sin(endA);
    const ix1=cx+ox+innerR*Math.cos(endA),  iy1=cy+oy+innerR*Math.sin(endA);
    const ix2=cx+ox+innerR*Math.cos(startA),iy2=cy+oy+innerR*Math.sin(startA);
    const large = angle>Math.PI?1:0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${large} 0 ${ix2} ${iy2} Z`;
    return { d, color:s.color, i };
  }).filter(Boolean);

  return (
    <svg width={size} height={size} style={{flexShrink:0,overflow:"visible"}}>
      {paths.map(p=>(
        <path key={p.i} d={p.d} fill={p.color}
          stroke="var(--linen)" strokeWidth="1.5"
          style={{cursor:"pointer",transition:"opacity 0.15s"}}
          opacity={hovered===null||hovered===p.i?1:0.45}
          onMouseEnter={()=>setHovered(p.i)}
          onMouseLeave={()=>setHovered(null)}
        />
      ))}
      {hovered!==null && slices[hovered] && (
        <>
          <text x={cx} y={cy-9} textAnchor="middle" style={{fontFamily:"var(--mono)",fontSize:14,fontWeight:500,fill:"var(--ink)"}}>
            {slices[hovered].pctLabel}
          </text>
          <text x={cx} y={cy+10} textAnchor="middle" style={{fontFamily:"var(--sans)",fontSize:9,fill:"var(--ink-4)"}}>
            {slices[hovered].label.length>12?slices[hovered].label.slice(0,11)+"…":slices[hovered].label}
          </text>
        </>
      )}
      {hovered===null && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          style={{fontFamily:"var(--mono)",fontSize:13,fontWeight:500,fill:"var(--ink-3)"}}>
          {slices.length}
        </text>
      )}
    </svg>
  );
}


/* ─── SOURCE DONUT (custom with legend inside) ─── */
function SrcDonut({ slices, hovered, setHovered }) {
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <PieChart slices={slices} size={140} hole={0.55} hovered={hovered} setHovered={setHovered} />
      <div style={{display:"flex",flexDirection:"column",gap:4,width:"100%"}}>
        {slices.map((s,i)=>(
          <div key={s.label} className="fb-stat-leg-row"
            onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}
            style={{opacity:hovered===null||hovered===i?1:0.45,transition:"opacity 0.15s",padding:"2px 4px"}}>
            <div className="fb-stat-leg-dot" style={{background:s.color}} />
            <span style={{fontSize:10,fontWeight:600,color:"var(--ink-2)",flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:100}}>{s.label}</span>
            <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-4)",marginLeft:4}}>{s.pctLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── TAG BREAKDOWN CHART ─── */
function TagBreakdownChart({ expenses, total, hovTag, setHovTag }) {
  const tagMap = {};
  expenses.forEach(e=>{
    const k = e.tag || "untagged";
    if (!tagMap[k]) tagMap[k] = {budget:0,paid:0};
    tagMap[k].budget += expTotal(e);
    tagMap[k].paid   += expPaid(e);
  });
  const tagEntries = Object.entries(tagMap).sort((a,b)=>b[1].budget-a[1].budget);
  const tagSlices = tagEntries.map(([k,v])=>{
    const m = k==="untagged"
      ? {label:"Untagged",icon:"—",color:"#94a3b8",bg:"#f1f5f9",border:"#cbd5e1"}
      : {...TAG_META[k]};
    return { key:k, label:m.label, icon:m.icon, color:m.color, bg:m.bg||"var(--linen-2)", border:m.border||"var(--rule)", budget:v.budget, paid:v.paid, pct:total>0?(v.budget/total)*100:0 };
  });
  return (
    <div style={{display:"flex",gap:28,alignItems:"flex-start",flexWrap:"wrap"}}>
      <PieChart
        slices={tagSlices.map(s=>({...s,pctLabel:Math.round(s.pct)+"%",value:s.budget}))}
        size={200} hovered={hovTag} setHovered={setHovTag}
      />
      <div style={{flex:1,minWidth:280}}>
        {tagSlices.map((s,i)=>{
          const paidPct = s.budget>0?Math.min(100,(s.paid/s.budget)*100):0;
          return (
            <div key={s.key} style={{marginBottom:14,opacity:hovTag===null||hovTag===i?1:0.4,transition:"opacity 0.15s"}}
              onMouseEnter={()=>setHovTag(i)} onMouseLeave={()=>setHovTag(null)}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <div style={{width:10,height:10,borderRadius:"50%",background:s.color,flexShrink:0}} />
                <span style={{fontSize:12,fontWeight:700,color:"var(--ink)"}}>
                  {s.icon!=="—"?s.icon+" ":""}{s.label}
                </span>
                {s.key==="untagged"&&<span style={{fontSize:9,color:"var(--ink-5)",fontStyle:"italic"}}>· no tag assigned</span>}
                <span style={{marginLeft:"auto",fontFamily:"var(--mono)",fontSize:11,color:"var(--ink-3)"}}>{fmt(s.budget)}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-5)",minWidth:36,textAlign:"right"}}>{Math.round(s.pct)}%</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <div style={{width:10,flexShrink:0}} />
                <div className="fb-stat-bar-track" style={{flex:1}}>
                  <div className="fb-stat-bar-fill" style={{width:paidPct+"%",background:s.color}} />
                </div>
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--green)",minWidth:70,textAlign:"right"}}>{fmt(s.paid)} paid</span>
              </div>
            </div>
          );
        })}
        <div style={{marginTop:12,paddingTop:10,borderTop:"1px solid var(--rule)",display:"flex",gap:6,flexWrap:"wrap"}}>
          {TAGS.map(t=>{
            const m=TAG_META[t]; const v=tagMap[t];
            return (
              <div key={t} style={{display:"flex",alignItems:"center",gap:5,padding:"4px 10px",borderRadius:20,border:`1px solid ${m.border}`,background:m.bg}}>
                <span style={{fontSize:11}}>{m.icon}</span>
                <span style={{fontSize:10,fontWeight:600,color:m.color}}>{m.label}</span>
                <span style={{fontFamily:"var(--mono)",fontSize:9,color:m.color,opacity:0.7}}>{v?fmt(v.budget):"₱0"}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── SOURCES STAT CARD ─── */
const SRC_PALETTE = ["#60a5fa","#34d399","#fbbf24","#f87171","#a78bfa","#38bdf8","#fb923c","#e879f9"];

function SourcesStatCard({ sources, expenses, h1sal, h2sal, h1tot, h2tot }) {
  const [hovSrc,  setHovSrc]  = useState(null);
  const [hovUtil, setHovUtil] = useState(null);

  const srcData = sources.map(s=>{
    const spent = sourceSpent(expenses, s.id);
    const rem   = Number(s.balance) - spent;
    const tm    = SOURCE_TYPES[s.type] || SOURCE_TYPES.salary;
    return { ...s, spent, rem, over: rem<0, tm };
  });
  const totalBalance   = sources.reduce((a,s)=>a+Number(s.balance),0);
  const totalSpentAll  = srcData.reduce((a,s)=>a+s.spent,0);
  const totalRemaining = Math.max(0, totalBalance - totalSpentAll);

  const srcSlices = srcData.map((s,i)=>({
    label:s.name, value:s.balance,
    pct:totalBalance>0?(s.balance/totalBalance)*100:0,
    pctLabel:totalBalance>0?Math.round((s.balance/totalBalance)*100)+"%":"0%",
    color:SRC_PALETTE[i%SRC_PALETTE.length],
    spent:s.spent, rem:s.rem,
  }));

  const utilSlices = [
    { label:"Spent",     value:totalSpentAll,  pct:totalBalance>0?(totalSpentAll/totalBalance)*100:0,  pctLabel:totalBalance>0?Math.round((totalSpentAll/totalBalance)*100)+"%":"0%",  color:"#f87171" },
    { label:"Remaining", value:totalRemaining, pct:totalBalance>0?(totalRemaining/totalBalance)*100:0, pctLabel:totalBalance>0?Math.round((totalRemaining/totalBalance)*100)+"%":"0%", color:"#4ade80" },
  ].filter(s=>s.value>0);

  const typeMap = {};
  srcData.forEach(s=>{
    if (!typeMap[s.type]) typeMap[s.type]={balance:0,spent:0,count:0};
    typeMap[s.type].balance+=Number(s.balance);
    typeMap[s.type].spent+=s.spent;
    typeMap[s.type].count++;
  });

  return (
    <div className="fb-stat-card fb-stat-full">
      <div className="fb-stat-card-title">Budget Sources</div>
      <div style={{display:"flex",gap:32,alignItems:"flex-start",flexWrap:"wrap"}}>

        {/* Allocation donut */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)"}}>Allocation</div>
          <SrcDonut slices={srcSlices} hovered={hovSrc} setHovered={setHovSrc} />
        </div>

        {/* Utilisation donut */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)"}}>Utilisation</div>
          <PieChart slices={utilSlices} size={140} hole={0.55} hovered={hovUtil} setHovered={setHovUtil} />
          <div style={{display:"flex",gap:12}}>
            {[{label:"Spent",color:"#f87171",val:totalSpentAll},{label:"Left",color:"#4ade80",val:totalRemaining}].map(x=>(
              <div key={x.label} style={{textAlign:"center"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:12,fontWeight:600,color:x.color}}>{fmt(x.val)}</div>
                <div style={{fontSize:8,color:"var(--ink-5)",textTransform:"uppercase",letterSpacing:"0.06em"}}>{x.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-source bars */}
        <div style={{flex:1,minWidth:240}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:12}}>Per Source</div>
          {srcData.map((s,i)=>{
            const color = SRC_PALETTE[i%SRC_PALETTE.length];
            const spentPct = Number(s.balance)>0?Math.min(100,(s.spent/Number(s.balance))*100):0;
            return (
              <div key={s.id} style={{marginBottom:12}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:4}}>
                  <span style={{fontSize:13}}>{s.tm.icon}</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--ink)",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{s.name}</div>
                    <div style={{fontSize:9,color:"var(--ink-5)"}}>{s.accountLabel} · {s.tm.label}</div>
                  </div>
                  <div style={{textAlign:"right",flexShrink:0}}>
                    <div style={{fontFamily:"var(--mono)",fontSize:11,fontWeight:600,color:s.over?"var(--red)":"var(--green)"}}>{fmt(s.rem)}</div>
                    <div style={{fontSize:8,color:"var(--ink-5)"}}>of {fmt(s.balance)}</div>
                  </div>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{flex:1,height:6,background:"var(--linen-3)",borderRadius:3,overflow:"hidden"}}>
                    <div style={{height:"100%",borderRadius:3,width:spentPct+"%",background:s.over?"var(--red)":color,transition:"width 0.4s"}} />
                  </div>
                  <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)",minWidth:32,textAlign:"right"}}>{Math.round(spentPct)}%</span>
                  {s.over&&<span title="Overspent">⚠️</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* By type */}
        <div style={{minWidth:150}}>
          <div style={{fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--ink-4)",marginBottom:12}}>By Type</div>
          {Object.entries(typeMap).map(([type,v])=>{
            const tm = SOURCE_TYPES[type]||SOURCE_TYPES.salary;
            const usedPct = v.balance>0?Math.min(100,(v.spent/v.balance)*100):0;
            return (
              <div key={type} style={{marginBottom:14}}>
                <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:5}}>
                  <span style={{fontSize:15}}>{tm.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,fontWeight:700,color:"var(--ink)"}}>{tm.label}</div>
                    <div style={{fontSize:9,color:"var(--ink-5)"}}>{v.count} source{v.count!==1?"s":""}</div>
                  </div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--ink-3)",marginBottom:3}}>
                  <span>Total: <span style={{fontFamily:"var(--mono)",fontWeight:600}}>{fmt(v.balance)}</span></span>
                  <span style={{color:"var(--green)",fontFamily:"var(--mono)",fontSize:10}}>{fmt(v.spent)} spent</span>
                </div>
                <div style={{height:5,background:"var(--linen-3)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",borderRadius:3,width:usedPct+"%",background:tm.color}} />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

/* ─── STATISTICS VIEW ─── */
const CAT_COLORS = {
  Bills:     "#93c5fd",
  Food:      "#6ee7b7",
  Utilities: "#fcd34d",
  Home:      "#fca5a5",
  Travel:    "#67e8f9",
  Health:    "#c4b5fd",
  Education: "#f9a8d4",
  Other:     "#cbd5e1",
};

function StatisticsView({ month }) {
  const [hovCat,    setHovCat]    = useState(null);
  const [hovStatus, setHovStatus] = useState(null);
  const [hovHalf,   setHovHalf]   = useState(null);
  const [hovTag,    setHovTag]    = useState(null);

  const expenses = month.expenses;
  const total    = expenses.reduce((a,e)=>a+expTotal(e), 0);
  const totalPaid= expenses.reduce((a,e)=>a+expPaid(e),  0);
  const totalRem = total - totalPaid;
  const avail    = sourcesTotalAll(month.sources||[]);
  const excess   = avail - total;
  const over     = excess < 0;

  // Per-half totals for StatisticsView charts
  const h1exps = halfExpenses(expenses,"half1");
  const h2exps = halfExpenses(expenses,"half2");
  const h1tot  = h1exps.reduce((a,e)=>a+expTotal(e),0);
  const h2tot  = h2exps.reduce((a,e)=>a+expTotal(e),0);
  const h1sal  = sourcesTotal(month.sources||[],"half1");
  const h2sal  = sourcesTotal(month.sources||[],"half2");

  /* ── Category breakdown ── */
  const catMap = {};
  expenses.forEach(e=>{
    const c = e.category;
    if (!catMap[c]) catMap[c] = {budget:0, paid:0};
    catMap[c].budget += expTotal(e);
    catMap[c].paid   += expPaid(e);
  });
  const catSlices = Object.entries(catMap)
    .filter(([,v])=>v.budget>0)
    .sort((a,b)=>b[1].budget-a[1].budget)
    .map(([cat,v])=>({
      label: cat,
      value: v.budget,
      paid:  v.paid,
      pct:   total>0 ? (v.budget/total)*100 : 0,
      pctLabel: total>0 ? Math.round((v.budget/total)*100)+"%" : "0%",
      color: CAT_COLORS[cat] || "#cbd5e1",
    }));

  /* ── Paid vs Unpaid ── */
  const statusSlices = [
    { label:"Paid",    value:totalPaid, pct: total>0?(totalPaid/total)*100:0, pctLabel: total>0?Math.round((totalPaid/total)*100)+"%":"0%", color:"#4ade80" },
    { label:"Unpaid",  value:totalRem,  pct: total>0?(totalRem/total)*100:0,  pctLabel: total>0?Math.round((totalRem/total)*100)+"%":"0%",  color:"#fca5a5" },
  ].filter(s=>s.value>0);

  /* ── 1st vs 2nd Half ── */
  const halfSlices = [
    { label:"1st Half (25th)", value:h1tot, pct:total>0?(h1tot/total)*100:0, pctLabel:total>0?Math.round((h1tot/total)*100)+"%":"0%", color:"#93c5fd" },
    { label:"2nd Half (30th)", value:h2tot, pct:total>0?(h2tot/total)*100:0, pctLabel:total>0?Math.round((h2tot/total)*100)+"%":"0%", color:"#a5b4fc" },
  ].filter(s=>s.value>0);

  if (total===0) return <div className="fb-empty" style={{paddingTop:60}}>Add expenses to see statistics</div>;

  return (
    <>
      {/* ── Summary strip ── */}
      <div className="fb-stat-summary-row">
        {[
          {lbl:"Total Budget",    val:fmt(total),             cls:""},
          {lbl:"Total Paid",      val:fmt(totalPaid),         cls:"green"},
          {lbl:"Remaining",       val:fmt(totalRem),          cls:""},
          {lbl:"Salary Budget",   val:fmt(avail),             cls:""},
          {lbl:over?"Deficit":"Surplus", val:(over?"−":"")+fmt(Math.abs(excess)), cls:over?"red":"green"},
        ].map(s=>(
          <div key={s.lbl} className="fb-stat-summary-card">
            <div className="fb-stat-summary-lbl">{s.lbl}</div>
            <div className={`fb-stat-summary-val ${s.cls}`}>{s.val}</div>
          </div>
        ))}
      </div>

      <div className="fb-stats-grid">

        {/* ── Category Breakdown ── */}
        <div className="fb-stat-card">
          <div className="fb-stat-card-title">Expenses by Category</div>
          <div className="fb-stat-chart-area">
            <PieChart slices={catSlices} size={180} hovered={hovCat} setHovered={setHovCat} />
            <div className="fb-stat-legend">
              {catSlices.map((s,i)=>(
                <div key={s.label} className="fb-stat-leg-row"
                  onMouseEnter={()=>setHovCat(i)} onMouseLeave={()=>setHovCat(null)}
                  style={{opacity:hovCat===null||hovCat===i?1:0.45,transition:"opacity 0.15s"}}>
                  <div className="fb-stat-leg-dot" style={{background:s.color}} />
                  <span className="fb-stat-leg-name">{s.label}</span>
                  <span className="fb-stat-leg-val">{fmt(s.value)}</span>
                  <span className="fb-stat-leg-pct">{s.pctLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Paid vs Unpaid ── */}
        <div className="fb-stat-card">
          <div className="fb-stat-card-title">Payment Status</div>
          <div className="fb-stat-chart-area">
            <PieChart slices={statusSlices} size={180} hovered={hovStatus} setHovered={setHovStatus} />
            <div className="fb-stat-legend">
              {statusSlices.map((s,i)=>(
                <div key={s.label} className="fb-stat-leg-row"
                  onMouseEnter={()=>setHovStatus(i)} onMouseLeave={()=>setHovStatus(null)}
                  style={{opacity:hovStatus===null||hovStatus===i?1:0.45,transition:"opacity 0.15s"}}>
                  <div className="fb-stat-leg-dot" style={{background:s.color}} />
                  <span className="fb-stat-leg-name">{s.label}</span>
                  <span className="fb-stat-leg-val">{fmt(s.value)}</span>
                  <span className="fb-stat-leg-pct">{s.pctLabel}</span>
                </div>
              ))}
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--rule)"}}>
                <div style={{fontFamily:"var(--mono)",fontSize:10,color:"var(--ink-4)"}}>
                  {statusSlices.find(s=>s.label==="Paid") ? Math.round(statusSlices.find(s=>s.label==="Paid").pct) : 0}% of budget settled
                </div>
                <div className="fb-prog-wrap" style={{marginTop:6}}>
                  <div className="fb-prog-bar" style={{width:(total>0?(totalPaid/total)*100:0)+"%", background:"var(--green)"}} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 1st vs 2nd Half ── */}
        <div className="fb-stat-card">
          <div className="fb-stat-card-title">Budget by Half</div>
          <div className="fb-stat-chart-area">
            <PieChart slices={halfSlices} size={180} hovered={hovHalf} setHovered={setHovHalf} />
            <div className="fb-stat-legend">
              {halfSlices.map((s,i)=>(
                <div key={s.label} className="fb-stat-leg-row"
                  onMouseEnter={()=>setHovHalf(i)} onMouseLeave={()=>setHovHalf(null)}
                  style={{opacity:hovHalf===null||hovHalf===i?1:0.45,transition:"opacity 0.15s"}}>
                  <div className="fb-stat-leg-dot" style={{background:s.color}} />
                  <span className="fb-stat-leg-name">{s.label}</span>
                  <span className="fb-stat-leg-val">{fmt(s.value)}</span>
                  <span className="fb-stat-leg-pct">{s.pctLabel}</span>
                </div>
              ))}
              <div style={{marginTop:8,paddingTop:8,borderTop:"1px solid var(--rule)"}}>
                <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:2}}>
                  {[
                    {lbl:"1st salary",val:h1sal,exp:h1tot,color:"#93c5fd"},
                    {lbl:"2nd salary",val:h2sal,exp:h2tot,color:"#a5b4fc"},
                  ].map(h=>{
                    const hEx = Number(h.val)-h.exp;
                    return (
                      <div key={h.lbl} style={{display:"flex",gap:5,alignItems:"center"}}>
                        <div style={{width:8,height:8,borderRadius:"50%",background:h.color,flexShrink:0}} />
                        <span style={{fontSize:9,color:"var(--ink-4)",flex:1}}>{h.lbl}</span>
                        <span style={{fontFamily:"var(--mono)",fontSize:9,color:hEx<0?"var(--red)":"var(--green)"}}>
                          {hEx<0?"−":"+"}{ fmt(Math.abs(hEx))}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Category bar chart ── */}
        <div className="fb-stat-card">
          <div className="fb-stat-card-title">Budget vs Paid per Category</div>
          <div className="fb-stat-bar-list">
            {catSlices.map(s=>{
              const paidPct = s.value>0?Math.min(100,(s.paid/s.value)*100):0;
              return (
                <div key={s.label}>
                  <div className="fb-stat-bar-row" style={{marginBottom:4}}>
                    <div style={{width:8,height:8,borderRadius:"50%",background:s.color,flexShrink:0}} />
                    <div className="fb-stat-bar-label" style={{marginLeft:4}}>{s.label}</div>
                    <div className="fb-stat-bar-amt">
                      <span style={{color:"var(--green)",fontFamily:"var(--mono)",fontSize:10}}>{fmt(s.paid)}</span>
                      <span style={{color:"var(--ink-5)",fontFamily:"var(--mono)",fontSize:10}}> / {fmt(s.value)}</span>
                    </div>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <div style={{width:8,flexShrink:0}} />
                    <div className="fb-stat-bar-track" style={{marginLeft:4}}>
                      <div className="fb-stat-bar-fill" style={{width:paidPct+"%",background:s.color}} />
                    </div>
                    <span style={{fontFamily:"var(--mono)",fontSize:9,color:"var(--ink-5)",minWidth:28,textAlign:"right"}}>{Math.round(paidPct)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>


        {/* ── Tag Breakdown Chart ── */}
        <div className="fb-stat-card fb-stat-full">
          <div className="fb-stat-card-title">Expenses by Financial Tag</div>
          <TagBreakdownChart expenses={expenses} total={total} hovTag={hovTag} setHovTag={setHovTag} />
        </div>


        {/* ── Budget Sources ── full width ── */}
        {(month.sources||[]).length > 0 && (
          <SourcesStatCard sources={month.sources||[]} expenses={expenses} h1sal={h1sal} h2sal={h2sal} h1tot={h1tot} h2tot={h2tot} />
        )}

      </div>
    </>
  );
}

/* ─── ROOT APP ─── */
export default function App() {
  const [months,       setMonths]       = useState(INITIAL_MONTHS);
  const [activeId,     setActiveId]     = useState(5);
  const [sidebarOpen,  setSidebarOpen]  = useState(false);
  const [activeView,   setActiveView]   = useState("overview"); // "overview"|"half1"|"half2"
  const [confirmDelId, setConfirmDelId] = useState(null);
  const [modal,        setModal]        = useState(null);
  const [editingExp,   setEditingExp]   = useState(null);
  const [pmtExp,       setPmtExp]       = useState(null);  // expense being edited for payments
  const [toast,        setToast]        = useState(null);
  const [prevMonthCoModal, setPrevMonthCoModal] = useState(null);

  const toast$ = useCallback((msg)=>fireToast(msg,setToast),[]);
  const active  = months.find(m=>m.id===activeId);

  const switchMonth = (id)=>{ setActiveId(id); setActiveView("overview"); setConfirmDelId(null); };

  const addMonth = (mo,yr)=>{
    const label=`${mo} ${yr}`;
    if (months.find(m=>m.label===label)){toast$("Month already exists!");return;}
    const num=String(MONTH_NAMES.indexOf(mo)+1).padStart(2,"0");
    const id=newMid();
    setMonths(prev=>[...prev,{id,label,num,year:yr,half1SalaryDate:"25th",half2SalaryDate:"30th",sources:[],expenses:[]}]);
    setActiveId(id); setActiveView("overview"); setModal(null);
    toast$(`${label} added`);
  };

  // salary now derived from sources

  const saveExpense = (data)=>{
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      const exists = m.expenses.find(e=>e.id===data.id);
      const expenses = exists ? m.expenses.map(e=>e.id===data.id?data:e) : [...m.expenses,data];
      return {...m,expenses};
    }));
    toast$(modal==="edit"?`"${data.name}" updated`:`"${data.name}" added`);
    setModal(null); setEditingExp(null);
  };

  // Cycle: unpaid → paid (quick-pay), paid → unpaid (remove quick-pays)
  const cycleStatus = (id)=>{
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      return {...m, expenses: m.expenses.map(e=>{
        if (e.id!==id) return e;
        const cur = expStatus(e);
        if (cur==="paid") {
          return {...e, payments: e.payments.filter(p=>p.sourceId!=="quick")};
        } else {
          const alreadyPaid = expPaid(e);
          const needed = expTotal(e) - alreadyPaid;
          if (needed<=0) return e;
          const pmts = [...e.payments, {
            id:newPid(), date:new Date().toISOString().slice(0,10),
            amount:needed, sourceId:"quick", note:"Quick mark paid"
          }];
          return {...e, payments:pmts};
        }
      })};
    }));
  };

  const deleteExpense = (id)=>{
    const name=active.expenses.find(e=>e.id===id)?.name;
    setMonths(prev=>prev.map(m=>m.id===activeId?{...m,expenses:m.expenses.filter(e=>e.id!==id)}:m));
    setConfirmDelId(null);
    toast$(`"${name}" removed`);
  };

  const savePayments = (expId, newPayments) => {
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      return {...m, expenses:m.expenses.map(e=>e.id===expId?{...e,payments:newPayments}:e)};
    }));
    setPmtExp(null);
    toast$("Payments saved");
  };

  const addSource = (src) => {
    setMonths(prev=>prev.map(m=>m.id===activeId?{...m,sources:[...(m.sources||[]),src]}:m));
    setModal(null);
    toast$(`Source "${src.name}" added`);
  };

  const deleteSource = (srcId) => {
    setMonths(prev=>prev.map(m=>m.id===activeId?{...m,sources:(m.sources||[]).filter(s=>s.id!==srcId)}:m));
    toast$("Source removed");
  };

  const saveCarryOver = (co) => {
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      const existing = (m.carryOvers||[]).find(c=>c.id===co.id);
      const carryOvers = existing
        ? (m.carryOvers||[]).map(c=>c.id===co.id?co:c)
        : [...(m.carryOvers||[]), co];
      return {...m, carryOvers};
    }));
    toast$("Carry-over source assigned");
  };

  const resolveCarryOver = (coId, mode) => {
    if (mode === "__delete__") {
      setMonths(prev=>prev.map(m=>{
        if (m.id!==activeId) return m;
        return {...m, carryOvers:(m.carryOvers||[]).filter(co=>co.id!==coId)};
      }));
      return;
    }
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      return {...m, carryOvers:(m.carryOvers||[]).map(co=>
        co.id===coId ? {...co, resolvedAt:new Date().toISOString().slice(0,10)} : co
      )};
    }));
    toast$("Carry-over marked resolved ✓");
  };

  const resolveAllCarryOvers = () => {
    const now = new Date().toISOString().slice(0,10);
    setMonths(prev=>prev.map(m=>{
      if (m.id!==activeId) return m;
      return {...m, carryOvers:(m.carryOvers||[]).map(co=>
        co.resolvedAt ? co : {...co, resolvedAt:now}
      )};
    }));
    toast$("All carry-overs resolved ✓");
  };

  // Detect if previous half/month had a deficit and propose a carry-over
  const detectAndProposeCarryOver = (targetMonthId) => {
    const sorted = [...months].sort((a,b)=>a.id-b.id);
    const idx = sorted.findIndex(m=>m.id===targetMonthId);
    if (idx <= 0) return null;
    const prev = sorted[idx-1];
    const prevH2exps = halfExpenses(prev.expenses,"half2");
    const prevH2tot  = prevH2exps.reduce((a,e)=>a+expTotal(e),0);
    const prevH2sal  = sourcesTotal(prev.sources||[],"half2");
    const prevH2def  = prevH2sal - prevH2tot;
    if (prevH2def < 0) return { amount:Math.abs(prevH2def), fromLabel:`2nd Half · ${prev.label}`, from:"prev_month" };
    return null;
  };

  // topbar badge — combined
  const allExp  = active.expenses;
  const totalAll = allExp.reduce((a,e)=>a+expTotal(e),0);
  const availAll = sourcesTotalAll(active.sources||[]);
  const excessAll= availAll-totalAll;
  const overAll  = excessAll<0;

  const openEdit     = (e) => { setEditingExp(e); setModal("edit"); };
  const openAdd      = () => { setEditingExp(null); setModal("add"); };
  const openPayments = (e) => { setPmtExp(e); };

  return (
    <>
      <style>{G}</style>
      <div className="fb-shell">

        {/* TOPBAR */}
        <div className="fb-topbar">
          <div className="fb-logo-wrap">
            <div className="fb-logo-icon">₱</div>
            <span className="fb-logo-name">FamilyBudget</span>
            <span className="fb-logo-sub">/ Tracker</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span className="fb-badge">2026</span>
            <span className={`fb-badge ${overAll?"red":"green"}`}>{overAll?`Deficit ${fmt(Math.abs(excessAll))}`:  `Surplus ${fmt(excessAll)}`}</span>
            <span className="fb-badge green">{active.label.split(" ")[0]} Active</span>
          </div>
        </div>

        <div className="fb-main">
          {/* SIDEBAR */}
          <div className={`fb-sidebar${sidebarOpen?"":" collapsed"}`}>
            <div className="fb-sidebar-toggle">
              <span className="fb-sidebar-toggle-lbl">Monthly Sheets</span>
              <button className="fb-collapse-btn" onClick={()=>setSidebarOpen(o=>!o)}>{sidebarOpen?"‹":"›"}</button>
            </div>
            <div className="fb-sidebar-scroll">
              {months.map(m=>(
                <div key={m.id} className={`fb-month-item${m.id===activeId?" active":""}`} onClick={()=>switchMonth(m.id)}>
                  <div className="fb-month-icon">{m.num}</div>
                  <div className="fb-month-info">
                    <div className="fb-month-name">{m.label}</div>
                    <div className="fb-month-sub">{m.num} · {m.year}</div>
                  </div>
                  <span className="fb-month-users">👥</span>
                  <span className="fb-tooltip">{m.label}</span>
                </div>
              ))}
              <div className="fb-divider" />
              <button className="fb-add-month-btn" onClick={()=>setModal("addMonth")}>
                <div className="fb-add-month-icon">+</div>
                <span className="fb-add-month-lbl">Add Month</span>
              </button>
            </div>
          </div>

          {/* CONTENT */}
          <div className="fb-content">
            <div className="fb-page-header">
              <div>
                <div className="fb-eyebrow">Monthly Budget</div>
                <div className="fb-page-title">{active.label}</div>
              </div>
              <div className="fb-header-actions">
                <button className="fb-btn fb-btn-outline" onClick={()=>toast$("Export coming soon!")}>↓ Export</button>
                <button className="fb-btn fb-btn-ink" onClick={openAdd}>+ Add Expense</button>
              </div>
            </div>

            {/* SEGMENTED CONTROL */}
            <div className="fb-seg-wrap">
              <div className="fb-seg">
                {[
                  {key:"overview", label:"Overview",  dot:"var(--ink)",    salary:"full month"},
                  {key:"half1",    label:"1st Half",   dot:"#1d4ed8",      salary:`1–15 · salary ${active.half1SalaryDate}`},
                  {key:"half2",    label:"2nd Half",   dot:"var(--ink-3)", salary:`16–end · salary ${active.half2SalaryDate}`},
                  {key:"stats",    label:"Statistics", dot:"#7c3aed",      salary:"charts & breakdown"},
                ].map(s=>(
                  <button key={s.key} className={`fb-seg-btn${activeView===s.key?" active":""}`}
                    onClick={()=>{setActiveView(s.key);setConfirmDelId(null);}}>
                    <div className="fb-seg-dot" style={{background:activeView===s.key?s.dot:"var(--ink-5)"}} />
                    {s.label}
                    {activeView===s.key && <span className="fb-seg-salary">{s.salary}</span>}
                  </button>
                ))}
              </div>
            </div>

            {/* VIEWS */}
            {activeView==="overview" && (
              <OverviewView
                month={active}
                months={months}
                onEdit={openEdit} onDelete={deleteExpense}
                confirmDelId={confirmDelId} setConfirmDelId={setConfirmDelId}
                onCycleStatus={cycleStatus}
                onPayments={openPayments}
                onAddSource={()=>setModal("addSource")}
                onDeleteSource={deleteSource}
                onSaveCarryOver={saveCarryOver}
                onResolveCarryOver={resolveCarryOver}
                onResolveAllCarryOvers={resolveAllCarryOvers}
                onNavigateView={setActiveView}
              />
            )}
            {(activeView==="half1"||activeView==="half2") && (
              <HalfView
                key={activeView}
                month={active} halfKey={activeView}
                onEdit={openEdit} onDelete={deleteExpense}
                confirmDelId={confirmDelId} setConfirmDelId={setConfirmDelId}
                onCycleStatus={cycleStatus}
                onUpdateSalary={null}
                onAddExpense={openAdd}
                onPayments={openPayments}
                onResolveCarryOver={resolveCarryOver}
                onResolveAllCarryOvers={resolveAllCarryOvers}
              />
            )}
            {activeView==="stats" && (
              <StatisticsView month={active} />
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      {(modal==="add"||modal==="edit")&&(
        <ExpenseModal
          expense={modal==="edit"?editingExp:null}
          defaultCategory="Bills"
          sources={active.sources||[]}
          allExpenses={active.expenses||[]}
          onClose={()=>{setModal(null);setEditingExp(null);}}
          onSave={saveExpense}
        />
      )}
      {modal==="addMonth"&&<AddMonthModal onClose={()=>setModal(null)} onSave={addMonth} />}
      {modal==="addSource"&&<AddSourceModal onClose={()=>setModal(null)} onSave={addSource} />}
      {pmtExp&&(
        <PaymentsModal
          expense={pmtExp}
          sources={(active.sources||[]).filter(s=>s.balance>0||sourceSpent(active.expenses||[],s.id)>0||true)}
          allExpenses={active.expenses||[]}
          onClose={()=>setPmtExp(null)}
          onSave={(newPayments)=>savePayments(pmtExp.id, newPayments)}
        />
      )}
      {toast&&<div className="fb-toast">{toast}</div>}
    </>
  );
}
