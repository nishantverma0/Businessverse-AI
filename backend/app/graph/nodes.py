from app.agents.ceo import CEOAgent
from app.agents.product_manager import PMAgent
from app.agents.marketing import MarketingAgent
from app.agents.sales import SalesAgent
from app.agents.finance import FinanceAgent
from app.agents.research import ResearchAgent
from app.observability.tokens import account_tokens

async def _run(agent, state):
    result = await agent.act(state)
    await account_tokens(state["company_id"], state.get("simulation_id"),
                         agent.name, result.pop("usage", {}))
    return result

async def ceo_node(state):       return await _run(CEOAgent(), state)
async def pm_node(state):        return await _run(PMAgent(), state)
async def marketing_node(state): return await _run(MarketingAgent(), state)
async def sales_node(state):     return await _run(SalesAgent(), state)
async def finance_node(state):   return await _run(FinanceAgent(), state)
async def research_node(state):  return await _run(ResearchAgent(), state)

async def human_checkpoint_node(state):
    decision = (state.get("approval_payload") or {}).get("decision", "approved")
    return {"requires_approval": False,
            "decision_log": [{"type": "human_approval", "decision": decision}]}