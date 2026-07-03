import { useEffect, useState } from "react";
import { Bell, Activity, Command } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/store";

const COLORS = {
  "simulation.started":   { color: "#5B8DEF", label: "Sim started" },
  "simulation.completed": { color: "#34D399", label: "Sim completed" },
  "simulation.failed":    { color: "#F87171", label: "Sim failed" },
  "approval.requested":   { color: "#FBBF24", label: "Approval requested" },
  "approval.decided":     { color: "#A1A1AA", label: "Approval decided" },
};

export default function Topbar({ title, subtitle, right }) {
  const { notifications, clearNotifications, status, activeAgent } = useAppStore();
  const [open, setOpen] = useState(false);
  const unread = notifications.length;

  // close on click outside
  useEffect(() => {
    const h = (e) => {
      if (!e.target.closest?.("[data-bell]")) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <header className="sticky top-0 z-10 -mx-8 px-8 py-4 mb-4 flex items-center justify-between"
            style={{
              background: "linear-gradient(180deg, rgba(7,7,10,0.92), rgba(7,7,10,0.55))",
              backdropFilter: "blur(14px)",
              borderBottom: "1px solid var(--border)",
            }}>
      <div className="min-w-0">
        <div className="font-display text-[22px] font-semibold tracking-tight leading-none truncate" data-testid="page-title">
          {title}
        </div>
        {subtitle && (
          <div className="font-mono text-[11px] mt-1.5" style={{ color: "var(--text-3)" }}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {right}

        {/* Sim status chip */}
        <div className="chip" style={{
          color: status === "running" ? "var(--success)" :
                 status === "failed"  ? "var(--danger)"  : "var(--text-2)",
          borderColor: status === "running" ? "rgba(52,211,153,0.35)" : "var(--border-strong)",
          background:  status === "running" ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.03)",
        }}>
          <Activity size={11} className={status === "running" ? "pulse-soft" : ""} />
          {status.toUpperCase()}{activeAgent && status === "running" ? ` · ${activeAgent}` : ""}
        </div>

        {/* Cmd hint */}
        <div className="chip">
          <Command size={11} /> K
        </div>

        {/* Bell */}
        <div className="relative" data-bell>
          <button
            data-testid="notifications-bell"
            onClick={() => setOpen(v => !v)}
            className="btn-ghost btn"
            aria-label="Notifications"
          >
            <Bell size={15} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] grid place-items-center"
                    style={{ background: "var(--accent)", color: "#0a0a0f", fontWeight: 700 }}>
                {unread}
              </span>
            )}
          </button>
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.14 }}
                className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto glass-strong p-2"
                data-testid="notifications-panel"
              >
                <div className="flex items-center justify-between px-2 py-1">
                  <div className="label-mono">Notifications</div>
                  <button className="btn-ghost btn" style={{ fontSize: 11 }}
                          onClick={() => { clearNotifications(); setOpen(false); }}>
                    Clear
                  </button>
                </div>
                {notifications.length === 0 && (
                  <div className="px-2 py-6 text-center label-mono">
                    No notifications yet.
                  </div>
                )}
                {notifications.map((n, i) => {
                  const meta = COLORS[n.type] || { color: "#A1A1AA", label: n.type };
                  return (
                    <div key={i} className="px-2 py-2 rounded-md flex gap-2 items-start hover:bg-white/5">
                      <div className="dot mt-1.5" style={{ background: meta.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px]" style={{ color: "var(--text)" }}>
                          {meta.label}
                          {n.agent && <span style={{ color: "var(--text-3)" }}> · {n.agent}</span>}
                        </div>
                        {n.summary && <div className="text-[11.5px] truncate" style={{ color: "var(--text-2)" }}>{n.summary}</div>}
                        <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--text-4)" }}>
                          {new Date(n.ts).toISOString().slice(11, 19)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
