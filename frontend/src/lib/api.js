import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api/v1`;

console.log("Backend URL:", BACKEND_URL);
console.log("API URL:", API);

const client = axios.create({
  baseURL: API,
  timeout: 30000,
});

client.interceptors.request.use((config) => {
  console.log(
    `[${config.method?.toUpperCase()}] ${config.baseURL}${config.url}`,
    config.params || config.data
  );
  return config;
});

client.interceptors.response.use(
  (response) => {
    console.log(
      `[${response.status}] ${response.config.url}`,
      response.data
    );
    return response;
  },
  (error) => {
    console.error(
      "API Error:",
      error.response?.status,
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

const safeGet = async (url, fallback = null, config = {}) => {
  try {
    const { data } = await client.get(url, config);
    return data;
  } catch (err) {
    console.warn(`${url} unavailable`);
    return fallback;
  }
};

export const api = {
  /* ---------------- Companies ---------------- */

  async listCompanies() {
    const { data } = await client.get("/companies");
    return Array.isArray(data) ? data : [];
  },

  async createCompany(payload) {
    const { data } = await client.post("/companies", payload);
    return data;
  },

  async getCompany(id) {
    const { data } = await client.get(`/companies/${id}`);
    return data;
  },

  /* ---------------- Agents ---------------- */

  async listAgents(companyId) {
    if (!companyId) return [];

    const { data } = await client.get(`/agents/${companyId}`);

    return Array.isArray(data) ? data : [];
  },

  async getAgentMetrics(companyId) {
    if (!companyId) return [];

    const { data } = await client.get(
      `/agents/${companyId}/metrics`
    );

    return Array.isArray(data) ? data : [];
  },

  /* ---------------- Simulations ---------------- */

  async startSimulation(companyId, goal) {
    const { data } = await client.post("/simulations", {
      company_id: companyId,
      goal,
    });

    return {
      id: data.simulation_id,
      simulation_id: data.simulation_id,
      thread_id: data.thread_id,
    };
  },

  async getSimulationState(simId) {
    if (!simId) return null;

    const { data } = await client.get(
      `/simulations/${simId}/state`
    );

    return data;
  },

  /* ---------------- Temporary placeholders ---------------- */

  async getKpis(simId) {
    const state = await this.getSimulationState(simId);

    return state?.values?.kpis ?? {
        revenue: 0,
        burn: 0,
        runway: 0,
        growth: 0,
    };
},

  async getProjection(simId) {
    const state = await this.getSimulationState(simId);

    return Array.isArray(state?.values?.projection)
        ? state.values.projection
        : [];
},

  async getEvents(simId) {
    const state = await this.getSimulationState(simId);

    return Array.isArray(state?.values?.events)
        ? state.values.events
        : [];
},

  /* ---------------- Approvals ---------------- */

  async listApprovals(status = "pending") {
    try {
      const { data } = await client.get("/approvals", {
        params: { status },
      });

      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("Approvals endpoint unavailable");
      return [];
    }
  },

  async waitForSimulation(simId, callback) {

    let tries = 0;

    const timer = setInterval(async () => {

        tries++;

        const state = await this.getSimulationState(simId);

        callback?.(state);

        if (
            state?.status === "completed" ||
            state?.status === "failed" ||
            tries > 120
        ) {
            clearInterval(timer);
        }

    }, 2000);

    return () => clearInterval(timer);
},

  async decideApproval(id, decision) {
    const { data } = await client.post(
      `/approvals/${id}/decision`,
      {
        decision,
      }
    );

    return data;
  },
};

/* ---------------- SSE ---------------- */

export function streamSimulation(simId) {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";

  const backend = process.env.REACT_APP_BACKEND_URL.replace(/^https?:\/\//, "");

  const socket = new WebSocket(
    `${protocol}://${backend}/api/v1/ws/agents/${simId}`
  );

  socket.onopen = () => {
    console.log("WebSocket Connected");
  };

  socket.onerror = (e) => {
    console.error("WebSocket Error", e);
  };

  socket.onclose = () => {
    console.log("WebSocket Closed");
  };
  return new WebSocket(
        `${protocol}://${backend}/api/v1/ws/agents/${simId}`
    );

}