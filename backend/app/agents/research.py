from app.agents._shared import _worker_result
from app.agents.base import BaseAgent
from app.agents.prompts import RESEARCH
from app.tools.web_search import web_search

class ResearchAgent(BaseAgent):
    name = "research"
    role = "Research"
    system_prompt = RESEARCH
    tools = [web_search]

    def _postprocess(self, resp, state):
        return _worker_result("research", "market_intel", resp, state)