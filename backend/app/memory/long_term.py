from app.db.session import AsyncSessionLocal
from app.db.models import Decision, Artifact

async def log_decision(company_id, simulation_id, agent_role, decision_type, payload, approved_by="auto"):
    async with AsyncSessionLocal() as db:
        db.add(Decision(company_id=company_id, simulation_id=simulation_id,
                        agent_role=agent_role, decision_type=decision_type,
                        payload=payload, approved_by=approved_by))
        await db.commit()

async def save_artifact(company_id, type_, title, content, created_by):
    async with AsyncSessionLocal() as db:
        a = Artifact(company_id=company_id, type=type_, title=title,
                     content=content, created_by=created_by)
        db.add(a)
        await db.commit()
        return str(a.id)