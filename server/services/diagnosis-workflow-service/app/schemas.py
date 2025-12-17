from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import ReportStatus, ScanType, TestStatus

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

# ============ MEDICAL TEST SCHEMAS ============

class MedicalTestCreate(BaseModel):
    patient_id: int
    doctor_id: int
    radiologist_id: Optional[int] = None
    test_type: ScanType
    status: TestStatus = TestStatus.SCAN_TO_BE_TAKEN

class MedicalTestUpdate(BaseModel):
    test_type: Optional[ScanType] = None
    radiologist_id: Optional[int] = None
    status: Optional[TestStatus] = None
    report_id: Optional[int] = None
    image_id: Optional[int] = None

class MedicalTestResponse(BaseModel):
    test_id: int
    patient_id: int
    doctor_id: int
    radiologist_id: Optional[int] = None
    test_type: ScanType
    status: TestStatus
    report_id: Optional[int] = None
    image_id: Optional[int] = None
    created_date: datetime
    updated_date: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReportGenerateRequest(BaseModel):
    findings: Optional[str] = None
    diagnosis: Optional[str] = None


