from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.db.models import Agent

router = APIRouter()


@router.get("/agents/roster")
async def get_roster(db: AsyncSession = Depends(get_session)):
    result = await db.execute(select(Agent))
    agents = result.scalars().all()

    return [
        {
            "id": str(agent.id),
            "company_id": str(agent.company_id),
            "role": agent.role,
            "status": agent.status,
        }
        for agent in agents
    ]


@router.get("/agents/{company_id}")
async def list_agents(company_id: str, db: AsyncSession = Depends(get_session)):
    result = await db.execute(
        select(Agent).where(Agent.company_id == company_id)
    )
    return result.scalars().all()


@router.get("/agents/{company_id}/metrics")
async def agent_metrics(company_id: str, db: AsyncSession = Depends(get_session)):
    ...