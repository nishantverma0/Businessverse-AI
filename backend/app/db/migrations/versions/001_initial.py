"""initial schema"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector

revision = "001_initial"
down_revision = None

def upgrade():
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')
    op.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto"')
    op.execute("""
    CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
    BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
    """)

    op.create_table('users',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('email', sa.Text, unique=True, nullable=False),
        sa.Column('name', sa.Text),
        sa.Column('role', sa.Text, server_default='operator'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('companies',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.Text, nullable=False),
        sa.Column('industry', sa.Text),
        sa.Column('business_goal', sa.Text),
        sa.Column('stage', sa.Text, server_default='ideation'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('agents',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('role', sa.Text, nullable=False),
        sa.Column('status', sa.Text, server_default='idle'),
        sa.Column('config', JSONB, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('simulations',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('thread_id', sa.Text, unique=True, nullable=False),
        sa.Column('status', sa.Text, server_default='running'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('ended_at', sa.DateTime(timezone=True)),
    )

    op.create_table('messages',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('simulation_id', UUID(as_uuid=True), sa.ForeignKey('simulations.id', ondelete='CASCADE')),
        sa.Column('agent_role', sa.Text),
        sa.Column('role', sa.Text, nullable=False),
        sa.Column('content', sa.Text),
        sa.Column('tool_calls', JSONB),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('tasks',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('simulation_id', UUID(as_uuid=True), sa.ForeignKey('simulations.id', ondelete='CASCADE')),
        sa.Column('assignee', sa.Text, nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('status', sa.Text, server_default='pending'),
        sa.Column('priority', sa.Integer, server_default='3'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('completed_at', sa.DateTime(timezone=True)),
    )

    op.create_table('artifacts',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('type', sa.Text, nullable=False),
        sa.Column('title', sa.Text),
        sa.Column('content', JSONB, server_default='{}'),
        sa.Column('version', sa.Integer, server_default='1'),
        sa.Column('created_by', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('decisions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('simulation_id', UUID(as_uuid=True), sa.ForeignKey('simulations.id', ondelete='SET NULL'), nullable=True),
        sa.Column('agent_role', sa.Text),
        sa.Column('decision_type', sa.Text),
        sa.Column('payload', JSONB, server_default='{}'),
        sa.Column('approved_by', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('approvals',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('simulation_id', UUID(as_uuid=True), sa.ForeignKey('simulations.id', ondelete='CASCADE')),
        sa.Column('agent_role', sa.Text),
        sa.Column('summary', sa.Text),
        sa.Column('payload', JSONB, server_default='{}'),
        sa.Column('status', sa.Text, server_default='pending'),
        sa.Column('decided_by', UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('memories',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('namespace', sa.Text, nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('embedding', Vector(1536)),
        sa.Column('metadata', JSONB, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )
    op.create_index('memories_embedding_idx', 'memories', ['embedding'],
                    postgresql_using='hnsw',
                    postgresql_with={'m': 16, 'ef_construction': 64},
                    postgresql_ops={'embedding': 'vector_cosine_ops'})

    op.create_table('ml_predictions',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('model', sa.Text, nullable=False),
        sa.Column('inputs', JSONB, server_default='{}'),
        sa.Column('output', JSONB, server_default='{}'),
        sa.Column('model_version', sa.Text),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )

    op.create_table('token_usage',
        sa.Column('id', UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('company_id', UUID(as_uuid=True), sa.ForeignKey('companies.id', ondelete='CASCADE')),
        sa.Column('simulation_id', UUID(as_uuid=True), sa.ForeignKey('simulations.id', ondelete='CASCADE')),
        sa.Column('agent_role', sa.Text),
        sa.Column('model', sa.Text),
        sa.Column('prompt_tokens', sa.Integer, server_default='0'),
        sa.Column('completion_tokens', sa.Integer, server_default='0'),
        sa.Column('total_tokens', sa.Integer, server_default='0'),
        sa.Column('cost_usd', sa.Numeric(10, 5), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
    )


def downgrade():
    for t in ["token_usage", "ml_predictions", "memories", "approvals", "decisions",
              "artifacts", "tasks", "messages", "simulations", "agents", "companies", "users"]:
        op.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS set_updated_at()")