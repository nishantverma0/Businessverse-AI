import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppShell from "@/components/AppShell";
import Dashboard from "@/pages/Dashboard";
import CompaniesPage from "@/pages/CompaniesPage";
import AgentsPage from "@/pages/AgentsPage";
import SimulationsPage from "@/pages/SimulationsPage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import MemoryPage from "@/pages/MemoryPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import SettingsPage from "@/pages/SettingsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/companies" element={<CompaniesPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/simulations" element={<SimulationsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/memory" element={<MemoryPage />} />
          <Route path="/approvals" element={<ApprovalsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
