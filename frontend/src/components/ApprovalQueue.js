import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, ChevronDown, ChevronUp, ShieldAlert, Sparkles, MessageSquarePlus,
  AlertTriangle, Inbox,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PanelHeader, EmptyState } from "@/components/common/UI";

const RISK_BY_ROLE = {
  Product:   "Medium",
  Marketing: "Low",
  Sales:     "Low",
  Finance:   "High",
  Research:  "Low",
};

const RISK_TONE = {
  Low:      { color: "var(--success)", border: "rgba(52,211,153,0.35)", bg: "rgba(52,211,153,0.08)" },
  Medium:   { color: "var(--warning)", border: "rgba(251,191,36,0.35)", bg: "rgba(251,191,36,0.08)" },
  High:     { color: "var(--danger)",  border: "rgba(248,113,113,0.35)", bg: "rgba(248,113,113,0.10)" },
  Critical: { color: "#fff", border: "rgba(239,68,68,0.5)", bg: "rgba(239,68,68,0.15)" },
};

// Deterministic "metadata" so the panel feels realistic without mocked APIs:
function meta(approval) {
  const role = approval.agent_role;
  const risk = RISK_BY_ROLE[role] || "Medium";
  // Hash agent_id+role to a stable confidence/impact score
  let h = 0; const s = approval.id + role;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xfffffff;
  const confidence = 65 + (h % 30);                 // 65-94
  const roi = (((h >> 4) % 90) + 10) / 10;          // 1.0x - 9.9x
  return { risk, confidence, roi };
}

export default function ApprovalQueue() {
  const { simId, approvalsTick } = useAppStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const load = useCallback(async () => {
    if (!simId) { setItems([]); return; }
    setLoading(true);
    try {
      const all = await api.listApprovals("pending");
      setItems(all.filter((a) => a.simulation_id === simId));
    } finally { setLoading(false); }
  }, [simId]);

  useEffect(() => { load(); }, [load, approvalsTick]);

  const decide = async (id, decision) => {
    setItems((prev) => prev.filter((a) => a.id !== id));
    await api.decideApproval(id, decision);
    load();
  };

  const toggle = (id) => setExpanded((m) => ({ ...m, [id]: !m[id] }));

  return (
    <div className="glass flex flex-col h-full min-h-[420px]" data-testid="approval-queue">
      <PanelHeader
        title="Human in the Loop"
        subtitle="Approve / reject agent proposals · risk-scored"
        right={
          <div className="chip" style={{
            color: items.length ? "var(--warning)" : "var(--text-3)",
            borderColor: items.length ? "rgba(251,191,36,0.35)" : "var(--border-strong)",
            background:  items.length ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.03)",
          }}>
            <ShieldAlert size={11} /> {items.length} OPEN
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 flex flex-col gap-2.5">
        {!simId && (
          <EmptyState icon={Inbox} title="No active simulation"
            hint="Run a simulation to generate proposals for review." />
        )}
        {simId && loading && (
          <div className="label-mono px-2">Loading…</div>
        )}
        {simId && !loading && items.length === 0 && (
          <EmptyState icon={Check} title="Queue empty"
            hint="No outstanding approvals for this simulation." />
        )}

        <AnimatePresence initial={false}>
          {items.map((a) => {
            const m = meta(a);
            const tone = RISK_TONE[m.risk];
            const open = !!expanded[a.id];
            return (
              <motion.div
                key={a.id}
                layout
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="glass-soft p-3.5"
                data-testid={`approval-${a.id}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-md grid place-items-center text-[11px] font-bold font-display flex-shrink-0"
                         style={{ background: "rgba(255,255,255,0.06)", color: "var(--text)" }}>
                      {a.agent_role.slice(0,2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-[12.5px] font-medium" style={{ color: "var(--text)" }}>
                          {a.agent_role}
                        </div>
                        <span className="chip" style={{ color: tone.color, borderColor: tone.border, background: tone.bg, fontSize: 9.5 }}>
                          {m.risk === "High" || m.risk === "Critical"
                            ? <AlertTriangle size={10} /> : <Sparkles size={10} />}
                          {m.risk} risk
                        </span>
                        <span className="chip" style={{ fontSize: 9.5 }}>{m.confidence}% conf</span>
                        <span className="chip" style={{ fontSize: 9.5, color: "var(--info)", borderColor: "rgba(96,165,250,0.35)", background: "rgba(96,165,250,0.08)" }}>
                          ROI {m.roi.toFixed(1)}x
                        </span>
                      </div>
                      <p className="text-[12.5px] mt-1.5 leading-relaxed line-clamp-2"
                         style={{ color: "var(--text-2)" }}>
                        {a.summary}
                      </p>
                    </div>
                  </div>
                  <button onClick={() => toggle(a.id)}
                          className="btn-ghost btn flex-shrink-0" aria-label="Expand"
                          data-testid={`expand-${a.id}`}>
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>

                <AnimatePresence>
                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                      className="mt-3 overflow-hidden"
                    >
                      <div className="grid grid-cols-3 gap-2 mb-2">
                        <div className="glass-soft p-2"><div className="label-mono">Confidence</div>
                          <div className="text-[12.5px] mt-1">{m.confidence}%</div></div>
                        <div className="glass-soft p-2"><div className="label-mono">Expected ROI</div>
                          <div className="text-[12.5px] mt-1">{m.roi.toFixed(1)}x</div></div>
                        <div className="glass-soft p-2"><div className="label-mono">Business Impact</div>
                          <div className="text-[12.5px] mt-1">{m.risk === "High" ? "Material" : "Moderate"}</div></div>
                      </div>
                      <div className="glass-soft p-2.5">
                        <div className="label-mono mb-1">Reasoning</div>
                        <div className="text-[12.5px]" style={{ color: "var(--text-2)" }}>
                          {a.summary}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-2 mt-3">
                  <button data-testid={`approve-${a.id}`} onClick={() => decide(a.id, "approved")}
                    className="btn-primary btn flex-1 justify-center">
                    <Check size={13} /> Approve
                  </button>
                  <button data-testid={`reject-${a.id}`} onClick={() => decide(a.id, "rejected")}
                    className="btn btn-danger flex-1 justify-center">
                    <X size={13} /> Reject
                  </button>
                  <button data-testid={`revise-${a.id}`} disabled className="btn btn-ghost justify-center"
                          title="Coming soon">
                    <MessageSquarePlus size={13} /> Revise
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
