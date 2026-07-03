from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.db.models import Company, Agent
from app.schemas import CompanyCreate, CompanyOut

router = APIRouter()
ROLES = ["ceo", "pm", "marketing", "sales", "finance", "research"]

@router.post("/companies", response_model=CompanyOut)
async def create_company(body: CompanyCreate, db: AsyncSession = Depends(get_session)):
    c = Company(**body.model_dump())
    db.add(c)
    await db.flush()
    for r in ROLES:
        db.add(Agent(company_id=c.id, role=r))
    await db.commit()
    await db.refresh(c)
    return c

@router.get("/companies/{cid}", response_model=CompanyOut)
async def get_company(cid: str, db: AsyncSession = Depends(get_session)):
    c = await db.get(Company, cid)
    if not c:
        raise HTTPException(404, "Company not found")
    return c

@router.get("/companies", response_model=list[CompanyOut])
async def list_companies(db: AsyncSession = Depends(get_session)):
    res = await db.execute(select(Company))
    return res.scalars().all()