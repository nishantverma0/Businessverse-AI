import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

const RO_MSG = "ResizeObserver loop completed with undelivered notifications";
const RO_MSG_ALT = "ResizeObserver loop limit exceeded";
window.addEventListener("error", (e) => {
  if (e.message && (e.message.includes(RO_MSG) || e.message.includes(RO_MSG_ALT))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  if (e?.reason?.message && (e.reason.message.includes(RO_MSG) || e.reason.message.includes(RO_MSG_ALT))) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
