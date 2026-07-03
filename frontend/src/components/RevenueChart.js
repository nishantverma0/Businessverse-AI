import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RevenueChart({ data }) {
  const empty = !data || data.length === 0;
  return (
    <div className="border h-full min-h-[420px] flex flex-col"
         style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b"
           style={{ borderColor: "var(--border)" }}>
        <div className="label-mono">Cash + Revenue Projection · 18mo</div>
        <div className="flex gap-3 font-mono text-[10px]">
          <span style={{ color: "#fff" }}>— CASH</span>
          <span style={{ color: "var(--accent)" }}>— REV</span>
        </div>
      </div>
      <div className="flex-1 px-2 py-3" data-testid="revenue-chart">
        {empty ? (
          <div className="h-full grid place-items-center label-mono">
            Run a simulation to project cash flow.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 18, left: 8, bottom: 8 }}>
              <CartesianGrid stroke="#1a1a1a" strokeDasharray="0" />
              <XAxis dataKey="month" stroke="#555" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }} />
              <YAxis stroke="#555" tick={{ fontSize: 10, fontFamily: "JetBrains Mono" }}
                     tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{
                  background: "#050505", border: "1px solid #2a2a2a", borderRadius: 0,
                  fontFamily: "JetBrains Mono", fontSize: 11, color: "#fff",
                }}
                formatter={(v) => `$${Math.round(v).toLocaleString()}`}
              />
              <Line type="monotone" dataKey="cash" stroke="#ffffff" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="revenue" stroke="#0047FF" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
