from langchain_core.tools import tool

@tool
def web_search(query: str) -> str:
    """Search the web for market intelligence and competitor data."""
    # Plug in Tavily/SerpAPI/Exa here. Stubbed for portability.
    return f"[search results for '{query}']: Market growing ~18% YoY; top competitors A, B, C."