import httpx
from langchain_core.tools import tool
from app.config import settings

@tool
async def trigger_n8n(workflow: str, payload: dict) -> dict:
    """Trigger an n8n workflow (e.g. competitor_monitor, weekly_report)."""
    url = f"{settings.n8n_webhook_url}/{workflow}"
    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.post(url, json=payload)
        return {"status": r.status_code}