import os
from app.config import settings

if settings.env != "test":
    os.environ.setdefault("LANGCHAIN_TRACING_V2", "true")
    os.environ.setdefault("LANGCHAIN_PROJECT", "ai-business-simulator")