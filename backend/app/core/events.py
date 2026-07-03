import json
import redis.asyncio as redis
from app.config import settings

_redis = redis.from_url(settings.redis_url, decode_responses=True)

def channel(sim_id: str) -> str:
    return f"sim:{sim_id}:events"

async def publish_event(sim_id: str, event: dict):
    await _redis.publish(channel(sim_id), json.dumps(event, default=str))

async def subscribe(sim_id: str):
    pubsub = _redis.pubsub()
    await pubsub.subscribe(channel(sim_id))
    return pubsub