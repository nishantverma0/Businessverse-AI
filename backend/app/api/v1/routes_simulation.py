import asyncio
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_session
from app.db.models import Company
from app.schemas import StartSim
from app.services.simulation_service import create_simulation, run_graph_streaming
from app.graph.builder import get_graph

router = APIRouter()

@router.post("/simulations")
async def start_sim(body: StartSim, db: AsyncSession = Depends(get_session)):
    company = await db.get(Company, body.company_id)
    sim = await create_simulation(str(body.company_id))
    init = {
        "company_id": str(body.company_id),
        "simulation_id": str(sim.id),
        "business_goal": body.goal,
        "messages": [("user", body.goal)],
        "tasks": [], "artifacts": {}, "ml_insights": {},
        "requires_approval": False, "decision_log": [],
    }
    asyncio.create_task(run_graph_streaming(init, sim.thread_id, str(sim.id)))
    return {"simulation_id": str(sim.id), "thread_id": sim.thread_id}

@router.get("/simulations/{sid}/state")
async def sim_state(sid: str, db: AsyncSession = Depends(get_session)):
    from app.db.models import Simulation
    sim = await db.get(Simulation, sid)
    graph = await get_graph()
    snap = await graph.aget_state({"configurable": {"thread_id": sim.thread_id}})
    return {"status": sim.status, "values": snap.values, "next": snap.next}