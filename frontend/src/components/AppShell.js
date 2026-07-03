import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { Toaster, toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import { useAppStore } from "@/lib/store";
import { streamSimulation } from "@/lib/api";

/**
 * AppShell — global frame: sidebar + outlet + toaster.
 * Also owns the singleton SSE connection to the current sim so notifications
 * fire across all pages, not only the Dashboard.
 */
export default function AppShell() {
  const {
    simId, setStatus, setActiveAgent,
    appendStart, appendDelta, appendEnd, bumpApprovals,
    pushNotification,
  } = useAppStore();

  useEffect(() => {
    if (!simId) return;
    useAppStore.setState({ messages: [], status: "running", activeAgent: null });

    const close = streamSimulation(simId, (ev) => {
      switch (ev.type) {
        case "agent.active":         setActiveAgent(ev.agent); break;
        case "agent.message.start":  appendStart(ev); break;
        case "agent.message.delta":  appendDelta(ev); break;
        case "agent.message.end":    appendEnd(ev); break;
        case "approval.requested":
          bumpApprovals();
          pushNotification(ev);
          toast.message(`${ev.agent} requested approval`, { description: ev.summary?.slice(0,120) });
          break;
        case "approval.decided":
          bumpApprovals();
          pushNotification(ev);
          break;
        case "simulation.started":
          setStatus("running");
          pushNotification(ev);
          toast.success("Simulation started", { description: ev.goal });
          break;
        case "simulation.completed":
          setStatus("completed"); setActiveAgent(null);
          pushNotification(ev);
          toast.success("Simulation completed");
          break;
        case "simulation.failed":
          setStatus("failed"); setActiveAgent(null);
          pushNotification(ev);
          toast.error("Simulation failed", { description: ev.error });
          break;
        default: break;
      }
    });
    return close;
  }, [simId, setStatus, setActiveAgent, appendStart, appendDelta, appendEnd, bumpApprovals, pushNotification]);

  return (
    <div className="min-h-screen" style={{ background: "transparent" }}>
      <Sidebar />
      <main className="ml-64 px-8 py-0 pb-12" data-testid="app-main">
        <Outlet />
      </main>
      <Toaster theme="dark" position="bottom-right" closeButton
               toastOptions={{
                 style: { background: "#101017", border: "1px solid rgba(255,255,255,0.08)", color: "#ECECF1" },
               }} />
    </div>
  );
}
