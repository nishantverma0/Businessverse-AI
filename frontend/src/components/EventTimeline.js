import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, MessageSquare } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { PanelHeader, EmptyState } from "@/components/common/UI";

const AGENT_COLOR = {
  ceo: "#FFFFFF", product: "#5B8DEF", marketing: "#F87171",
  sales: "#34D399", finance: "#FBBF24", research: "#A78BFA",
};

export default function EventTimeline() {
  const { messages, status } = useAppStore();
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="glass flex flex-col h-full min-h-[420px]" data-testid="event-timeline">
      <PanelHeader
        title="Live Business Timeline"
        subtitle="Streaming agent events · click to expand"
        right={
          <div className="chip" style={{
            color: status === "running" ? "var(--success)" : "var(--text-3)",
            borderColor: status === "running" ? "rgba(52,211,153,0.35)" : "var(--border-strong)",
          }}>
            ● {status === "running" ? "BROADCASTING" : "QUIET"}
          </div>
        }
      />

      <div className="flex-1 overflow-auto px-5 py-4">
        {messages.length === 0 && (
          <EmptyState icon={MessageSquare} title="No events yet"
            hint="Launch a simulation from the Dashboard. Agent activity will stream here token-by-token." />
        )}

        <ol className="relative pl-7">
          <div className="absolute left-3 top-2 bottom-2 w-px timeline-line" />
          <AnimatePresence initial={false}>
            {messages.map((m, idx) => {
              const ts = m.ts ? new Date(m.ts).toISOString().slice(11, 19) : "--:--:--";
              const color = AGENT_COLOR[m.agent] || "#fff";
              return (
                <motion.li
                  key={`${m.msg_id || "x"}-${idx}`}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="relative py-2"
                  data-testid={`stream-msg-${m.msg_id || ts}`}
                >
                  <div className="absolute -left-[18px] top-3 w-3 h-3 rounded-full"
                       style={{
                         background: color,
                         boxShadow: m.streaming ? `0 0 10px ${color}` : "none",
                         outline: "2px solid rgba(7,7,10,1)",
                       }} />
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-mono text-[10.5px]" style={{ color: "var(--text-4)" }}>{ts}</span>
                    <span className="text-[10.5px] font-semibold tracking-wider uppercase font-mono" style={{ color }}>
                      {(m.role || m.agent || "system").toString()}
                    </span>
                    <ChevronRight size={12} style={{ color: "var(--text-4)" }} />
                    <span className="font-mono text-[10px]" style={{ color: "var(--text-4)" }}>
                      {m.streaming ? "streaming" : "completed"}
                    </span>
                  </div>
                  <div className="text-[13px] leading-relaxed" style={{ color: "var(--text)" }}>
                    {m.content}
                    {m.streaming && <span className="stream-cursor" />}
                  </div>
                </motion.li>
              );
            })}
          </AnimatePresence>
          <div ref={endRef} />
        </ol>
      </div>
    </div>
  );
}
