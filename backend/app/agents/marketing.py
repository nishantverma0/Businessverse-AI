from app.agents._shared import _worker_result
from app.agents.base import BaseAgent
from app.agents.prompts import MARKETING
from app.tools.web_search import web_search

class MarketingAgent(BaseAgent):
    name = "marketing"
    role = "Marketing"
    system_prompt = MARKETING
    tools = [web_search]

    def _postprocess(self, resp, state):
        return _worker_result("marketing", "campaign", resp, state)