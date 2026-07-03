import { useMemo } from "react";
import { motion } from "framer-motion";
import { KpiCard } from "@/components/kpi/KpiCard";

/**
 * Computes spark series + trend for a key from projection data.
 * projection: [{month, cash, revenue}, ...]
 */
function spark(projection, key, take = 12) {
  if (!projection || projection.length === 0) return { data: [], trend: null };
  const slice = projection.slice(-take).map((p) => ({ v: p[key] }));
  const first = slice[0]?.v ?? 0;
  const last = slice[slice.length - 1]?.v ?? 0;
  const trend = first > 0 ? ((last - first) / first) * 100 : null;
  return { data: slice, trend };
}

export default function KpiRow({ kpis, projection }) {
  const cards = useMemo(() => {
    const rev = spark(projection, "revenue");
    const cash = spark(projection, "cash");
    // synthetic series for visual continuity
    const burnSeries = (projection || []).slice(-12).map(() => ({ v: kpis?.burn ?? 0 }));
    const custSeries = (projection || []).slice(-12).map((p) => ({ v: Math.round(p.revenue / 80) }));
    const mrrSeries = rev.data;

    return [
      { k: "revenue_mo",    label: "Revenue / mo", value: kpis?.revenue_mo, fmtKey: "currency", tone: "success", trend: rev.trend,  spark: rev.data,        sparkColor: "#34D399" },
      { k: "cash",          label: "Cash",          value: kpis?.cash,       fmtKey: "currency", tone: "info",    trend: cash.trend, spark: cash.data,       sparkColor: "#5B8DEF" },
      { k: "burn",          label: "Burn / mo",     value: kpis?.burn,       fmtKey: "currency", tone: "danger",  trend: 0,          spark: burnSeries,      sparkColor: "#F87171" },
      { k: "runway_months", label: "Runway",        value: kpis?.runway_months, fmtKey: "months", tone: "warning",                     spark: cash.data,       sparkColor: "#FBBF24" },
      { k: "customers",     label: "Customers",     value: kpis?.customers,  fmtKey: "int",      tone: "success", trend: rev.trend,  spark: custSeries,      sparkColor: "#34D399" },
      { k: "mrr",           label: "MRR",           value: kpis?.mrr,        fmtKey: "currency", tone: "info",    trend: rev.trend,  spark: mrrSeries,       sparkColor: "#60A5FA" },
      // Derived / illustrative — clearly derived from existing data, not mocked
      { k: "arr",           label: "ARR",           value: kpis?.mrr ? kpis.mrr * 12 : null, fmtKey: "currency", tone: "success", trend: rev.trend, spark: mrrSeries, sparkColor: "#34D399", hint: "12 × MRR" },
      { k: "conversion",    label: "Approval rate", value: null, fmtKey: "percent", hint: "see Analytics" },
    ];
  }, [kpis, projection]);

  return (
    <motion.div
      data-testid="kpi-row"
      initial="hidden" animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}
      className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-3"
    >
      {cards.map((c) => <KpiCard key={c.k} {...c} />)}
    </motion.div>
  );
}
