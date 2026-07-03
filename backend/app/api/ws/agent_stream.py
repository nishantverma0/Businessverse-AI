import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.events import subscribe

router = APIRouter()

@router.websocket("/ws/agents/{sim_id}")
async def agent_stream(ws: WebSocket, sim_id: str):
    await ws.accept()
    pubsub = await subscribe(sim_id)
    try:
        async for msg in pubsub.listen():
            if msg["type"] == "message":
                await ws.send_text(msg["data"])
    except WebSocketDisconnect:
        await pubsub.unsubscribe()