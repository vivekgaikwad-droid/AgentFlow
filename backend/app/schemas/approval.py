from pydantic import BaseModel
from typing import Optional, Dict, Any

class ApprovalDecisionRequest(BaseModel):
    reason: Optional[str] = None

class ApprovalResponse(BaseModel):
    id: str
    run_id: str
    step_id: str
    workflow_name: str
    action: str
    reason: str
    details: Dict[str, Any]
    status: str
    requested_at: str
    decided_at: Optional[str] = None
    decided_by: Optional[str] = None
    rejection_reason: Optional[str] = None
