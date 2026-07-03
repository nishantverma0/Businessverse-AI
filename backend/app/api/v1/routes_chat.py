from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.db.models import Message
from app.schemas import ChatIn
from app.core.events import publish_event

router = APIRouter()

@router.post("/chat/{sid}")
async def chat(sid: str, body: ChatIn, db: AsyncSession = Depends(get_session)):
    db.add(Message(simulation_id=sid, role="user", content=body.message))
    await db.commit()
    await publish_event(sid, {"type": "user_message", "content": body.message})
    return {"ok": True}