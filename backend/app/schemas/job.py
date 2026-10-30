from pydantic import BaseModel, HttpUrl
from typing import List, Optional

class CompanyCreate(BaseModel):
    name: str
    careers_url: str
    keywords: List[str]
    locations: List[str]
    experience_level: Optional[str] = "All Levels"

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    careers_url: Optional[str] = None
    keywords: Optional[List[str]] = None
    locations: Optional[List[str]] = None
    experience_level: Optional[str] = None
    enabled: Optional[bool] = None

class CompanyResponse(BaseModel):
    id: str
    name: str
    careers_url: str
    keywords: List[str]
    locations: List[str]
    experience_level: str
    enabled: bool
    last_checked_at: Optional[str] = None
    jobs_count: int

class JobPostingResponse(BaseModel):
    id: str
    company_id: str
    company_name: str
    title: str
    location: str
    employment_type: Optional[str] = None
    experience_level: Optional[str] = None
    source_url: str
    description: Optional[str] = None
    first_seen_at: str
    last_seen_at: str
    application_status: str
    source_verification_status: str
    is_new: Optional[bool] = False

class JobStatusUpdate(BaseModel):
    application_status: str
