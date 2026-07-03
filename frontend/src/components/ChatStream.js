import { useEffect, useRef } from "react";

const COLORS = {
  ceo: "#FFFFFF",
  product: "#0047FF",
  marketing: "#FF3B30",
  sales: "#00C853",
  finance: "#FFD600",
  research: "#B97AFF",
};

export default function ChatStream({ messages, status }) {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  return (
    <div className="border h-full min-h-[420px] flex flex-col"
         style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
      <div className="flex items-center justify-between px-5 py-3 border-b"
           style={{ borderColor: "var(--border)" }}>
        <div className="label-mono">Agent Stream · Live</div>
        <div className="font-mono text-[10px]"
             style={{ color: status === "running" ? "var(--success)" : "var(--text-3)" }}>
          {status === "running" ? "● BROADCASTING" : status === "completed" ? "○ COMPLETED" : "○ IDLE"}
        </div>
      </div>
      <div className="flex-1 overflow-auto px-5 py-4 font-mono text-[12px] leading-6"
           data-testid="chat-stream">
        {messages.length === 0 && (
          <div className="label-mono" style={{ color: "var(--text-3)" }}>
            $ awaiting simulation_start …
          </div>
        )}
        {messages.map((m, i) => {
          const color = COLORS[m.agent] || "#fff";
          const ts = m.ts ? new Date(m.ts).toISOString().slice(11, 19) : "--:--:--";
          return (
            <div key={m.msg_id || i} className="msg-in flex gap-3" data-testid={`stream-msg-${i}`}>
              <span style={{ color: "var(--text-3)" }}>[{ts}]</span>
              <span style={{ color, fontWeight: 600 }}>
                {(m.role || m.agent || "system").toString().toUpperCase()}
              </span>
              <span style={{ color: "var(--text)" }}>›</span>
              <span style={{ color: "var(--text)" }}>
                {m.content}
                {m.streaming && <span className="stream-cursor">▍</span>}
              </span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
