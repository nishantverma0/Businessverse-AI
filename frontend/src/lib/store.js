import { create } from "zustand";

export const useAppStore = create((set, get) => ({
  // Selection
  companyId: null,
  simId: null,
  setCompanyId: (id) => set({ companyId: id, simId: null, messages: [], activeAgent: null }),
  setSimId: (id) => set({ simId: id, messages: [], activeAgent: null, status: "running" }),

  // Sim runtime
  status: "idle",                   // idle | running | completed | failed
  activeAgent: null,                // ceo | product | ...
  messages: [],                     // [{msg_id, agent, role, content, streaming, ts}]
  approvalsTick: 0,
  setStatus: (s) => set({ status: s }),
  setActiveAgent: (a) => set({ activeAgent: a }),
  appendStart: (ev) => set((st) => {
    // idempotent: if msg_id already present, do nothing (avoids duplicate
    // entries if the SSE stream redelivers a start event).
    if (ev.msg_id && st.messages.some((m) => m.msg_id === ev.msg_id)) return {};
    return {
      messages: [...st.messages, {
        msg_id: ev.msg_id, agent: ev.agent, role: ev.role,
        content: "", streaming: true, ts: ev.ts,
      }],
    };
  }),
  appendDelta: (ev) => set((st) => ({
    messages: st.messages.map((m) => m.msg_id === ev.msg_id
      ? { ...m, content: m.content + ev.delta } : m),
  })),
  appendEnd: (ev) => set((st) => ({
    messages: st.messages.map((m) => m.msg_id === ev.msg_id
      ? { ...m, content: ev.content, streaming: false } : m),
  })),
  bumpApprovals: () => set((st) => ({ approvalsTick: st.approvalsTick + 1 })),

  // Notifications (in-memory toast log + bell list, fed by SSE)
  notifications: [],
  pushNotification: (n) => set((st) => ({ notifications: [n, ...st.notifications].slice(0, 30) })),
  clearNotifications: () => set({ notifications: [] }),
}));
