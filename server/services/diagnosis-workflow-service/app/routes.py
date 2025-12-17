from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["Diagnosis & Workflow Service"])

# ============ MEDICAL TEST ROUTES ============

@router.post("/tests/", response_model=schemas.MedicalTestResponse)
def create_test(test: schemas.MedicalTestCreate, db: Session = Depends(get_db)):
    """Create a new medical test/scan"""
    new_test = models.MedicalTest(
        patient_id=test.patient_id,
        doctor_id=test.doctor_id,
        radiologist_id=test.radiologist_id,
        test_type=test.test_type,
        status=test.status,
        created_date=datetime.utcnow(),
        updated_date=datetime.utcnow()
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=test.doctor_id,
        action=f"Created test {new_test.test_id} (Type: {test.test_type.value}) for patient {test.patient_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return new_test

@router.get("/tests/{test_id}", response_model=schemas.MedicalTestResponse)
def get_test(test_id: int, db: Session = Depends(get_db)):
    """Get a medical test by ID"""
    test = db.query(models.MedicalTest).filter(
        models.MedicalTest.test_id == test_id
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    return test

@router.get("/tests/patient/{patient_id}", response_model=List[schemas.MedicalTestResponse])
def get_patient_tests(patient_id: int, db: Session = Depends(get_db)):
    """Get all tests for a specific patient"""
    tests = db.query(models.MedicalTest).filter(
        models.MedicalTest.patient_id == patient_id
    ).order_by(models.MedicalTest.created_date.desc()).all()
    return tests

@router.get("/tests/doctor/{doctor_id}", response_model=List[schemas.MedicalTestResponse])
def get_doctor_tests(doctor_id: int, db: Session = Depends(get_db)):
    """Get all tests created by a specific doctor"""
    tests = db.query(models.MedicalTest).filter(
        models.MedicalTest.doctor_id == doctor_id
    ).order_by(models.MedicalTest.created_date.desc()).all()
    return tests

@router.get("/tests/radiologist/{radiologist_id}", response_model=List[schemas.MedicalTestResponse])
def get_radiologist_tests(radiologist_id: int, db: Session = Depends(get_db)):
    """Get all tests assigned to a specific radiologist"""
    tests = db.query(models.MedicalTest).filter(
        models.MedicalTest.radiologist_id == radiologist_id
    ).order_by(models.MedicalTest.created_date.desc()).all()
    return tests

@router.put("/tests/{test_id}", response_model=schemas.MedicalTestResponse)
def update_test(
    test_id: int,
    test_update: schemas.MedicalTestUpdate,
    db: Session = Depends(get_db)
):
    """Update a medical test"""
    test = db.query(models.MedicalTest).filter(
        models.MedicalTest.test_id == test_id
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Get which fields were explicitly set in the request
    # Use model_fields_set for Pydantic v2, fallback to model_dump for v1
    if hasattr(test_update, 'model_fields_set'):
        fields_set = test_update.model_fields_set
    else:
        # Fallback: get fields from model_dump
        update_dict = test_update.model_dump(exclude_unset=True)
        fields_set = set(update_dict.keys())
    
    # Update test_type if provided
    if "test_type" in fields_set:
        new_type = test_update.test_type
        if new_type is not None:
            # Convert to enum if needed - handle both string and enum types
            if isinstance(new_type, str):
                enum_value = models.ScanType(new_type)
            elif isinstance(new_type, models.ScanType):
                enum_value = new_type
            else:
                # Try to convert via string
                enum_value = models.ScanType(str(new_type))
            
            # Always update (SQLAlchemy will detect if it's different)
            test.test_type = enum_value
    
    # Update radiologist_id if provided (can be None to unassign)
    if "radiologist_id" in fields_set:
        test.radiologist_id = test_update.radiologist_id
    
    # Update status if provided
    if "status" in fields_set:
        new_status = test_update.status
        if new_status is not None:
            # Convert to enum if needed
            if not isinstance(new_status, models.TestStatus):
                new_status = models.TestStatus(new_status)
            test.status = new_status
    
    # Update report_id if provided
    if "report_id" in fields_set:
        test.report_id = test_update.report_id
    
    # Update image_id if provided
    if "image_id" in fields_set:
        test.image_id = test_update.image_id
    
    test.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(test)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=test.doctor_id,
        action=f"Updated test {test_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return test

@router.post("/tests/{test_id}/generate-report", response_model=schemas.MedicalTestResponse)
def generate_report_for_test(test_id: int, db: Session = Depends(get_db)):
    """Generate a report ID for a test"""
    test = db.query(models.MedicalTest).filter(
        models.MedicalTest.test_id == test_id
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Create a diagnosis report
    report = models.DiagnosisReport(
        patient_id=test.patient_id,
        staff_id=test.doctor_id,
        image_id=test.image_id,
        status=models.ReportStatus.PENDING,
        updated_date=datetime.utcnow()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    
    # Update test with report_id
    test.report_id = report.report_id
    test.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(test)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=test.doctor_id,
        action=f"Generated report {report.report_id} for test {test_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return test

# ============ DIAGNOSIS REPORT ROUTES ============

@router.post("/reports/", response_model=schemas.DiagnosisReportResponse)
def generate_report(report: schemas.DiagnosisReportCreate, db: Session = Depends(get_db)):
    """Generate a new diagnosis report"""
    new_report = models.DiagnosisReport(
        patient_id=report.patient_id,
        staff_id=report.staff_id,
        image_id=report.image_id,
        findings=report.findings,
        diagnosis=report.diagnosis,
        status=report.status,
        updated_date=datetime.utcnow()
    )
    db.add(new_report)
    db.commit()
    db.refresh(new_report)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=report.staff_id,  # Using staff_id as user_id reference
        action=f"Generated diagnosis report {new_report.report_id} for patient {report.patient_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return new_report

@router.get("/reports/{report_id}", response_model=schemas.DiagnosisReportResponse)
def get_report(report_id: int, db: Session = Depends(get_db)):
    """Get a diagnosis report by ID"""
    report = db.query(models.DiagnosisReport).filter(
        models.DiagnosisReport.report_id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/reports/patient/{patient_id}", response_model=List[schemas.DiagnosisReportResponse])
def get_patient_reports(patient_id: int, db: Session = Depends(get_db)):
    """Get all reports for a specific patient"""
    reports = db.query(models.DiagnosisReport).filter(
        models.DiagnosisReport.patient_id == patient_id
    ).all()
    return reports

@router.get("/reports/staff/{staff_id}", response_model=List[schemas.DiagnosisReportResponse])
def get_staff_reports(staff_id: int, db: Session = Depends(get_db)):
    """Get all reports created by a specific staff member"""
    reports = db.query(models.DiagnosisReport).filter(
        models.DiagnosisReport.staff_id == staff_id
    ).all()
    return reports

@router.get("/reports/", response_model=List[schemas.DiagnosisReportResponse])
def get_all_reports(
    status: Optional[models.ReportStatus] = None,
    db: Session = Depends(get_db)
):
    """Get all diagnosis reports, optionally filtered by status"""
    query = db.query(models.DiagnosisReport)
    if status:
        query = query.filter(models.DiagnosisReport.status == status)
    return query.all()

@router.put("/reports/{report_id}/confirm", response_model=schemas.DiagnosisReportResponse)
def confirm_report(report_id: int, db: Session = Depends(get_db)):
    """Confirm/finalize a diagnosis report"""
    report = db.query(models.DiagnosisReport).filter(
        models.DiagnosisReport.report_id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = models.ReportStatus.FINALIZED
    report.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=report.staff_id,
        action=f"Confirmed diagnosis report {report_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return report

@router.put("/reports/{report_id}", response_model=schemas.DiagnosisReportResponse)
def update_report(
    report_id: int,
    report_update: schemas.DiagnosisReportUpdate,
    db: Session = Depends(get_db)
):
    """Update a diagnosis report"""
    report = db.query(models.DiagnosisReport).filter(
        models.DiagnosisReport.report_id == report_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    if report_update.findings is not None:
        report.findings = report_update.findings
    if report_update.diagnosis is not None:
        report.diagnosis = report_update.diagnosis
    if report_update.status is not None:
        report.status = report_update.status
    
    report.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    # Log the action
    log_action = models.WorkflowLog(
        user_id=report.staff_id,
        action=f"Updated diagnosis report {report_id}",
        timestamp=datetime.utcnow()
    )
    db.add(log_action)
    db.commit()
    
    return report

# ============ WORKFLOW LOG ROUTES ============

@router.post("/logs/", response_model=schemas.WorkflowLogResponse)
def add_log(log: schemas.WorkflowLogCreate, db: Session = Depends(get_db)):
    """Add a new workflow log entry"""
    new_log = models.WorkflowLog(
        user_id=log.user_id,
        action=log.action,
        timestamp=datetime.utcnow()
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get("/logs/", response_model=List[schemas.WorkflowLogResponse])
def get_logs(
    user_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Get workflow logs, optionally filtered by user_id"""
    query = db.query(models.WorkflowLog)
    if user_id:
        query = query.filter(models.WorkflowLog.user_id == user_id)
    return query.order_by(models.WorkflowLog.timestamp.desc()).limit(limit).all()

@router.get("/logs/{log_id}", response_model=schemas.WorkflowLogResponse)
def get_log(log_id: int, db: Session = Depends(get_db)):
    """Get a specific workflow log entry"""
    log = db.query(models.WorkflowLog).filter(models.WorkflowLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    return log

@router.get("/logs/user/{user_id}", response_model=List[schemas.WorkflowLogResponse])
def get_user_logs(user_id: int, limit: int = 100, db: Session = Depends(get_db)):
    """Get all logs for a specific user"""
    logs = db.query(models.WorkflowLog).filter(
        models.WorkflowLog.user_id == user_id
    ).order_by(models.WorkflowLog.timestamp.desc()).limit(limit).all()
    return logs

