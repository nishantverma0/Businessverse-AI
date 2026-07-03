import { useEffect, useState } from "react";
import { FlaskConical, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import Topbar from "@/components/Topbar";
import { PanelHeader, EmptyState } from "@/components/common/UI";

const STATUS_TONE = {
  running:   { chip: "chip-success", label: "RUNNING" },
  completed: { chip: "chip-info",    label: "COMPLETED" },
  failed:    { chip: "chip-danger",  label: "FAILED" },
};

export default function SimulationsPage() {
  const { companyId, setSimId } = useAppStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  const loadSimulations = async () => {
    setLoading(true);

    try {
      const res = await api.listSimulations(companyId || undefined);

      console.log("Simulations API:", res);

      const data = Array.isArray(res)
        ? res
        : res?.simulations ||
          res?.items ||
          res?.data ||
          [];

      setItems(data);
    } catch (err) {
      console.error("Failed to load simulations:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  loadSimulations();
}, [companyId]);

  return (
    <>
      <Topbar title="Simulations" subtitle={`${Array.isArray(items) ? items.length : 0} total · ${companyId ? "scoped to selected company" : "all companies"}`} />
      <div className="glass">
        <PanelHeader title="History" subtitle="Click a row to view that simulation's data on the Dashboard" />
        {loading && <div className="p-6 label-mono">Loading…</div>}
        {!loading && (Array.isArray(items) ? items.length : 0) === 0 && (
          <EmptyState icon={FlaskConical} title="No simulations yet"
            hint="Pick a company and run a mandate from the Dashboard." />
        )}
        {!loading && items.length > 0 && (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {items.map((s) => {
              const tone = STATUS_TONE[s.status] || STATUS_TONE.completed;
              return (
                <button
                  key={s.id}
                  onClick={() => setSimId(s.id)}
                  className="w-full text-left px-5 py-3 grid grid-cols-12 gap-3 hover:bg-white/5 transition-colors"
                  style={{ borderTop: "1px solid var(--border)" }}
                  data-testid={`sim-row-${s.id}`}
                >
                  <div className="col-span-3 flex items-center gap-2">
                    <Clock size={12} style={{ color: "var(--text-3)" }} />
                    <span className="font-mono text-[11px]" style={{ color: "var(--text-3)" }}>
                      {new Date(s.created_at).toISOString().slice(5, 16).replace("T", " ")}
                    </span>
                  </div>
                  <div className="col-span-7 text-[13px] truncate">{s.goal}</div>
                  <div className="col-span-2 text-right">
                    <span className={`chip ${tone.chip}`}>{tone.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
