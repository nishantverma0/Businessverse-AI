# AI Business Simulator — Complete Project Guide & Debugging Reference

> **Purpose of this document:** Give an AI assistant or developer full context to
> understand, run, debug, and extend this project. Read this top-to-bottom before
> touching code. It contains architecture, data flow, file map, env vars, run steps,
> and a debugging playbook for every known failure mode.

---

## 1. What This Project Is

A **production-grade Multi-Agent AI Business Simulator**. It simulates a virtual
company where 6 AI agents collaborate to launch and grow a business.

**Agents (LangGraph nodes):**
| Agent | Role | Responsibility |
|-------|------|----------------|
| CEO | Supervisor | Defines strategy, splits goal into tasks, routes work, final approval |
| Product Manager (pm) | Worker | Roadmap, feature prioritization, PRDs |
| Marketing | Worker | Campaigns, social content, competitor analysis |
| Sales | Worker | Sales plans, outreach sequences, revenue forecasts |
| Finance | Worker | Budgets, cash flow, financial reports (flags >$50k for human approval) |
| Research | Worker | Web research, market intelligence, trends |

**Core capabilities:** multi-agent orchestration (LangGraph), long-term memory
(PostgreSQL), semantic memory (pgvector), tool calling, human-in-the-loop approval
checkpoints, decision history, ML prediction models, n8n automation, LangSmith
tracing, Prometheus metrics, real-time WebSocket UI.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Orchestration | LangGraph (StateGraph + Postgres checkpointer) |
| LLM framework | LangChain + langchain-openai (gpt-4o) |
| API | FastAPI (async), Uvicorn |
| DB | PostgreSQL 16 + pgvector extension |
| Cache / Pub-Sub | Redis 7 |
| ML | XGBoost, LightGBM, Prophet, scikit-learn, joblib |
| Automation | n8n |
| Frontend | Next.js 14 + TypeScript, React Flow, Recharts, Zustand |
| Observability | LangSmith, Prometheus, Grafana |
| Deployment | Docker Compose (local), ECS/RDS/ElastiCache (AWS) |

---

## 3. High-Level Architecture & Data Flow
User (Next.js)
│  POST /api/v1/simulations  (company_id + goal)
▼
FastAPI route (routes_simulation.py)
│  create Simulation row (thread_id)
│  asyncio.create_task(run_graph_streaming)  ← runs in background
▼
simulation_service.run_graph_streaming()
│  graph.astream(init, config)  ← LangGraph executes
▼
LangGraph (builder.py)
START → CEO node → (conditional route) → worker node → back to CEO → ... → END
│
├─ requires_approval? → "human" node (INTERRUPT before)
│     graph pauses, state saved to Postgres checkpoint
│     Approval row created, status=paused_for_approval
│
Each node:  BaseAgent.act()
├─ recall semantic memory (pgvector)
├─ LLM call with tools bound
├─ store new memory
└─ return partial state dict
Every step → publish_event() → Redis pub/sub → WebSocket → Frontend live UI
Token usage → accounted to Postgres + Prometheus

css

Copy code

**Human approval resume flow:**

User clicks Approve (frontend)
│  POST /api/v1/approvals/{id}/decision
▼
routes_approvals.decide()
│  update Approval row
│  asyncio.create_task(resume_graph)
▼
simulation_service.resume_graph()
graph.aupdate_state(decision) → graph.astream(None, config)  ← resumes from checkpoint

markdown

Copy code

**Key insight for debugging:** The graph is **resumable** because LangGraph uses a
**Postgres checkpointer**. State lives in DB tables `checkpoints`, `checkpoint_writes`,
`checkpoint_blobs` (auto-created by `checkpointer.setup()`). The `thread_id` links a
`simulation` row to its checkpoint.

---

## 4. Folder Structure (Authoritative Map)


ai-business-simulator/
├── docker-compose.yml          # all services
├── .env / .env.example         # config (SECRETS)
├── Makefile                    # up/down/migrate/seed/train/test
│
├── backend/
│   ├── Dockerfile
│   ├── pyproject.toml          # python deps
│   ├── alembic.ini
│   └── app/
│       ├── main.py             # FastAPI entrypoint + lifespan (init_checkpointer)
│       ├── config.py           # Pydantic settings (reads .env)
│       │
│       ├── api/
│       │   ├── v1/
│       │   │   ├── routes_company.py     # CRUD companies + auto-create agents
│       │   │   ├── routes_simulation.py  # start + state
│       │   │   ├── routes_approvals.py   # list + decide (resume graph)
│       │   │   ├── routes_chat.py        # user messages
│       │   │   ├── routes_agents.py      # agent list + metrics
│       │   │   ├── routes_ml.py          # ML predictions
│       │   │   └── routes_metrics.py     # tokens + decisions
│       │   └── ws/agent_stream.py        # WebSocket ← Redis pub/sub
│       │
│       ├── agents/
│       │   ├── base.py         # BaseAgent (LLM + memory + metrics)
│       │   ├── _shared.py      # _worker_result helper
│       │   ├── ceo.py          # routing + task extraction
│       │   ├── product_manager.py, marketing.py, sales.py,
│       │   ├── finance.py, research.py
│       │   └── prompts/init.py       # system prompts
│       │
│       ├── graph/
│       │   ├── state.py        # CompanyState TypedDict + reducers
│       │   ├── builder.py      # StateGraph wiring + compile(interrupt_before=["human"])
│       │   ├── supervisor.py   # route() function (CEO routing logic)
│       │   ├── nodes.py        # node wrappers around agents
│       │   ├── checkpoints.py  # init_checkpointer()
│       │   └── worker.py       # background process
│       │
│       ├── tools/              # web_search, finance_calc, ml_predict, n8n_trigger, memory_tools
│       ├── memory/
│       │   ├── semantic.py     # pgvector recall/remember
│       │   ├── long_term.py    # decisions + artifacts
│       │   └── checkpointer.py # AsyncPostgresSaver singleton
│       │
│       ├── ml/
│       │   ├── registry.py     # ModelRegistry.get(name) → joblib load
│       │   ├── artifacts/      # .pkl trained models (GENERATED by train_all)
│       │   └── train/train_all.py  # trains 4 models
│       │
│       ├── db/
│       │   ├── base.py, session.py, models.py, seed.py
│       │   └── migrations/     # alembic env.py + versions
│       │
│       ├── schemas/init.py # Pydantic DTOs
│       ├── services/simulation_service.py  # graph run/resume orchestration
│       ├── core/events.py      # Redis pub/sub
│       ├── core/security.py    # JWT
│       └── observability/
│           ├── tracing.py      # LangSmith env
│           ├── metrics.py      # Prometheus counters
│           └── tokens.py       # token accounting
│
├── frontend/                   # Next.js (dashboard, chat, agent graph, approvals)
├── n8n/workflows/.json        # automation
└── infra/                      # prometheus.yml, nginx.conf, aws/

markdown

Copy code

---

## 5. Database Schema Summary

Tables (all UUID PKs): `users`, `companies`, `agents`, `simulations`, `messages`,
`tasks`, `artifacts`, `decisions`, `approvals`, `memories` (with `VECTOR(1536)` +
HNSW index), `ml_predictions`, `token_usage`.

**Plus LangGraph-managed tables** (do NOT hand-create): `checkpoints`,
`checkpoint_writes`, `checkpoint_blobs`.

Key relationships:
- `companies` 1—N `agents`, `simulations`, `artifacts`, `decisions`, `memories`
- `simulations` 1—N `messages`, `tasks`, `approvals`
- `simulations.thread_id` (TEXT, unique) ↔ LangGraph checkpoint thread

---

## 6. Environment Variables (`.env`)

```env
OPENAI_API_KEY=sk-...              # REQUIRED — agents fail without it
LLM_MODEL=gpt-4o
EMBED_MODEL=text-embedding-3-small
LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=ls-...           # optional, for LangSmith
LANGCHAIN_PROJECT=ai-business-simulator
DATABASE_URL=postgresql+asyncpg://app:secret@postgres:5432/simulator   # async (app)
DATABASE_URL_SYNC=postgresql://app:secret@postgres:5432/simulator      # sync (alembic + checkpointer)
DB_PASS=secret
REDIS_URL=redis://redis:6379/0
JWT_SECRET=change-me
N8N_WEBHOOK_URL=http://n8n:5678/webhook
ENV=development
CORS_ORIGINS=http://localhost:3000

CRITICAL: Two DB URLs exist. DATABASE_URL uses asyncpg (app runtime).
DATABASE_URL_SYNC uses plain psycopg (Alembic migrations + LangGraph checkpointer).
Mixing them up is a common error.

7. How to Run (Step by Step)
bash

Copy code
# 1. Configure
cp .env.example .env
#    → edit .env, set OPENAI_API_KEY

# 2. Build images
make build            # docker compose build

# 3. Start everything
make up               # postgres, redis, backend, worker, frontend, n8n, prometheus, grafana

# 4. Run DB migrations (creates app tables)
make migrate          # alembic upgrade head

# 5. Train ML models (creates app/ml/artifacts/*.pkl)  ← REQUIRED before ML tools work
make train

# 6. Seed demo data (optional)
make seed             # creates a demo company + admin user

# 7. Access
#    Frontend:  http://localhost:3000
#    API docs:  http://localhost:8000/docs
#    Health:    http://localhost:8000/health
#    n8n:       http://localhost:5678
#    Grafana:   http://localhost:3001  (admin/admin)
#    Prometheus:http://localhost:9090

Smoke test sequence:

GET /health → {"status":"ok"}
POST /api/v1/companies with {"name":"Test","goal":"..."} → returns company id
POST /api/v1/simulations with that company_id + goal → returns simulation_id
Open WS ws://localhost:8000/api/v1/ws/agents/{simulation_id} → watch live events
If finance flags approval → GET /api/v1/approvals?status=pending → POST .../decision
8. Startup Order & Dependencies (Important for Debugging)
scss

Copy code
postgres (healthcheck) ─┐
redis    (healthcheck) ─┼─► backend ─► frontend
                        └─► worker

backend lifespan calls init_checkpointer() → runs checkpointer.setup() which CREATES the LangGraph checkpoint tables. This must succeed at startup.
If Postgres isn't ready, backend crashes on boot → compose healthchecks handle ordering.
9. Debugging Playbook (Common Failures)
A. Backend won't start
Symptom	Likely cause	Fix
connection refused to postgres	Postgres not healthy yet	Check docker compose ps; wait for healthy; verify DB_PASS matches
password authentication failed	.env DB_PASS ≠ compose env	Align DB_PASS in .env and docker-compose.yml
relation "checkpoints" does not exist	init_checkpointer() didn't run / used wrong URL	Ensure DATABASE_URL_SYNC correct; check lifespan ran
ModuleNotFoundError app...	volume mount or build issue	make build again; confirm volumes: ./backend:/app
B. Agents error / empty responses
Symptom	Cause	Fix
AuthenticationError / 401 from OpenAI	missing/invalid OPENAI_API_KEY	set valid key in .env, restart backend
Agent runs but no artifacts	_worker_result import missing	ensure worker agents from app.agents._shared import _worker_result
FileNotFoundError ...revenue_latest.pkl	ML models not trained	run make train
pgvector errors on recall	vector extension missing	confirm image is pgvector/pgvector:pg16; CREATE EXTENSION vector in migration
C. Graph doesn't progress / never ends
Symptom	Cause	Fix
Stuck on CEO loop	tasks never marked done	check _worker_result marks first pending task done; check route() logic
Infinite CEO↔worker	route returns wrong agent	verify supervisor.route() returns END when no pending tasks
Graph paused forever	approval never resolved	check approvals table; POST decision to resume
D. Human approval / resume issues
Symptom	Cause	Fix
Resume does nothing	wrong thread_id	confirm simulation.thread_id passed to resume_graph
interrupt_before not pausing	graph compiled without it	check builder.py: compile(..., interrupt_before=["human"])
State lost on resume	checkpointer not shared	get_checkpointer() must be singleton; same DB
E. WebSocket / real-time UI silent
Symptom	Cause	Fix
No events in frontend	Redis pub/sub channel mismatch	channel = sim:{sim_id}:events; ensure publish + subscribe use same sim_id
WS connects then closes	nginx not upgrading	use provided nginx WS config (Upgrade/Connection headers)
Events published but not seen	frontend WS URL wrong	check NEXT_PUBLIC_WS_URL
F. Migrations
Symptom	Cause	Fix
Alembic can't load plugin asyncpg	using async URL for alembic	alembic must use DATABASE_URL_SYNC (see env.py)
type "vector" does not exist	extension not created first	migration must CREATE EXTENSION IF NOT EXISTS vector before memories table
G. ML endpoints
Symptom	Cause	Fix
KeyError in /ml/{model}/predict	inputs missing required feature	match FEATURE_ORDER[model] keys exactly
FileNotFoundError	model not trained	make train
10. Key Code Contracts (Don't Break These)
CompanyState reducers (graph/state.py): messages uses add_messages,
decision_log/usage use additive reducers. Returning a full list overwrites
incorrectly — return only the delta from each node.

Node return shape: every agent node returns a partial CompanyState dict.
usage is popped in nodes._run() and accounted separately (not stored in state
beyond reduction).

Task lifecycle: CEO creates tasks (status=pending). Each worker marks its
first matching pending task done. route() ends graph when none pending.

Approval gate: any node setting requires_approval=True + approval_payload
causes route() → "human", which interrupts BEFORE the human node. API resumes it.

Checkpointer singleton: memory/checkpointer.py holds one AsyncPostgresSaver.
The compiled graph and resume calls MUST use the same instance + same thread_id.

Two DB URLs: app=async (DATABASE_URL), alembic+checkpointer=sync (DATABASE_URL_SYNC).

11. Observability
LangSmith: set LANGCHAIN_TRACING_V2=true + LANGCHAIN_API_KEY. Every agent/graph run auto-traced under project ai-business-simulator.
Prometheus: scrapes backend:8000/prometheus. Metrics: agent_runs_total, agent_latency_seconds, agent_errors_total, tokens_total, ml_inference_seconds, approval_queue_depth.
Grafana: http://localhost:3001, add Prometheus datasource http://prometheus:9090.
Token cost: stored per call in token_usage; query GET /api/v1/metrics/tokens.
12. API Reference (Quick)
Method	Path	Body	Purpose
GET	/health	—	liveness
POST	/api/v1/companies	name, industry, business_goal	create company + 6 agents
GET	/api/v1/companies/{id}	—	get company
POST	/api/v1/simulations	company_id, goal	start sim (async graph)
GET	/api/v1/simulations/{id}/state	—	current graph state + next
WS	/api/v1/ws/agents/{sim_id}	—	live event stream
POST	/api/v1/chat/{sim_id}	message	user message
GET	/api/v1/approvals?status=pending	—	approval queue
POST	/api/v1/approvals/{id}/decision	decision (approved/rejected)	resume graph
GET	/api/v1/agents/{company_id}/metrics	—	per-agent tokens/cost
POST	/api/v1/ml/{model}/predict	inputs{}	revenue/churn/demand/success
GET	/api/v1/metrics/tokens	—	total tokens + cost
GET	/api/v1/decisions?company_id=	—	decision history
ML model ∈ {revenue, success, churn, demand}. Required input keys per model:

revenue: leads, conversion, avg_deal, marketing_spend, month
success: funding, team_size, market_size, traction
churn: usage, tenure_months, tickets, nps
demand: history, trend, seasonality
13. How to Ask Claude for Help (Prompt Template)
When debugging, give Claude:

This document (for context).
The exact error/traceback.
The relevant file(s) mentioned in the traceback.
What you did (which make command / API call).
Output of docker compose ps and docker compose logs backend --tail=50.
Example prompt:

"Using PROJECT_GUIDE.md as context: my backend crashes on startup with
relation 'checkpoints' does not exist. Here are logs [...] and
graph/checkpoints.py [...]. Which fix from section 9 applies and why?"

14. Known Limitations / TODO (For Extension)
web_search tool is stubbed — plug in Tavily/SerpAPI/Exa for real research.
ML models trained on synthetic data (make_classification/make_regression) in train_all.py — replace with real datasets for meaningful predictions.
No auth enforced on routes yet (JWT helper exists in core/security.py).
n8n workflows are templates — set real credentials (email, scrape targets).
worker.py is a placeholder loop — extend for scheduled jobs/queue consumers.
Demand model uses XGBoost regressor stub; swap to Prophet for true time series.
15. Minimal Mental Model (TL;DR for Claude)
FastAPI receives a goal → starts a LangGraph run in the background → CEO agent
creates tasks and routes to worker agents one by one → each agent uses an LLM +
tools + pgvector memory and produces an artifact → finance can pause the graph for
human approval (LangGraph interrupt + Postgres checkpoint) → approving resumes from
the saved checkpoint → every step is streamed via Redis→WebSocket to the Next.js UI
→ tokens/metrics tracked in Postgres + Prometheus + LangSmith.

The two things that break most often: (1) missing OPENAI_API_KEY, and
(2) ML .pkl artifacts not generated (make train). Check those first.

markdown

Copy code

---

This `PROJECT_GUIDE.md` gives Claude (or any developer) everything needed: architecture, data flow, file map, env setup, run steps, a **failure-mode debugging table**, code contracts that must not break, and a ready-to-use prompt template.

**Recommended companion files to also share with Claude when debugging:**
1. The actual traceback/error output
2. `docker compose logs backend --tail=100`
3. The specific file mentioned in the error

Would you like me to also generate:
1. A **`TROUBLESHOOTING.md`** with copy-paste diagnostic commands (e.g., `docker exec` into Postgres to inspect checkpoint tables)?
2. A **`README.md`** (shorter, user-facing quick start)?
3. An **architecture diagram image** to embed in the docs?