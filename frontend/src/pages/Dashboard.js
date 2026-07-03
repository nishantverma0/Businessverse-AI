import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Play, Loader2, Building2, Target, ArrowRight } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { api, streamSimulation } from "@/lib/api";
import Topbar from "@/components/Topbar";
import KpiRow from "@/components/kpi/KpiRow";
import AgentGraph from "@/components/AgentGraph";
import EventTimeline from "@/components/EventTimeline";
import FinancialChart from "@/components/FinancialChart";
import ApprovalQueue from "@/components/ApprovalQueue";
import { PanelHeader, EmptyState, Skeleton } from "@/components/common/UI";

const PROMPTS = [
  "Launch an enterprise tier targeting Series B SaaS",
  "Expand into EU and hit €1M ARR within 12 months",
  "Reduce CAC by 30% while maintaining growth",
  "Ship an AI co-pilot to lift activation by 40%",
];

export default function Dashboard() {
  const { companyId, simId, setSimId, status } = useAppStore();
  const [company, setCompany] = useState(null);
  const [goal, setGoal] = useState(PROMPTS[0]);
  const [kpis, setKpis] = useState(null);
  const [projection, setProjection] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!companyId) { setCompany(null); return; }
    api.getCompany(companyId).then(setCompany).catch(() => setCompany(null));
  }, [companyId]);

  // KPIs/Projection on sim change + when sim completes
  useEffect(() => {
    if (!simId) { setKpis(null); setProjection([]); return; }
    let cancel = false;
    const fetchData = async () => {
  try {
    const [k, p] = await Promise.all([
      api.getKpis(simId),
      api.getProjection(simId),
    ]);

    if (!cancel) {
      setKpis(k ?? {});
      setProjection(Array.isArray(p) ? p : []);
    }
  } catch (err) {
    console.error("Dashboard load failed:", err);

    if (!cancel) {
      setKpis({});
      setProjection([]);
    }
  }
};
    fetchData();
    return () => { cancel = true; };
  }, [simId, status]);

 const startSim = async () => {
  if (!companyId || !goal.trim() || busy) return;

  setBusy(true);

  try {
    const r = await api.startSimulation(companyId, goal.trim());

    console.log("Simulation Response:", r);

    const simulationId = r.simulation_id ?? r.id;

    if (!simulationId) {
      throw new Error("Simulation ID not returned from backend.");
    }

    setSimId(simulationId);
    const socket = streamSimulation(simulationId);

socket.onmessage = (event) => {

    const ev = JSON.parse(event.data);

    const store = useAppStore.getState();

    switch (ev.type) {

        case "start":
            store.appendStart(ev);
            store.setActiveAgent(ev.agent);
            break;

        case "delta":
            store.appendDelta(ev);
            break;

        case "end":
            store.appendEnd(ev);
            break;

        case "completed":
            store.setStatus("completed");
            socket.close();
            break;

        case "failed":
            store.setStatus("failed");
            socket.close();
            break;
    }

};
  } catch (err) {
    console.error("Failed to start simulation:", err);
  } finally {
    setBusy(false);
  }
};

  const subtitle = company
  ? `${company.industry ?? "-"} · ${company.stage ?? "-"} · cash $${
      Number(company.starting_cash ?? 0).toLocaleString()
    } · burn $${
      Number(company.monthly_burn ?? 0).toLocaleString()
    }/mo`
  : "Select or create a company to begin";

  return (
    <>
      <Topbar
        title={company?.name ?? "Boardroom"}
        subtitle={subtitle}
      />

      <motion.div
        initial="hidden" animate="show"
        variants={{ hidden:{}, show:{ transition: { staggerChildren: 0.06 } } }}
        className="flex flex-col gap-4"
      >
        {/* Hero / Mandate */}
        <motion.section
          variants={{ hidden:{ opacity:0, y:8 }, show:{ opacity:1, y:0 } }}
          className="glass-strong p-5 relative overflow-hidden"
          data-testid="mandate-card"
        >
          <div className="absolute inset-0 pointer-events-none opacity-50"
               style={{ background: "radial-gradient(600px 200px at 10% 0%, rgba(91,141,239,0.15), transparent 60%)" }} />
          {!company ? (
            <EmptyState icon={Building2} title="No company selected"
              hint="Pick or create a company in the sidebar to mandate a strategic goal." />
          ) : (
            <div className="flex flex-col gap-4 relative">
              <div className="flex items-center gap-2">
                <Target size={14} color="#5B8DEF" />
                <div className="label-mono">Strategic Mandate</div>
              </div>
              <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <input
                  data-testid="goal-input"
                  value={goal} onChange={(e) => setGoal(e.target.value)}
                  placeholder="Describe what the agents should plan for…"
                  className="input flex-1 text-[14px] py-3"
                />
                <button
                  data-testid="start-sim-button"
                  disabled={!companyId || busy}
                  onClick={startSim}
                  className="btn-primary btn px-5 py-3 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: 13 }}
                >
                  {busy ? <Loader2 className="animate-spin" size={14} /> : <Play size={13} />}
                  {busy ? "Launching" : status === "running" ? "Running…" : "Run Simulation"}
                  <ArrowRight size={13} />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="label-mono mr-1 self-center">Suggested ›</span>
                {PROMPTS.map((p) => (
                  <button key={p} onClick={() => setGoal(p)}
                          data-testid={`suggested-${p.slice(0,12)}`}
                          className="chip hover:bg-white/5 transition-colors"
                          style={{ textTransform: "none", letterSpacing: "0.01em", fontWeight: 500 }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        {/* KPI Row */}
        {simId ? (
          <KpiRow
  kpis={kpis ?? {}}
  projection={Array.isArray(projection) ? projection : []}
/>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass p-4">
                <Skeleton className="h-3 w-16 mb-3" />
                <Skeleton className="h-7 w-24 mb-2" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* Bento grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
          <div className="xl:col-span-7 flex flex-col gap-4">
            <AgentGraph companyId={companyId} />
            <FinancialChart
            data={Array.isArray(projection) ? projection : []}
            />

          </div>
          <div className="xl:col-span-5 flex flex-col gap-4">
            <EventTimeline />
            <ApprovalQueue />
          </div>
        </div>
      </motion.div>
    </>
  );
}
