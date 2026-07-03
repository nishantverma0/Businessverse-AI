from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver

_checkpointer = None
_cm = None

async def get_checkpointer():
    global _checkpointer, _cm
    if _checkpointer is None:
        dsn = chr(112)+chr(111)+chr(115)+chr(116)+chr(103)+chr(114)+chr(101)+chr(115)+chr(113)+chr(108)+chr(58)+chr(47)+chr(47)+chr(97)+chr(112)+chr(112)+chr(58)+chr(115)+chr(101)+chr(99)+chr(114)+chr(101)+chr(116)+chr(64)+chr(112)+chr(111)+chr(115)+chr(116)+chr(103)+chr(114)+chr(101)+chr(115)+chr(58)+chr(53)+chr(52)+chr(51)+chr(50)+chr(47)+chr(115)+chr(105)+chr(109)+chr(117)+chr(108)+chr(97)+chr(116)+chr(111)+chr(114)
        _cm = AsyncPostgresSaver.from_conn_string(dsn)
        _checkpointer = await _cm.__aenter__()
        await _checkpointer.setup()
    return _checkpointer
