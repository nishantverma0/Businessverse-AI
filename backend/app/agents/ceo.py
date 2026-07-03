import json, re
from app.agents.base import BaseAgent
from app.agents.prompts import CEO
from app.tools.ml_predict import predict_success

class CEOAgent(BaseAgent):
    name = "ceo"
    role = "CEO"
    system_prompt = CEO
    tools = [predict_success]

    def _postprocess(self, resp, state):
        tasks = state.get("tasks", [])
        # Parse a JSON task list if CEO emitted one and no tasks exist yet
        if not tasks:
            tasks = self._extract_tasks(resp.content)
        return {
            "messages": [resp],
            "strategy": {"summary": resp.content[:1000]},
            "tasks": tasks,
            "decision_log": [{"agent": "ceo", "action": "strategy_set"}],
            "usage": self._usage(resp),
        }

    def _extract_tasks(self, text):
        m = re.search(r"\[.*\]", text, re.DOTALL)
        if m:
            try:
                raw = json.loads(m.group())
                return [{"assignee": t.get("assignee", "research"),
                         "description": t.get("description", ""),
                         "status": "pending"} for t in raw]
            except Exception:
                pass
        # Fallback default plan
        return [
            {"assignee": "research", "description": "Market research", "status": "pending"},
            {"assignee": "pm", "description": "Product roadmap + PRD", "status": "pending"},
            {"assignee": "marketing", "description": "Launch campaign", "status": "pending"},
            {"assignee": "sales", "description": "Sales plan", "status": "pending"},
            {"assignee": "finance", "description": "Budget + cash flow", "status": "pending"},
        ]