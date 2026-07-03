import { NavLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard, Building2, Users, FlaskConical, BarChart3,
  Database, ClipboardCheck, Settings, Search, Plus, Sparkles,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";

const NAV = [
  { to: "/",            label: "Dashboard",   icon: LayoutDashboard },
  { to: "/companies",   label: "Companies",   icon: Building2 },
  { to: "/agents",      label: "Agents",      icon: Users },
  { to: "/simulations", label: "Simulations", icon: FlaskConical },
  { to: "/analytics",   label: "Analytics",   icon: BarChart3 },
  { to: "/memory",      label: "Memory",      icon: Database },
  { to: "/approvals",   label: "Approvals",   icon: ClipboardCheck },
  { to: "/settings",    label: "Settings",    icon: Settings },
];

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink to={to} end={to === "/"} data-testid={`nav-${label.toLowerCase()}`}>
      {({ isActive }) => (
        <div className="relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors"
             style={{
               color: isActive ? "var(--text)" : "var(--text-2)",
               background: isActive ? "rgba(255,255,255,0.05)" : "transparent",
             }}>
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r"
              style={{ background: "linear-gradient(180deg, #5B8DEF, #8B5CF6)" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            />
          )}
          <Icon size={16} strokeWidth={1.5} />
          <span className="font-medium">{label}</span>
        </div>
      )}
    </NavLink>
  );
}

function CompanySwitcher() {
  const navigate = useNavigate();
  const { companyId, setCompanyId } = useAppStore();
  const [companies, setCompanies] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
  setLoading(true);

  try {
    const res = await api.listCompanies();

    console.log("Companies API:", res);

    const companiesData = Array.isArray(res)
      ? res
      : Array.isArray(res?.companies)
      ? res.companies
      : Array.isArray(res?.data)
      ? res.data
      : [];

    setCompanies(companiesData);
  } catch (err) {
    console.error(err);
    setCompanies([]);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  refresh();
}, []);

const filtered = useMemo(() => {
  if (!Array.isArray(companies)) return [];

  if (!q.trim()) return companies;

  const t = q.toLowerCase();

  return companies.filter((c) =>
    (c?.name || "").toLowerCase().includes(t) ||
    (c?.industry || "").toLowerCase().includes(t)
  );
}, [companies, q]);

const current = Array.isArray(companies)
  ? companies.find((c) => c.id === companyId)
  : null;
  
  return (
    <div className="flex flex-col gap-3">
      <div className="px-1">
        <div className="label-mono mb-1.5">Company</div>
        <div className="flex items-center gap-2 p-2 rounded-md"
             style={{ border: "1px solid var(--border)", background: "rgba(255,255,255,0.03)" }}>
          <div className="w-7 h-7 rounded-md grid place-items-center font-display font-bold text-sm"
               style={{ background: "linear-gradient(135deg,#5B8DEF,#8B5CF6)", color: "#0a0a0f" }}>
            {current ? current.name.slice(0,1).toUpperCase() : "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: "var(--text)" }}>
              {current ? current.name : "No company selected"}
            </div>
            <div className="font-mono text-[10px]" style={{ color: "var(--text-3)" }}>
              {current ? `${current.industry} · ${current.stage}` : "Create or select →"}
            </div>
          </div>
        </div>
      </div>

      <div className="px-1">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
          <input
            data-testid="company-search"
            value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search companies"
            className="input pl-8 text-[12.5px]"
          />
        </div>
      </div>

      <div className="flex flex-col gap-0.5 max-h-44 overflow-auto px-1" data-testid="company-list">
        {loading && <div className="px-2 py-1 label-mono">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="px-2 py-1 label-mono">No matches</div>
        )}
        {filtered.map((c) => {
  const active = c.id === companyId;

  return (
    <button
      key={c.id}
      onClick={() => {
        setCompanyId(c.id);
        navigate("/");
      }}
      className="text-left px-2 py-1.5 rounded-md flex items-center gap-2"
    >
      <div className="w-5 h-5 rounded grid place-items-center text-[10px] font-bold">
        {(c.name || "?").slice(0, 1).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="truncate">
          {c.name || "Unnamed Company"}
        </div>
      </div>

      {active && <div className="dot dot-success" />}
    </button>
  );
})}
      </div>

      <button
        data-testid="sidebar-create-company"
        onClick={() => navigate("/companies?new=1")}
        className="btn justify-center mx-1"
        style={{ fontSize: 12 }}
      >
        <Plus size={13} /> New company
      </button>
    </div>
  );
}

export default function Sidebar() {
  return (
    <aside
      data-testid="sidebar"
      className="w-64 fixed left-0 top-0 h-screen flex flex-col gap-5 py-5 px-3 z-20"
      style={{ borderRight: "1px solid var(--border)", background: "rgba(7,7,10,0.85)", backdropFilter: "blur(14px)" }}
    >
      <div className="flex items-center gap-2 px-2">
        <div className="w-8 h-8 rounded-lg grid place-items-center"
             style={{ background: "linear-gradient(135deg,#5B8DEF,#8B5CF6)" }}>
          <Sparkles size={16} color="#0a0a0f" strokeWidth={2.4} />
        </div>
        <div>
          <div className="font-display text-[15px] font-bold leading-none">BusinessVerse</div>
          <div className="font-mono text-[9.5px] mt-1" style={{ color: "var(--text-3)" }}>
            BOARDROOM · v1.0
          </div>
        </div>
      </div>

      <CompanySwitcher />

      <div className="flex flex-col gap-0.5 px-1 mt-1">
        <div className="label-mono px-2 mb-1">Navigate</div>
        {NAV.map((n) => <NavItem key={n.to} {...n} />)}
      </div>

      <div className="mt-auto px-2">
        <div className="p-3 rounded-md text-[11.5px] leading-relaxed"
             style={{ border: "1px solid var(--border)", background: "rgba(91,141,239,0.06)", color: "var(--text-2)" }}>
          <div className="font-medium mb-1" style={{ color: "var(--text)" }}>
            <Sparkles size={11} className="inline mr-1" /> Live agents
          </div>
          CEO + 5 dept-heads running on Claude Sonnet 4.5. Token streaming + HITL approvals enabled.
        </div>
      </div>
    </aside>
  );
}
