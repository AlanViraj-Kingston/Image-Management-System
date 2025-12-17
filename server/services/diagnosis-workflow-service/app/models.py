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

class ScanType(str, enum.Enum):
    ABDOMINAL_ULTRASOUND = "Abdominal Ultra Sound Scan"
    CT_SCAN = "CT Scan"
    MRI_SCAN = "MRI Scan"
    PET_SCAN = "PET Scan"

class TestStatus(str, enum.Enum):
    SCAN_TO_BE_TAKEN = "Scan to be taken"
    SCAN_IN_PROGRESS = "Scan in progress"
    SCAN_DONE = "Scan Done"

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

class MedicalTest(Base):
    __tablename__ = "medical_tests"

    test_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)  # Staff ID of doctor who created the test
    radiologist_id = Column(Integer, nullable=True, index=True)  # Assigned radiologist
    appointment_id = Column(Integer, nullable=True, index=True)  # Link to appointment
    test_type = Column(SQLEnum(ScanType), nullable=False)
    status = Column(SQLEnum(TestStatus), default=TestStatus.SCAN_TO_BE_TAKEN, nullable=False)
    report_id = Column(Integer, nullable=True)  # Generated report ID
    image_id = Column(Integer, nullable=True)  # Uploaded scan image ID
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class WorkflowLog(Base):
    __tablename__ = "workflow_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Reference to user (no foreign key constraint for microservices independence)
    user_id = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String, nullable=False)  # Description of the action logged

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    NO_SHOW = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"

    appointment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # References (no foreign key constraints for microservices independence)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)  # Staff ID of doctor
    appointment_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED, nullable=False)
    payment_id = Column(Integer, nullable=True)  # Link to payment/billing later
    created_by = Column(Integer, nullable=False)  # Clerk user_id who created the appointment
    notes = Column(String, nullable=True)  # Optional notes
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


