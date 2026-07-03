import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from app.db.session import get_session
from app.db.models import Approval, Simulation
from app.schemas import Decision
from app.services.simulation_service import resume_graph
from app.observability.metrics import APPROVAL_QUEUE

router = APIRouter()

@router.get("/approvals")
async def list_approvals(status: str = "pending", db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Approval).where(Approval.status == status))
    items = res.scalars().all()
    APPROVAL_QUEUE.set(len(items))
    return items

@router.post("/approvals/{aid}/decision")
async def decide(aid: str, body: Decision, db: AsyncSession = Depends(get_session)):
    appr = await db.get(Approval, aid)
    appr.status = body.decision
    appr.decided_at = datetime.now(timezone.utc)
    await db.commit()
    sim = await db.get(Simulation, appr.simulation_id)
    asyncio.create_task(resume_graph(sim.thread_id, str(sim.id), body.decision))
    return {"status": "resumed", "decision": body.decision}