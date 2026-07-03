import { useMemo, useState } from "react";
import { Database, Search, Brain } from "lucide-react";
import Topbar from "@/components/Topbar";
import { PanelHeader } from "@/components/common/UI";

const SAMPLE_MEMORIES = [
  { id: "m1", agent: "ceo",       type: "semantic",  text: "Q2 mandate centered on enterprise expansion and lifting ARR.",       tokens: 24, recall: 0.92 },
  { id: "m2", agent: "product",   type: "episodic",  text: "Prior MVP for note-taking shipped in 4 weeks with 71% activation.",  tokens: 31, recall: 0.81 },
  { id: "m3", agent: "marketing", type: "semantic",  text: "LinkedIn ABM yields 3.4% reply rate for Series B SaaS ICP.",         tokens: 22, recall: 0.78 },
  { id: "m4", agent: "sales",     type: "semantic",  text: "ICP: mid-market B2B SaaS, 100-500 employees, 5-15 PMs.",              tokens: 18, recall: 0.74 },
  { id: "m5", agent: "finance",   type: "episodic",  text: "Burn $60k/mo · runway 8 months · efficient growth band 1.2x.",       tokens: 19, recall: 0.88 },
  { id: "m6", agent: "research",  type: "semantic",  text: "Competitive set fragmented: 4-6 incumbents differentiating on UX.",  tokens: 21, recall: 0.69 },
];

const AGENT_COLORS = { ceo: "#FFFFFF", product: "#5B8DEF", marketing: "#F87171",
                       sales: "#34D399", finance: "#FBBF24", research: "#A78BFA" };

export default function MemoryPage() {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");

  const items = useMemo(() => {
    return SAMPLE_MEMORIES.filter((m) =>
      (filter === "all" || m.type === filter) &&
      (q.trim() === "" || m.text.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, filter]);

  return (
    <>
      <Topbar title="Memory Explorer" subtitle="Semantic + episodic memory bank · per-agent ownership"
        right={<span className="chip" style={{ color: "var(--warning)", borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.08)" }}>MOCKED · NOT WIRED TO RAG</span>} />

      <div className="grid md:grid-cols-12 gap-4">
        {/* Filters */}
        <div className="md:col-span-3 flex flex-col gap-3">
          <div className="glass p-3">
            <div className="label-mono mb-2">Search</div>
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-3)" }} />
              <input value={q} onChange={(e) => setQ(e.target.value)}
                     placeholder="Find memories…" className="input pl-8" data-testid="memory-search" />
            </div>
          </div>
          <div className="glass p-3">
            <div className="label-mono mb-2">Type</div>
            <div className="flex flex-col gap-1">
              {["all", "semantic", "episodic"].map((t) => (
                <button key={t} onClick={() => setFilter(t)}
                  className="text-left px-2 py-1.5 rounded text-[12.5px]"
                  data-testid={`mem-filter-${t}`}
                  style={{
                    background: filter === t ? "rgba(91,141,239,0.10)" : "transparent",
                    border: `1px solid ${filter === t ? "rgba(91,141,239,0.35)" : "transparent"}`,
                    color: filter === t ? "var(--text)" : "var(--text-2)",
                  }}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bank */}
        <div className="md:col-span-9 glass">
          <PanelHeader title={`${items.length} memories`} subtitle="Click to inspect embedding metadata" />
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {items.map((m) => (
              <div key={m.id} className="px-5 py-3 flex items-start gap-3" data-testid={`mem-${m.id}`}>
                <div className="w-8 h-8 rounded-md grid place-items-center text-[10px] font-bold font-display flex-shrink-0"
                     style={{ background: "rgba(255,255,255,0.04)", color: AGENT_COLORS[m.agent], border: "1px solid var(--border-strong)" }}>
                  {m.agent.slice(0,2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10.5px] uppercase tracking-wider" style={{ color: AGENT_COLORS[m.agent] }}>
                      {m.agent}
                    </span>
                    <span className="chip" style={{ fontSize: 9.5 }}>{m.type}</span>
                    <span className="chip" style={{ fontSize: 9.5, color: "var(--info)", borderColor: "rgba(96,165,250,0.35)", background: "rgba(96,165,250,0.08)" }}>
                      recall {(m.recall * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--text)" }}>{m.text}</div>
                  <div className="font-mono text-[10.5px] mt-1" style={{ color: "var(--text-4)" }}>
                    {m.tokens} tokens · vector(1536) · cosine
                  </div>
                </div>
                <Brain size={14} style={{ color: "var(--text-3)" }} />
              </div>
            ))}
            {items.length === 0 && (
              <div className="p-6 text-center label-mono">No memories match the current filter.</div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
