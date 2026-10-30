from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class WorkflowStep(BaseModel):
    id: str
    name: str
    tool: str
    description: str
    requires_approval: bool = False
    depends_on: List[str] = Field(default_factory=list)

class WorkflowPlanRequest(BaseModel):
    goal: str
    preferences: Optional[dict] = None

class WorkflowCreate(BaseModel):
    name: str
    goal: str
    steps: List[WorkflowStep]
    schedule_cron: Optional[str] = None

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    steps: Optional[List[WorkflowStep]] = None
    enabled: Optional[bool] = None
    schedule_cron: Optional[str] = None

class WorkflowResponse(BaseModel):
    id: str
    name: str
    goal: str
    steps: List[WorkflowStep]
    enabled: bool
    schedule_cron: Optional[str] = None
    created_at: str
    updated_at: str
    last_run_at: Optional[str] = None
    last_run_status: Optional[str] = None

class StepRunResponse(BaseModel):
    step_run_id: str
    run_id: str
    step_id: str
    tool_name: str
    name: str
    status: str
    input_summary: Optional[str] = None
    output_summary: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    retry_count: int = 0
    error_details: Optional[str] = None

class WorkflowRunResponse(BaseModel):
    run_id: str
    workflow_id: str
    workflow_name: str
    status: str
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    final_result: Optional[str] = None
    error_summary: Optional[str] = None
    steps: List[StepRunResponse]
    pending_approval_id: Optional[str] = None
