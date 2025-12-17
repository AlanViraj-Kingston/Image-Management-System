from sqlalchemy import Column, Integer, String, Date, Enum as SQLEnum, DateTime
from sqlalchemy.orm import relationship
from app.database import Base
import enum
from datetime import datetime

class ReportStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    FINALIZED = "finalized"
    CANCELLED = "cancelled"

class DiagnosisReport(Base):
    __tablename__ = "diagnosis_reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # References (no foreign key constraints for microservices independence)
    patient_id = Column(Integer, nullable=False, index=True)
    staff_id = Column(Integer, nullable=False)
    image_id = Column(Integer, nullable=True)  # Optional, can be null
    findings = Column(String, nullable=True)
    diagnosis = Column(String, nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Reference to user (no foreign key constraint for microservices independence)
    user_id = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String, nullable=False)  # Description of the action logged


