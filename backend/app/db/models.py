import uuid
from sqlalchemy import (Column, Text, Integer, ForeignKey, DateTime, Numeric, func)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from app.db.base import Base

def pk(): return Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
def ts(): return Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = pk()
    email = Column(Text, unique=True, nullable=False)
    name = Column(Text)
    role = Column(Text, default="operator")
    created_at = ts()

class Company(Base):
    __tablename__ = "companies"
    id = pk()
    name = Column(Text, nullable=False)
    industry = Column(Text)
    business_goal = Column(Text)
    stage = Column(Text, default="ideation")
    created_at = ts()
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

class Agent(Base):
    __tablename__ = "agents"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    role = Column(Text, nullable=False)
    status = Column(Text, default="idle")
    config = Column(JSONB, default=dict)
    created_at = ts()

class Simulation(Base):
    __tablename__ = "simulations"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    thread_id = Column(Text, unique=True, nullable=False)
    status = Column(Text, default="running")
    started_at = ts()
    ended_at = Column(DateTime(timezone=True))

class Message(Base):
    __tablename__ = "messages"
    id = pk()
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"))
    agent_role = Column(Text)
    role = Column(Text, nullable=False)
    content = Column(Text)
    tool_calls = Column(JSONB)
    created_at = ts()

class Task(Base):
    __tablename__ = "tasks"
    id = pk()
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"))
    assignee = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Text, default="pending")
    priority = Column(Integer, default=3)
    created_at = ts()
    completed_at = Column(DateTime(timezone=True))

class Artifact(Base):
    __tablename__ = "artifacts"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    type = Column(Text, nullable=False)
    title = Column(Text)
    content = Column(JSONB, default=dict)
    version = Column(Integer, default=1)
    created_by = Column(Text)
    created_at = ts()

class Decision(Base):
    __tablename__ = "decisions"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id", ondelete="SET NULL"))
    agent_role = Column(Text)
    decision_type = Column(Text)
    payload = Column(JSONB, default=dict)
    approved_by = Column(Text)
    created_at = ts()

class Approval(Base):
    __tablename__ = "approvals"
    id = pk()
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"))
    agent_role = Column(Text)
    summary = Column(Text)
    payload = Column(JSONB, default=dict)
    status = Column(Text, default="pending")
    decided_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"))
    decided_at = Column(DateTime(timezone=True))
    created_at = ts()

class Memory(Base):
    __tablename__ = "memories"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    namespace = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536))
    meta = Column("metadata", JSONB, default=dict)
    created_at = ts()

class MLPrediction(Base):
    __tablename__ = "ml_predictions"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    model = Column(Text, nullable=False)
    inputs = Column(JSONB, default=dict)
    output = Column(JSONB, default=dict)
    model_version = Column(Text)
    created_at = ts()

class TokenUsage(Base):
    __tablename__ = "token_usage"
    id = pk()
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"))
    simulation_id = Column(UUID(as_uuid=True), ForeignKey("simulations.id", ondelete="CASCADE"))
    agent_role = Column(Text)
    model = Column(Text)
    prompt_tokens = Column(Integer, default=0)
    completion_tokens = Column(Integer, default=0)
    total_tokens = Column(Integer, default=0)
    cost_usd = Column(Numeric(10, 5), default=0)
    created_at = ts()