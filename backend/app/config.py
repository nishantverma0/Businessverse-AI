from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # LLM
    openai_api_key: str = ""
    openai_api_base: str = "https://api.groq.com/openai/v1"
    llm_model: str = "llama-3.3-70b-versatile"
    embed_model: str = "text-embedding-3-small"

    # DB
    database_url: str = "postgresql+psycopg://app:secret@postgres:5432/simulator"
    database_url_sync: str = "postgresql+psycopg://app:secret@postgres:5432/simulator"

    # Redis
    redis_url: str = "redis://redis:6379/0"

    # Auth
    jwt_secret: str = "change-me"
    jwt_algo: str = "HS256"
    access_token_expire_minutes: int = 1440

    # n8n
    n8n_webhook_url: str = "http://n8n:5678/webhook"
    n8n_api_key: str = ""

    env: str = "development"
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

@lru_cache
def get_settings() -> Settings:
    return Settings()

settings = get_settings()