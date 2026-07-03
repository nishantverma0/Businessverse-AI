import operator
from typing import Annotated, TypedDict, Literal
from langgraph.graph.message import add_messages

def merge_usage(a: dict, b: dict) -> dict:
    out = dict(a or {})
    for k, v in (b or {}).items():
        out[k] = out.get(k, 0) + v
    return out

class CompanyState(TypedDict, total=False):
    company_id: str
    simulation_id: str
    messages: Annotated[list, add_messages]
    business_goal: str
    strategy: dict
    tasks: list
    artifacts: dict
    ml_insights: dict
    requires_approval: bool
    approval_payload: dict
    decision_log: Annotated[list, operator.add]
    usage: Annotated[dict, merge_usage]
    next_agent: Literal["ceo","pm","marketing","sales","finance","research","human","END"]