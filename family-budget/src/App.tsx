import { Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { OverviewPage } from "./routes/OverviewPage";
import { RecurringPage } from "./routes/RecurringPage";
import { StatisticsPage } from "./routes/StatisticsPage";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/month/2026-5/overview" replace />} />
        <Route path="/month/:yearMonth/overview" element={<OverviewPage />} />
        <Route path="/recurring" element={<RecurringPage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
      </Routes>
    </AppShell>
  );
}
