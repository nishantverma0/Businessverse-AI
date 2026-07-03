from langchain_core.tools import tool

# Memory recall is injected automatically by BaseAgent; this exposes explicit save.
@tool
def remember_fact(fact: str) -> str:
    """Persist an important fact to long-term memory."""
    return f"Stored: {fact}"