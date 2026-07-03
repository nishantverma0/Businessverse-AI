from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from app.config import settings

_checkpointer = None
_cm = None

def _dsn(url):
    for prefix in [chr(112)+chr(111)+chr(115)+chr(116)+chr(103)+chr(114)+chr(101)+chr(115)+chr(113)+chr(108)+chr(43)+chr(112)+chr(115)+chr(121)+chr(99)+chr(111)+chr(112)+chr(103)+chr(58)+chr(47)+chr(47)]:
        url = url.replace(prefix, chr(112)+chr(111)+chr(115)+chr(116)+chr(103)+chr(114)+chr(101)+chr(115)+chr(113)+chr(108)+chr(58)+chr(47)+chr(47))
    return url

async def get_checkpointer():
    global _checkpointer, _cm
    if _checkpointer is None:
        dsn = _dsn(settings.database_url_sync)
        _cm = AsyncPostgresSaver.from_conn_string(dsn)
        _checkpointer = await _cm.__aenter__()
        await _checkpointer.setup()
    return _checkpointer
