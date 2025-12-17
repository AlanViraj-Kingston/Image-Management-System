from sqlalchemy import Column, Integer, String, Float, Enum as SQLEnum, DateTime
from app.database import Base
import enum
from datetime import datetime

class BillingStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"

class BillingDetails(Base):
    __tablename__ = "billing_details"

    billing_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # References (no foreign key constraints for microservices independence)
    patient_id = Column(Integer, nullable=False, index=True)
    procedure = Column(String, nullable=False)
    base_cost = Column(Float, nullable=False)
    status = Column(SQLEnum(BillingStatus), default=BillingStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Optional: Link to diagnosis report
    report_id = Column(Integer, nullable=True)


