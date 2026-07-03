import { useEffect, useState } from "react";
import { Settings as Cog, Server, Globe, Key } from "lucide-react";
import { api } from "@/lib/api";
import Topbar from "@/components/Topbar";
import { PanelHeader } from "@/components/common/UI";

const STATUS_TONE = {
  ok:      { color: "var(--success)", label: "OPERATIONAL", dot: "dot-success" },
  warning: { color: "var(--warning)", label: "DEGRADED",   dot: "dot-warning" },
  down:    { color: "var(--danger)",  label: "DOWN",       dot: "dot-danger"  },
};

export default function SettingsPage() {
  const [health, setHealth] = useState([]);

useEffect(() => {
  const loadHealth = async () => {
    try {
      const res = await api.systemHealth();

      console.log("System Health API:", res);

      const data = Array.isArray(res)
        ? res
        : res?.health ||
          res?.services ||
          res?.items ||
          res?.data ||
          [];

      setHealth(data);
    } catch (err) {
      console.error("Failed to load system health:", err);
      setHealth([]);
    }
  };

  loadHealth();
}, []);

  return (
    <>
      <Topbar title="Settings & System" subtitle="Workspace configuration · component health" />

      <div className="grid xl:grid-cols-2 gap-4">
        <div className="glass">
          <PanelHeader title="System Health" subtitle="Live status of dependent services"
                       right={<Server size={13} style={{ color: "var(--text-3)" }} />} />
          <div className="p-2">
            {health.length === 0 && (
  <div className="p-4 label-mono">Loading…</div>
)}
            {(Array.isArray(health) ? health : []).map((c) => {
              const t = STATUS_TONE[c.status] || STATUS_TONE.warning;
              return (
                <div key={c.id} className="flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-white/5"
                     data-testid={`health-${c.id}`}>
                  <div className="flex items-center gap-3">
                    <span className={`dot ${t.dot}`} />
                    <div>
                      <div className="text-[13px]" style={{ color: "var(--text)" }}>{c.label}</div>
                      {c.note && <div className="font-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>{c.note}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {c.latency_ms != null && (
                      <span className="font-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>
                        {c.latency_ms}ms
                      </span>
                    )}
                    <span className="chip" style={{ color: t.color,
                      borderColor: c.status === "ok" ? "rgba(52,211,153,0.35)" : c.status === "warning" ? "rgba(251,191,36,0.35)" : "rgba(248,113,113,0.35)",
                      background:  c.status === "ok" ? "rgba(52,211,153,0.08)" : c.status === "warning" ? "rgba(251,191,36,0.08)" : "rgba(248,113,113,0.08)",
                    }}>
                      {t.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="glass">
            <PanelHeader title="Workspace" subtitle="Display preferences"
                         right={<Cog size={13} style={{ color: "var(--text-3)" }} />} />
            <div className="p-4 grid gap-3">
              <Row label="Theme"          value="Dark · Boardroom" />
              <Row label="Density"        value="Comfortable" />
              <Row label="Default model"  value="Claude Sonnet 4.5" />
              <Row label="Streaming"      value="Enabled · SSE" tone="var(--success)" />
            </div>
          </div>

          <div className="glass">
            <PanelHeader title="Integrations" subtitle="Connected services"
                         right={<Globe size={13} style={{ color: "var(--text-3)" }} />} />
            <div className="p-4 grid gap-3">
              <Row label="LLM Provider"  value="Anthropic" tone="var(--success)" />
              <Row label="Database"      value="MongoDB" tone="var(--success)" />
              <Row label="LangGraph"     value="Embedded" />
              <Row label="Prometheus"    value="Not configured" tone="var(--warning)" />
            </div>
          </div>

          <div className="glass">
            <PanelHeader title="API Key" subtitle="LLM_KEY · server-side only"
                         right={<Key size={13} style={{ color: "var(--text-3)" }} />} />
            <div className="p-4 font-mono text-[12px]" style={{ color: "var(--text-2)" }}>
              sk-•••••••••••••••••55
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between text-[13px]">
      <div className="label-mono">{label}</div>
      <div style={{ color: tone || "var(--text)" }}>{value}</div>
    </div>
  );
}
