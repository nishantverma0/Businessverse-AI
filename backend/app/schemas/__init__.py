from pydantic import BaseModel
from uuid import UUID

class CompanyCreate(BaseModel):
    name: str
    industry: str | None = None
    business_goal: str | None = None

class CompanyOut(BaseModel):
    id: UUID
    name: str
    industry: str | None
    business_goal: str | None
    stage: str
    class Config: from_attributes = True

class StartSim(BaseModel):
    company_id: UUID
    goal: str

class ChatIn(BaseModel):
    message: str

class Decision(BaseModel):
    decision: str  # approved | rejected

class MLRequest(BaseModel):
    company_id: UUID | None = None
    inputs: dict