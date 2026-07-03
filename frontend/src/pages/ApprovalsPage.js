import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import Topbar from "@/components/Topbar";
import { PanelHeader, EmptyState } from "@/components/common/UI";

const STATUS_TONE = {
  pending:  { chip: "chip-warning", label: "PENDING" },
  approved: { chip: "chip-success", label: "APPROVED" },
  rejected: { chip: "chip-danger",  label: "REJECTED" },
};

export default function ApprovalsPage() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setItems(await api.listApprovals(filter)); }
    finally { setLoading(false); }
  }, [filter]);
  useEffect(() => { refresh(); }, [refresh]);

  const decide = async (id, d) => {
    await api.decideApproval(id, d);
    refresh();
  };

  return (
    <>
      <Topbar title="Approvals" subtitle={`${items.length} ${filter} · across all simulations`}
        right={
          <div className="flex border rounded-md overflow-hidden" style={{ borderColor: "var(--border-strong)" }}>
            {["pending", "approved", "rejected"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider"
                data-testid={`approval-filter-${s}`}
                style={{
                  background: filter === s ? "rgba(255,255,255,0.08)" : "transparent",
                  color: filter === s ? "var(--text)" : "var(--text-3)",
                  borderRight: "1px solid var(--border-strong)",
                }}>
                {s}
              </button>
            ))}
          </div>
        }
      />

      <div className="glass">
        <PanelHeader title="All Approvals" subtitle="Manage HITL decisions across the workspace" />
        {loading && <div className="p-6 label-mono">Loading…</div>}
        {!loading && items.length === 0 && (
          <EmptyState icon={ClipboardCheck} title={`No ${filter} approvals`} hint="When agents propose actions, they land here." />
        )}
        {!loading && items.length > 0 && (
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {items.map((a) => {
              const tone = STATUS_TONE[a.status];
              return (
                <div key={a.id} className="px-5 py-3 grid grid-cols-12 gap-3 items-center"
                     style={{ borderTop: "1px solid var(--border)" }} data-testid={`approval-row-${a.id}`}>
                  <div className="col-span-2 font-mono text-[11px]" style={{ color: "var(--text-3)" }}>
                    {new Date(a.created_at).toISOString().slice(5, 16).replace("T", " ")}
                  </div>
                  <div className="col-span-2 text-[12.5px]">{a.agent_role}</div>
                  <div className="col-span-5 text-[12.5px] truncate" style={{ color: "var(--text-2)" }}>{a.summary}</div>
                  <div className="col-span-1"><span className={`chip ${tone.chip}`}>{tone.label}</span></div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    {a.status === "pending" && (
                      <>
                        <button onClick={() => decide(a.id, "approved")} className="btn-primary btn"><Check size={12} /></button>
                        <button onClick={() => decide(a.id, "rejected")} className="btn btn-danger"><X size={12} /></button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
