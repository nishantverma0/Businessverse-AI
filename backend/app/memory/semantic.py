from sqlalchemy import text
from app.db.session import AsyncSessionLocal
from app.db.models import Memory


class SemanticMemory:
    def __init__(self, namespace: str, company_id: str):
        self.ns = namespace
        self.company_id = company_id

    async def remember(self, content: str, meta: dict | None = None):
        try:
            async with AsyncSessionLocal() as db:
                db.add(Memory(
                    company_id=self.company_id,
                    namespace=self.ns,
                    content=content,
                    embedding=None,
                    metadata=meta or {}
                ))
                await db.commit()
        except Exception:
            pass

    async def recall(self, query: str, k: int = 5) -> list[str]:
        try:
            async with AsyncSessionLocal() as db:
                rows = await db.execute(text("""
                    SELECT content FROM memories
                    WHERE namespace = :ns AND company_id = :cid
                    LIMIT :k
                """), {"ns": self.ns, "cid": self.company_id, "k": k})
                return [r[0] for r in rows.fetchall()]
        except Exception:
            return []


async def remember(company_id: str, namespace: str, content: str):
    mem = SemanticMemory(namespace=namespace, company_id=company_id)
    await mem.remember(content)


async def recall(company_id: str, query: str, k: int = 5) -> list[str]:
    mem = SemanticMemory(namespace="general", company_id=company_id)
    return await mem.recall(query, k)