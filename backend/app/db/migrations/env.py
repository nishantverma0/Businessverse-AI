from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from app.config import settings
from app.db.base import Base
import app.db.models  # noqa: F401  (register tables)

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url_sync)
if config.config_file_name:
    fileConfig(config.config_file_name)
target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as conn:
        context.configure(connection=conn, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()

run_migrations_online()