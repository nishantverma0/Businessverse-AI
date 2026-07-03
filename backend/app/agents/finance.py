from app.agents._shared import _worker_result
from app.agents.base import BaseAgent
from app.agents.prompts import FINANCE
from app.tools.finance_calc import budget_calc, cash_flow_forecast
from app.tools.ml_predict import predict_revenue

class FinanceAgent(BaseAgent):
    name = "finance"
    role = "Finance"
    system_prompt = FINANCE
    tools = [budget_calc, cash_flow_forecast, predict_revenue]

    def _postprocess(self, resp, state):
        needs = "approval" in (resp.content or "").lower()
        res = _worker_result("finance", "financial_report", resp, state)
        if needs:
            res["requires_approval"] = True
            res["approval_payload"] = {"agent": "finance", "summary": resp.content[:500]}
        return res