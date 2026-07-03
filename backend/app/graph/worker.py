"""Background worker — graph runs are launched as asyncio tasks from the API.
This process hosts scheduled jobs / queue consumers."""
import asyncio
import logging

log = logging.getLogger(__name__)

async def main():
    # Retry loop: postgres may not be fully ready at container start
    # even after the healthcheck, especially on first boot.
    for attempt in range(10):
        try:
            from app.graph.checkpoints import init_checkpointer
            await init_checkpointer()
            log.info("Worker ready — checkpointer initialised.")
            break
        except Exception as exc:
            wait = 3 * (attempt + 1)
            log.warning(
                f"Checkpointer init failed (attempt {attempt+1}/10): {exc}. "
                f"Retrying in {wait}s..."
            )
            await asyncio.sleep(wait)
    else:
        log.error("Could not initialise checkpointer after 10 attempts. Exiting.")
        return

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())