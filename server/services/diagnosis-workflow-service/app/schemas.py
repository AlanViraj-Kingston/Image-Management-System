from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import ReportStatus

class DiagnosisReportCreate(BaseModel):
    patient_id: int
    staff_id: int
    image_id: Optional[int] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    status: ReportStatus = ReportStatus.PENDING

class DiagnosisReportUpdate(BaseModel):
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    status: Optional[ReportStatus] = None

class DiagnosisReportResponse(BaseModel):
    report_id: int
    patient_id: int
    staff_id: int
    image_id: Optional[int] = None
    findings: Optional[str] = None
    diagnosis: Optional[str] = None
    status: ReportStatus
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkflowLogCreate(BaseModel):
    user_id: int
    action: str

class WorkflowLogResponse(BaseModel):
    log_id: int
    user_id: int
    timestamp: datetime
    action: str

    class Config:
        from_attributes = True


