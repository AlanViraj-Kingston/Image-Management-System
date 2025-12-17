from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models import BillingStatus

class BillingDetailsCreate(BaseModel):
    patient_id: int
    procedure: str
    base_cost: float
    status: BillingStatus = BillingStatus.PENDING
    report_id: Optional[int] = None

class BillingDetailsUpdate(BaseModel):
    procedure: Optional[str] = None
    base_cost: Optional[float] = None
    status: Optional[BillingStatus] = None

class BillingDetailsResponse(BaseModel):
    billing_id: int
    patient_id: int
    procedure: str
    base_cost: float
    status: BillingStatus
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    report_id: Optional[int] = None

    class Config:
        from_attributes = True

class BillingTotalResponse(BaseModel):
    patient_id: int
    total_cost: float
    billing_count: int
    pending_count: int
    paid_count: int


