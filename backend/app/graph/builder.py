from langgraph.graph import StateGraph, START, END
from app.graph.state import CompanyState
from app.graph import nodes
from app.graph.supervisor import route
from app.memory.checkpointer import get_checkpointer

_graph = None

async def get_graph():
    global _graph
    if _graph is None:
        cp = await get_checkpointer()
        g = StateGraph(CompanyState)
        g.add_node("ceo", nodes.ceo_node)
        g.add_node("pm", nodes.pm_node)
        g.add_node("marketing", nodes.marketing_node)
        g.add_node("sales", nodes.sales_node)
        g.add_node("finance", nodes.finance_node)
        g.add_node("research", nodes.research_node)
        g.add_node("human", nodes.human_checkpoint_node)

        g.add_edge(START, "ceo")
        g.add_conditional_edges("ceo", route, {
            "pm": "pm", "marketing": "marketing", "sales": "sales",
            "finance": "finance", "research": "research", "human": "human", "END": END,
        })
        for w in ["pm", "marketing", "sales", "finance", "research"]:
            g.add_edge(w, "ceo")
        g.add_edge("human", "ceo")
        _graph = g.compile(checkpointer=cp, interrupt_before=["human"])
    return _graph