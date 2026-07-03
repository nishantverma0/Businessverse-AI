from app.memory.checkpointer import get_checkpointer

async def init_checkpointer():
    await get_checkpointer()
