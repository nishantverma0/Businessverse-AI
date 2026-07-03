import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
         ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, CheckCircle2, XCircle, Hash, Cpu, Sparkles, Clock } from "lucide-react";
import { api } from "@/lib/api";
import Topbar from "@/components/Topbar";
import { PanelHeader, Skeleton } from "@/components/common/UI";

const AGENT_COLORS = { ceo: "#FFFFFF", product: "#5B8DEF", marketing: "#F87171",
                       sales: "#34D399", finance: "#FBBF24", research: "#A78BFA" };

function StatCard({ icon: Icon, label, value, hint, tone = "var(--text)", mocked }) {
  return (
    <div className="glass p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={13} color={tone} />
          <div className="label-mono">{label}</div>
        </div>
        {mocked && <span className="chip" style={{ color: "var(--warning)", borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.08)", fontSize: 9 }}>MOCKED</span>}
      </div>
      <div className="font-display text-[24px] font-medium tracking-tight mt-2" style={{ color: tone }}>
        {value}
      </div>
      {hint && <div className="font-mono text-[10.5px] mt-1" style={{ color: "var(--text-3)" }}>{hint}</div>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState(null);

useEffect(() => {
  const loadAnalytics = async () => {
    try {
      const res = await api.analyticsOverview();

      console.log("Analytics API:", res);

      const analytics =
        res?.data ??
        res?.analytics ??
        res;

      setData(analytics);
    } catch (err) {
      console.error("Analytics load failed:", err);

      setData({
        totals: {
          simulations: 0,
          approved: 0,
          rejected: 0,
          pending: 0,
          events: 0,
        },
        success_rate_pct: 0,
        approval_ratio_pct: 0,
        avg_latency_ms_mock: 0,
        token_usage_mock: 0,
        cost_usd_mock: 0,
        by_agent: [],
      });
    }
  };

  loadAnalytics();
}, []);

  if (!data) {
    return (
      <>
        <Topbar title="Analytics" subtitle="Loading workspace metrics…" />
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass p-4"><Skeleton className="h-20" /></div>
          ))}
        </div>
      </>
    );
  }

  const t = data?.totals ?? {
  simulations: 0,
  approved: 0,
  rejected: 0,
  pending: 0,
  events: 0,
};
  const pieData = [
    { name: "Approved", value: t.approved, color: "#34D399" },
    { name: "Rejected", value: t.rejected, color: "#F87171" },
    { name: "Pending",  value: t.pending,  color: "#FBBF24" },
  ];
  const agentData = (Array.isArray(data?.by_agent) ? data.by_agent : []).map(a => ({
  ...a,
  color: AGENT_COLORS[a.agent] || "#888",
}));

  return (
    <>
      <Topbar title="Analytics" subtitle="Workspace-wide agent + simulation metrics" />
      <div className="flex flex-col gap-4">

        <div className="grid md:grid-cols-4 gap-4">
          <StatCard icon={Hash}         label="Simulations"   value={t.simulations} hint={`${data.success_rate_pct}% complete`} />
          <StatCard icon={CheckCircle2} label="Approved"      value={t.approved}    tone="var(--success)" />
          <StatCard icon={XCircle}      label="Rejected"      value={t.rejected}    tone="var(--danger)" />
          <StatCard icon={Sparkles}     label="Approval rate" value={`${data.approval_ratio_pct}%`} tone="var(--info)" />
          <StatCard icon={BarChart3}    label="Total events"  value={t.events} />
          <StatCard icon={Clock}        label="Avg latency"   value={`${data?.avg_latency_ms_mock ?? 0}ms`} mocked />
          <StatCard icon={Cpu}          label="Token usage"   value={(data?.token_usage_mock ?? 0).toLocaleString()} mocked />
          <StatCard icon={Hash}         label="Cost (est)"    value={`$${(data?.cost_usd_mock ?? 0).toFixed(2)}`} mocked />
        </div>

        <div className="grid xl:grid-cols-2 gap-4">
          <div className="glass">
            <PanelHeader title="Executions by agent" subtitle="Count of completed agent.message events" />
            <div className="h-72 p-3">
              <ResponsiveContainer>
                <BarChart data={agentData} margin={{ top: 10, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="agent" stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
                  <YAxis stroke="rgba(255,255,255,0.35)" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: "#0B0B10", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {agentData.map((a, i) => <Cell key={i} fill={a.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass">
            <PanelHeader title="Approval outcomes" subtitle="All approvals across the workspace" />
            <div className="h-72 p-3">
              <ResponsiveContainer>
                <PieChart>
                  <Tooltip contentStyle={{ background: "#0B0B10", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11 }} />
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={86} paddingAngle={2}>
                    {pieData.map((p, i) => <Cell key={i} fill={p.color} stroke="#0B0B10" />)}
                  </Pie>
                  <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
