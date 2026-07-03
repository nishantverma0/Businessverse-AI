import logging
import time
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage
from app.config import settings
from app.memory.semantic import remember, recall
from app.observability.metrics import AGENT_RUNS, AGENT_LATENCY, AGENT_ERRORS
from app.observability.tokens import account_tokens

log = logging.getLogger(__name__)

class BaseAgent:
    role: str = "base"
    system_prompt: str = "You are a helpful assistant."

    def __init__(self):
        self.llm = ChatGroq(
            model=settings.llm_model,
            api_key=settings.openai_api_key,
            temperature=0.7,
        )

    def _usage(self, response):
        meta = getattr(response, "usage_metadata", {}) or {}
        return {
            "prompt_tokens": meta.get("input_tokens", 0),
            "completion_tokens": meta.get("output_tokens", 0),
            "total_tokens": meta.get("total_tokens", 0),
        }

    def _postprocess(self, response, state):
        return {"messages": [response], "usage": self._usage(response)}

    async def act(self, state: dict) -> dict:
        start = time.time()
        AGENT_RUNS.labels(agent=self.role).inc()
        try:
            memories = await recall(state["company_id"], state["business_goal"])
            memory_context = "\n".join(memories) if memories else "No prior context."
            system = self.system_prompt + "\n\nRelevant memory:\n" + memory_context
            messages = [SystemMessage(content=system)] + state["messages"]
            response = await self.llm.ainvoke(messages)
            await remember(state["company_id"], self.role, response.content)
            usage = self._usage(response)
            await account_tokens(
                state["company_id"], state["simulation_id"],
                self.role, usage,
            )
            AGENT_LATENCY.labels(agent=self.role).observe(time.time() - start)
            result = self._postprocess(response, state)
            return result
        except Exception as e:
            AGENT_ERRORS.labels(agent=self.role).inc()
            log.error(str(e))
            raise