import { useEffect, useMemo, useState } from "react";
import ReactFlow, { Background, Handle, Position, useReactFlow, ReactFlowProvider } from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, X, Activity, Cpu, Clock, FileText } from "lucide-react";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import { PanelHeader } from "@/components/common/UI";

const STATUS = {
  idle:      { color: "#52525B", label: "IDLE",      glow: false },
  thinking:  { color: "#FBBF24", label: "THINKING",  glow: true  },
  running:   { color: "#5B8DEF", label: "EXECUTING", glow: true  },
  waiting:   { color: "#A78BFA", label: "WAITING",   glow: false },
  completed: { color: "#34D399", label: "DONE",      glow: false },
  failed:    { color: "#F87171", label: "FAILED",    glow: false },
};

const ROLE_TITLES = {
  ceo: "Chief Executive", product: "Product", marketing: "Marketing",
  sales: "Sales", finance: "Finance", research: "Research",
};

function AgentNode({ data }) {
  const s = STATUS[data.status] || STATUS.idle;
  const isCeo = data.id === "ceo";
  return (
    <button
      data-testid={`agent-node-${data.id}`}
      onClick={data.onOpen}
      className={`text-left rounded-xl px-3 py-2.5 transition-all ${s.glow ? "node-active" : ""}`}
      style={{
        minWidth: 140,
        background: isCeo
          ? "linear-gradient(180deg, rgba(91,141,239,0.18), rgba(91,141,239,0.04))"
          : "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))",
        border: `1px solid ${s.glow ? "rgba(91,141,239,0.6)" : "var(--border-strong)"}`,
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: "#5B8DEF", border: 0, width: 6, height: 6, opacity: 0.5 }} />
      <div className="flex items-center justify-between gap-2">
        <div className="label-mono truncate" style={{ color: "var(--text-3)" }}>{ROLE_TITLES[data.id]}</div>
        <span className="dot flex-shrink-0" style={{ background: s.color, boxShadow: s.glow ? `0 0 8px ${s.color}` : "none" }} />
      </div>
      <div className="font-display text-[15px] font-semibold mt-1" style={{ color: "var(--text)" }}>
        {ROLE_TITLES[data.id] ?? data.id.toUpperCase()}
      </div>
      <div className="font-mono text-[9.5px] mt-1" style={{ color: s.color }}>
        {s.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: "#5B8DEF", border: 0, width: 6, height: 6, opacity: 0.5 }} />
    </button>
  );
}
const nodeTypes = { agent: AgentNode };

function statusFor(id, activeAgent, status, messages) {
  if (status === "failed") return id === activeAgent ? "failed" : "idle";
  if (activeAgent === id) {
    const last = [...messages].reverse().find((m) => m.agent === id);
    return last?.streaming ? "running" : "thinking";
  }
  const hasMsg = messages.some((m) => m.agent === id && !m.streaming);
  if (hasMsg) return "completed";
  return "idle";
}


function GraphInner({ onSelect, companyId }) {
    const { activeAgent, status, messages } = useAppStore();
  const [roster, setRoster] = useState([]);
  const rf = useReactFlow();

  useEffect(() => {
    const loadRoster = async () => {
      try {
        const agents = await api.listAgents(companyId);

        console.log("Agent Roster API:", res);

        const data = Array.isArray(res)
          ? res
          : Array.isArray(res?.agents)
          ? res.agents
          : Array.isArray(res?.data)
          ? res.data
          : [];

        setRoster(data);
      } catch (err) {
        console.error(err);
        setRoster([]);
      }
    };

    loadRoster();
  }, [companyId]);

  useEffect(() => {
    if (roster.length > 0) {
      requestAnimationFrame(() =>
        rf.fitView({
          padding: 0.25,
          duration: 300,
        })
      );
    }
  }, [roster, rf]);

  const nodes = useMemo(() => {
    return roster.map((r) => ({
      id: r.role,
      type: "agent",
      position: {
        x: r.x ?? 0,
        y: r.y ?? 0,
      },
      data: {
        ...r,
        status: statusFor(r.role, activeAgent, status, messages),
        onOpen: () => onSelect(r.role),
      },
      draggable: false,
      selectable: false,
    }));
  }, [roster, activeAgent, status, messages, onSelect]);

  const edges = useMemo(() => {
    return roster
      .filter((r) => r.role !== "ceo")
      .map((r) => ({
        id: `ceo-${r.role}`,
        source: "ceo",
        target: r.role,
        animated: activeAgent === r.role,
        type: "smoothstep",
      }));
  }, [roster, activeAgent]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      panOnDrag={false}
      zoomOnScroll={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      proOptions={{ hideAttribution: true }}
    >
      <Background
        color="rgba(255,255,255,0.05)"
        gap={22}
        size={1}
      />
    </ReactFlow>
  );
}

export default function AgentGraph({ companyId }) {
  const [selected, setSelected] = useState(null);
  const { activeAgent, status, messages } = useAppStore();
  const agentLast = (id) => [...messages].reverse().find((m) => m.agent === id);

  return (
    <div className="glass relative overflow-hidden flex flex-col h-full min-h-[420px]" data-testid="agent-graph">
      <PanelHeader
        title="Agent Graph"
        subtitle="CEO orchestrates 5 department heads · click a node for details"
        right={
          <div className="chip" style={{
            color: activeAgent ? "var(--success)" : "var(--text-3)",
            borderColor: activeAgent ? "rgba(52,211,153,0.35)" : "var(--border-strong)",
          }}>
            <Activity size={10} /> {activeAgent ? `${activeAgent.toUpperCase()} live` : "STANDBY"}
          </div>
        }
      />
      <div className="flex-1">
        <ReactFlowProvider>
          <GraphInner
    companyId={companyId}
    onSelect={setSelected}
    />
        </ReactFlowProvider>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ x: 380, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 380, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            className="absolute right-0 top-0 bottom-0 w-80 z-10 p-4 flex flex-col gap-3"
            style={{ background: "rgba(16,16,23,0.96)", borderLeft: "1px solid var(--border)", backdropFilter: "blur(14px)" }}
            data-testid="agent-drawer"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="label-mono">Agent</div>
                <div className="font-display text-[20px] font-semibold tracking-tight">{selected.toUpperCase()}</div>
                <div className="font-mono text-[10.5px]" style={{ color: "var(--text-3)" }}>
                  {ROLE_TITLES[selected]}
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="btn-ghost btn" aria-label="Close">
                <X size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="glass-soft p-2"><div className="label-mono">Status</div>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--text)" }}>
                  {STATUS[statusFor(selected, activeAgent, status, messages)].label}
                </div></div>
              <div className="glass-soft p-2"><div className="label-mono">Latency</div>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--text)" }}>~2.8s</div></div>
              <div className="glass-soft p-2"><div className="label-mono">Tokens</div>
                <div className="text-[12.5px] mt-1" style={{ color: "var(--text)" }}>~110</div></div>
            </div>

            <div className="glass-soft p-3 flex-1 overflow-auto">
              <div className="label-mono mb-2 flex items-center gap-1.5"><FileText size={11} /> Last Output</div>
              <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--text)" }}>
                {agentLast(selected)?.content || (
                  <span style={{ color: "var(--text-3)" }}>No output yet for this agent.</span>
                )}
              </div>
            </div>

            <div className="glass-soft p-3">
              <div className="label-mono mb-2 flex items-center gap-1.5"><Brain size={11} /> System Prompt</div>
              <div className="font-mono text-[10.5px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                {selected === "ceo"      && "Synthesize input from department heads, set strategic priorities, and delegate."}
                {selected === "product"  && "Suggest one concrete next feature/release tied to the goal."}
                {selected === "marketing"&& "Propose a marketing channel + experiment with a target metric."}
                {selected === "sales"    && "Propose an ICP and one outbound play."}
                {selected === "finance"  && "Comment on burn, runway, and capital efficiency for the plan."}
                {selected === "research" && "Surface one market/competitive insight relevant to the goal."}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="glass-soft p-2 flex items-center gap-2"><Cpu size={12} /> Claude Sonnet 4.5</div>
              <div className="glass-soft p-2 flex items-center gap-2"><Clock size={12} /> live · streaming</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
