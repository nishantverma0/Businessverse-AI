from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.db.models import TokenUsage, Decision

router = APIRouter()

@router.get("/metrics/tokens")
async def tokens(db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(
        func.sum(TokenUsage.total_tokens), func.sum(TokenUsage.cost_usd)))
    row = res.one()
    return {"total_tokens": int(row[0] or 0), "total_cost_usd": float(row[1] or 0)}

@router.get("/decisions")
async def decisions(company_id: str, db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Decision).where(Decision.company_id == company_id))
    return res.scalars().all()