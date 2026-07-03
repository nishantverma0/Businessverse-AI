export default function KpiCards({ kpis }) {
  const items = [
    { label: "Revenue / Mo", key: "revenue_mo", fmt: (v) => `$${Math.round(v).toLocaleString()}` },
    { label: "Cash", key: "cash", fmt: (v) => `$${Math.round(v).toLocaleString()}` },
    { label: "Burn / Mo", key: "burn", fmt: (v) => `$${Math.round(v).toLocaleString()}`, color: "var(--danger)" },
    { label: "Runway", key: "runway_months", fmt: (v) => `${v} mo` },
    { label: "Customers", key: "customers", fmt: (v) => Math.round(v).toLocaleString(), color: "var(--success)" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 border"
         style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      {items.map((it, i) => (
        <div
          key={it.key}
          data-testid={`kpi-${it.key}`}
          className="p-5"
          style={{
            borderRight: i < items.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div className="label-mono">{it.label}</div>
          <div
            key={`${it.key}-${kpis?.[it.key] ?? "na"}`}
            className="font-display text-3xl md:text-4xl font-light tracking-tighter mt-2 value-tick"
            style={{ color: it.color || "var(--text)" }}>
            {kpis?.[it.key] != null ? it.fmt(kpis[it.key]) : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}
