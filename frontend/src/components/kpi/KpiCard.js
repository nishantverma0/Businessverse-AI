import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Banknote, Flame, Timer,
  Users, Repeat, BarChart3, Target, Layers, Activity,
} from "lucide-react";
import { Skeleton, itemVariants } from "@/components/common/UI";

const ICONS = {
  revenue_mo: DollarSign, cash: Banknote, burn: Flame, runway_months: Timer,
  customers: Users, mrr: Repeat, arr: BarChart3, conversion: Target, cac: Layers, ltv: Activity,
};

/** Smoothly animated counter for numbers / currency */
function useAnimatedNumber(target, duration = 700) {
  const [v, setV] = useState(0);
  const fromRef = useRef(0);
  const tsRef = useRef(0);
  useEffect(() => {
    if (target == null) { setV(null); return; }
    const start = performance.now();
    fromRef.current = v ?? 0;
    tsRef.current = start;
    let raf;
    const tick = (t) => {
      const k = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(fromRef.current + (target - fromRef.current) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return v;
}

function fmt(v, fmtKey) {
  if (v == null || Number.isNaN(v)) return "—";
  if (fmtKey === "currency") {
    if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(2)}M`;
    if (v >= 1_000)     return `$${(v/1_000).toFixed(1)}k`;
    return `$${Math.round(v).toLocaleString()}`;
  }
  if (fmtKey === "months")  return `${Math.round(v)} mo`;
  if (fmtKey === "percent") return `${v.toFixed(1)}%`;
  if (fmtKey === "int")     return Math.round(v).toLocaleString();
  return v;
}

function Spark({ data, color, neg }) {
  if (!data || data.length === 0) return <div className="h-8" />;
  return (
    <div className="h-8">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 4, bottom: 4, left: 0, right: 0 }}>
          <Line type="monotone" dataKey="v" stroke={neg ? "#F87171" : color} strokeWidth={1.4} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({ k, value, label, fmtKey, trend, spark, sparkColor = "#5B8DEF", tone, hint }) {
  const Icon = ICONS[k] || DollarSign;
  const animated = useAnimatedNumber(value);
  const trendUp = trend != null && trend >= 0;
  const trendCritical = tone === "danger" || (k === "burn" && value);

  const toneColor = {
    success: "var(--success)", warning: "var(--warning)", danger: "var(--danger)",
    info:    "var(--info)",
  }[tone] || "var(--text)";

  return (
    <motion.div
      variants={itemVariants}
      data-testid={`kpi-${k}`}
      className="glass p-4 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md grid place-items-center"
               style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)" }}>
            <Icon size={13} color={toneColor} strokeWidth={1.6} />
          </div>
          <div className="label-mono">{label}</div>
        </div>
        {trend != null && (
          <div className="chip" style={{
            color: trendUp && !trendCritical ? "var(--success)" : "var(--danger)",
            borderColor: trendUp && !trendCritical ? "rgba(52,211,153,0.35)" : "rgba(248,113,113,0.35)",
            background:  trendUp && !trendCritical ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)",
            fontSize: 10,
          }}>
            {trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </div>
      <div className="mt-3 font-display text-[28px] font-medium tracking-tight" style={{ color: toneColor }}>
        {value == null ? <Skeleton className="h-7 w-24" /> : fmt(animated ?? 0, fmtKey)}
      </div>
      {hint && <div className="font-mono text-[10.5px] mt-1" style={{ color: "var(--text-3)" }}>{hint}</div>}
      <div className="mt-2">
        <Spark data={spark} color={sparkColor} neg={trendCritical && !trendUp} />
      </div>
    </motion.div>
  );
}
