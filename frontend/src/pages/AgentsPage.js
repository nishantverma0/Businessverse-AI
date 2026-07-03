import { useEffect, useState } from "react";
import { Users, Cpu, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import Topbar from "@/components/Topbar";
import { PanelHeader } from "@/components/common/UI";

const SYSTEM_PROMPTS = {
  ceo: "Synthesize input from your department heads, set strategic priorities, and delegate.",
  product: "Suggest one concrete next feature/release tied to the goal.",
  marketing: "Propose a marketing channel + experiment with a target metric.",
  sales: "Propose an ICP and one outbound play.",
  finance: "Comment on burn, runway, and capital efficiency for the plan, with one number.",
  research: "Surface one market/competitive insight relevant to the goal.",
};

export default function AgentsPage() {
  const [roster, setRoster] = useState([]);
  useEffect(() => { api.agentRoster().then(setRoster).catch(() => {}); }, []);

  return (
    <>
      <Topbar title="Agents" subtitle="6 active · Claude Sonnet 4.5 · streaming responses" />
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {roster.map((a) => (
          <div key={a.id} className="glass p-5" data-testid={`agent-card-${a.id}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md grid place-items-center"
                     style={{ background: a.id === "ceo" ? "linear-gradient(135deg,#5B8DEF,#8B5CF6)" : "rgba(255,255,255,0.04)",
                              border: "1px solid var(--border-strong)" }}>
                  <Users size={15} color={a.id === "ceo" ? "#0a0a0f" : "var(--text)"} strokeWidth={1.6} />
                </div>
                <div>
                  <div className="font-display text-[15px] font-semibold tracking-tight">{a.label}</div>
                  <div className="font-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>{a.role}</div>
                </div>
              </div>
              <span className="chip chip-success">ONLINE</span>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="glass-soft p-2"><div className="label-mono">Model</div><div className="text-[11.5px] mt-1">Sonnet 4.5</div></div>
              <div className="glass-soft p-2"><div className="label-mono">Latency</div><div className="text-[11.5px] mt-1">~2.8s</div></div>
              <div className="glass-soft p-2"><div className="label-mono">Tokens</div><div className="text-[11.5px] mt-1">~110</div></div>
            </div>

            <div className="glass-soft p-3 mt-3">
              <div className="label-mono mb-1.5 flex items-center gap-1.5">
                <Sparkles size={11} /> System prompt
              </div>
              <div className="font-mono text-[11px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {SYSTEM_PROMPTS[a.id]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
