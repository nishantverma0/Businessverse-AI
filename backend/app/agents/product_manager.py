from app.agents._shared import _worker_result
from app.agents.base import BaseAgent
from app.agents.prompts import PM

class PMAgent(BaseAgent):
    name = "pm"
    role = "Product Manager"
    system_prompt = PM

    def _postprocess(self, resp, state):
        return _worker_result("pm", "prd", resp, state)