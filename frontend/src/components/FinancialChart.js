import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend, Line, LineChart,
         ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { PanelHeader, EmptyState } from "@/components/common/UI";

const FILTERS = [
  { id: "3m", label: "3M",  months: 3 },
  { id: "6m", label: "6M",  months: 6 },
  { id: "1y", label: "1Y",  months: 12 },
  { id: "all", label: "Sim", months: 999 },
];

function fmtCurrency(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1_000_000) return `$${(v/1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000)     return `$${(v/1_000).toFixed(1)}k`;
  return `$${Math.round(v).toLocaleString()}`;
}

export default function FinancialChart({ data }) {
  const [filter, setFilter] = useState("all");

  const filtered = useMemo(() => {
    if (!data) return [];
    const months = FILTERS.find(f => f.id === filter)?.months ?? 12;
    return data.slice(-months);
  }, [data, filter]);

  const latest = filtered[filtered.length - 1];
  const first = filtered[0];
  const cashDelta = latest && first ? ((latest.cash - first.cash) / Math.max(first.cash, 1)) * 100 : 0;

  return (
    <div className="glass flex flex-col h-full min-h-[420px]" data-testid="financial-chart">
      <PanelHeader
        title="Financial Projection"
        subtitle="Cash + Revenue · forecast based on stochastic monthly growth"
        right={
          <div className="flex items-center gap-3">
            <div className="chip chip-info">
              <TrendingUp size={11} /> {cashDelta.toFixed(1)}% cash Δ
            </div>
            <div className="flex border rounded-md overflow-hidden"
                 style={{ borderColor: "var(--border-strong)" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id} data-testid={`chart-filter-${f.id}`}
                  onClick={() => setFilter(f.id)}
                  className="px-2.5 py-1 text-[10.5px] font-mono uppercase tracking-wider"
                  style={{
                    background: filter === f.id ? "rgba(255,255,255,0.08)" : "transparent",
                    color: filter === f.id ? "var(--text)" : "var(--text-3)",
                    borderRight: "1px solid var(--border-strong)",
                  }}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        }
      />

      <div className="flex-1 px-2 py-3">
        {!data || data.length === 0 ? (
          <EmptyState
            icon={TrendingUp}
            title="No projection yet"
            hint="Run a simulation to forecast cash, revenue and runway over the next 18 months."
          />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
              <defs>
                <linearGradient id="g-cash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5B8DEF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#5B8DEF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="g-rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34D399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34D399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="0" />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.35)"
                     tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <YAxis stroke="rgba(255,255,255,0.35)"
                     tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                     tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{
                  background: "rgba(11,11,16,0.95)", border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 8, fontFamily: "JetBrains Mono", fontSize: 11, color: "#fff",
                  padding: "8px 12px",
                }}
                formatter={(v, n) => [fmtCurrency(v), n.toUpperCase()]}
                labelFormatter={(l) => `Month ${l}`}
              />
              <Legend wrapperStyle={{ fontFamily: "JetBrains Mono", fontSize: 10, paddingTop: 4 }}
                      iconType="line" />
              <Area type="monotone" dataKey="cash"    stroke="#5B8DEF" strokeWidth={1.6} fill="url(#g-cash)" isAnimationActive />
              <Area type="monotone" dataKey="revenue" stroke="#34D399" strokeWidth={1.6} fill="url(#g-rev)"  isAnimationActive />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
