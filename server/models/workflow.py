from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class LocationContext(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    query: Optional[str] = None

class StepModel(BaseModel):
    stepId: int
    title: str
    description: str
    subSteps: List[str] = []
    documents: List[str] = []
    source: Optional[str] = None

class WorkflowModel(BaseModel):
    goal: str
    steps: List[StepModel] = []
    locationContext: Optional[LocationContext] = None
    confidenceScore: Optional[int] = None
    guestId: str
    language: Optional[str] = 'English'
    createdAt: datetime = Field(default_factory=datetime.utcnow)
