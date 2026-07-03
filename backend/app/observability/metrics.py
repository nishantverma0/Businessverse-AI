from prometheus_client import Counter, Histogram, Gauge

AGENT_RUNS = Counter("agent_runs_total", "Agent invocations", ["agent"])
AGENT_LATENCY = Histogram("agent_latency_seconds", "Agent latency", ["agent"])
AGENT_ERRORS = Counter("agent_errors_total", "Agent errors", ["agent"])
TOKENS = Counter("tokens_total", "Tokens used", ["agent", "type"])
ML_LATENCY = Histogram("ml_inference_seconds", "ML inference", ["model"])
APPROVAL_QUEUE = Gauge("approval_queue_depth", "Pending approvals")