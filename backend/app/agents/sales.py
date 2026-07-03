from app.agents._shared import _worker_result
from app.agents.base import BaseAgent
from app.agents.prompts import SALES
from app.tools.ml_predict import predict_revenue

class SalesAgent(BaseAgent):
    name = "sales"
    role = "Sales"
    system_prompt = SALES
    tools = [predict_revenue]

    def _postprocess(self, resp, state):
        return _worker_result("sales", "sales_plan", resp, state)