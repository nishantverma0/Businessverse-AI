import asyncio
from app.db.session import AsyncSessionLocal
from app.db.models import Company, User

async def seed():
    async with AsyncSessionLocal() as db:
        db.add(User(email="admin@sim.ai", name="Admin", role="admin"))
        db.add(Company(name="Acme AI", industry="SaaS",
                       business_goal="Launch an AI note-taking app", stage="ideation"))
        await db.commit()
    print("Seeded.")

if __name__ == "__main__":
    asyncio.run(seed())