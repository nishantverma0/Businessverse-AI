import asyncio, uuid
from app.db.session import AsyncSessionLocal
from app.db.models import Simulation, Approval
from app.core.events import publish_event
from app.graph.builder import get_graph
from app.ml.registry import ModelRegistry

async def create_simulation(company_id: str) -> Simulation:
    async with AsyncSessionLocal() as db:
        sim = Simulation(company_id=company_id, thread_id=str(uuid.uuid4()))
        db.add(sim)
        await db.commit()
        await db.refresh(sim)
        return sim

async def run_graph_streaming(init: dict, thread_id: str, sim_id: str):
    graph = await get_graph()
    config = {"configurable": {"thread_id": thread_id}}
    try:
        async for event in graph.astream(init, config, stream_mode="updates"):
            await publish_event(sim_id, {"type": "update", "data": event})
        # Detect interrupt (paused for approval)
        snap = await graph.aget_state(config)
        if snap.next and "human" in snap.next:
            await _create_approval(sim_id, snap.values.get("approval_payload", {}))
            await _set_status(sim_id, "paused_for_approval")
            await publish_event(sim_id, {"type": "paused", "reason": "approval"})
        else:
            await _set_status(sim_id, "done")
            await publish_event(sim_id, {"type": "done"})
    except Exception as e:
        import traceback, logging
        logging.getLogger(__name__).error(traceback.format_exc())
        await _set_status(sim_id, "failed")
        await publish_event(sim_id, {"type": "error", "message": str(e)})

async def resume_graph(thread_id: str, sim_id: str, decision: str):
    graph = await get_graph()
    config = {"configurable": {"thread_id": thread_id}}
    await graph.aupdate_state(config, {"approval_payload": {"decision": decision}})
    await _set_status(sim_id, "running")
    async for event in graph.astream(None, config, stream_mode="updates"):
        await publish_event(sim_id, {"type": "update", "data": event})
    await _set_status(sim_id, "done")
    await publish_event(sim_id, {"type": "done"})

async def _create_approval(sim_id, payload):
    async with AsyncSessionLocal() as db:
        db.add(Approval(simulation_id=sim_id, agent_role=payload.get("agent"),
                        summary=payload.get("summary", ""), payload=payload))
        await db.commit()

async def _set_status(sim_id, status):
    async with AsyncSessionLocal() as db:
        sim = await db.get(Simulation, uuid.UUID(sim_id))
        if sim:
            sim.status = status
            await db.commit()