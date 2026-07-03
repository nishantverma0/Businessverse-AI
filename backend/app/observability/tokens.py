from app.db.session import AsyncSessionLocal
from app.db.models import TokenUsage
from app.observability.metrics import TOKENS
from app.config import settings

# Approx USD per 1K tokens (gpt-4o)
COST = {"prompt": 0.0025 / 1000, "completion": 0.01 / 1000}

async def account_tokens(company_id, simulation_id, agent_role, usage: dict):
    if not usage:
        return
    pt = usage.get("prompt_tokens", 0)
    ct = usage.get("completion_tokens", 0)
    total = usage.get("total_tokens", pt + ct)
    cost = pt * COST["prompt"] + ct * COST["completion"]
    TOKENS.labels(agent=agent_role, type="prompt").inc(pt)
    TOKENS.labels(agent=agent_role, type="completion").inc(ct)
    async with AsyncSessionLocal() as db:
        db.add(TokenUsage(company_id=company_id, simulation_id=simulation_id,
                          agent_role=agent_role, model=settings.llm_model,
                          prompt_tokens=pt, completion_tokens=ct,
                          total_tokens=total, cost_usd=round(cost, 5)))
        await db.commit()