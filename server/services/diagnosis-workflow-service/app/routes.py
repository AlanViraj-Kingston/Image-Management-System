from fastapi import APIRouter, Depends, HTTPException, Body
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
        appointment_id=test.appointment_id,
        test_type=test.test_type,
        status=test.status,
        created_date=datetime.utcnow(),
        updated_date=datetime.utcnow()
    )
    db.add(new_test)
    db.commit()
    db.refresh(new_test)
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=test.doctor_id,
            action=f"Created test {new_test.test_id} (Type: {test.test_type.value}) for patient {test.patient_id}",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep test creation
        db.rollback()
    
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

@router.get("/tests/appointment/{appointment_id}", response_model=List[schemas.MedicalTestResponse])
def get_appointment_tests(appointment_id: int, db: Session = Depends(get_db)):
    """Get all tests for a specific appointment"""
    tests = db.query(models.MedicalTest).filter(
        models.MedicalTest.appointment_id == appointment_id
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
    
    # Update appointment_id if provided
    if "appointment_id" in fields_set:
        test.appointment_id = test_update.appointment_id
    
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
    
    # Build descriptive log message based on what was updated
    log_parts = []
    if "test_type" in fields_set:
        log_parts.append(f"scan type to {test.test_type.value}")
    if "radiologist_id" in fields_set:
        if test.radiologist_id:
            log_parts.append(f"assigned radiologist {test.radiologist_id}")
        else:
            log_parts.append("unassigned radiologist")
    if "status" in fields_set:
        log_parts.append(f"status to {test.status.value}")
    if "image_id" in fields_set:
        if test.image_id:
            log_parts.append(f"uploaded image {test.image_id}")
        else:
            log_parts.append("removed image")
    if "report_id" in fields_set:
        log_parts.append(f"linked report {test.report_id}")
    
    # Determine user_id: if image_id was updated, likely the radiologist; otherwise use doctor_id
    log_user_id = test.doctor_id
    if "image_id" in fields_set and test.radiologist_id:
        log_user_id = test.radiologist_id
    elif "status" in fields_set and test.radiologist_id and test.status == models.TestStatus.SCAN_DONE:
        log_user_id = test.radiologist_id
    
    # Create log message
    if log_parts:
        action_msg = f"Updated test {test_id}: " + ", ".join(log_parts)
    else:
        action_msg = f"Updated test {test_id}"
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=log_user_id,
            action=action_msg,
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep test update
        db.rollback()
    
    return test

@router.post("/tests/{test_id}/generate-report", response_model=schemas.MedicalTestResponse)
def generate_report_for_test(
    test_id: int,
    report_data: schemas.ReportGenerateRequest = Body(...),
    db: Session = Depends(get_db)
):
    """
    Generate a diagnosis report for a test with findings and diagnosis.
    
    - **test_id**: ID of the test
    - **findings**: Findings from the scan (optional)
    - **diagnosis**: Diagnosis based on the scan (optional)
    """
    test = db.query(models.MedicalTest).filter(
        models.MedicalTest.test_id == test_id
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Check if report already exists
    if test.report_id:
        # Update existing report
        report = db.query(models.DiagnosisReport).filter(
            models.DiagnosisReport.report_id == test.report_id
        ).first()
        if report:
            if report_data.findings is not None:
                report.findings = report_data.findings
            if report_data.diagnosis is not None:
                report.diagnosis = report_data.diagnosis
            report.status = models.ReportStatus.FINALIZED
            report.updated_date = datetime.utcnow()
            db.commit()
            db.refresh(report)
    else:
        # Create a new diagnosis report
        report = models.DiagnosisReport(
            patient_id=test.patient_id,
            staff_id=test.doctor_id,
            image_id=test.image_id,
            findings=report_data.findings,
            diagnosis=report_data.diagnosis,
            status=models.ReportStatus.FINALIZED if (report_data.findings or report_data.diagnosis) else models.ReportStatus.PENDING,
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
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=test.doctor_id,
            action=f"Generated report {report.report_id} for test {test_id} (Patient {test.patient_id})",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep report generation
        db.rollback()
    
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
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=report.staff_id,  # Using staff_id as user_id reference
            action=f"Generated diagnosis report {new_report.report_id} for patient {report.patient_id}",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep report creation
        db.rollback()
    
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
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=report.staff_id,
            action=f"Confirmed diagnosis report {report_id} (Patient {report.patient_id})",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep report confirmation
        db.rollback()
    
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
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=report.staff_id,
            action=f"Updated diagnosis report {report_id} (Patient {report.patient_id})",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep report update
        db.rollback()
    
    return report

# ============ APPOINTMENT ROUTES ============

@router.post("/appointments/", response_model=schemas.AppointmentResponse)
def create_appointment(
    appointment: schemas.AppointmentCreate,
    db: Session = Depends(get_db)
):
    """Create a new appointment"""
    new_appointment = models.Appointment(
        patient_id=appointment.patient_id,
        doctor_id=appointment.doctor_id,
        appointment_date=appointment.appointment_date,
        status=models.AppointmentStatus.SCHEDULED,
        payment_id=appointment.payment_id,
        created_by=appointment.created_by,
        notes=appointment.notes,
        created_date=datetime.utcnow(),
        updated_date=datetime.utcnow()
    )
    db.add(new_appointment)
    db.commit()
    db.refresh(new_appointment)
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=appointment.created_by,
            action=f"Created appointment {new_appointment.appointment_id} for patient {appointment.patient_id} with doctor {appointment.doctor_id}",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep appointment creation
        db.rollback()
    
    return new_appointment

@router.get("/appointments/", response_model=List[schemas.AppointmentResponse])
def get_all_appointments(
    status: Optional[models.AppointmentStatus] = None,
    db: Session = Depends(get_db)
):
    """Get all appointments, optionally filtered by status"""
    query = db.query(models.Appointment)
    if status:
        query = query.filter(models.Appointment.status == status)
    return query.order_by(models.Appointment.appointment_date.desc()).all()

@router.get("/appointments/{appointment_id}", response_model=schemas.AppointmentResponse)
def get_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Get an appointment by ID"""
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment

@router.get("/appointments/patient/{patient_id}", response_model=List[schemas.AppointmentResponse])
def get_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    """Get all appointments for a specific patient"""
    appointments = db.query(models.Appointment).filter(
        models.Appointment.patient_id == patient_id
    ).order_by(models.Appointment.appointment_date.desc()).all()
    return appointments

@router.get("/appointments/doctor/{doctor_id}", response_model=List[schemas.AppointmentResponse])
def get_doctor_appointments(doctor_id: int, db: Session = Depends(get_db)):
    """Get all appointments for a specific doctor"""
    appointments = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor_id
    ).order_by(models.Appointment.appointment_date.desc()).all()
    return appointments

@router.put("/appointments/{appointment_id}", response_model=schemas.AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_update: schemas.AppointmentUpdate,
    db: Session = Depends(get_db)
):
    """Update an appointment"""
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    # Get which fields were explicitly set
    update_dict = appointment_update.model_dump(exclude_unset=True)
    
    if "appointment_date" in update_dict:
        appointment.appointment_date = appointment_update.appointment_date
    if "status" in update_dict:
        appointment.status = appointment_update.status
    if "payment_id" in update_dict:
        appointment.payment_id = appointment_update.payment_id
    if "notes" in update_dict:
        appointment.notes = appointment_update.notes
    
    appointment.updated_date = datetime.utcnow()
    db.commit()
    db.refresh(appointment)
    
    # Build descriptive log message based on what was updated
    log_parts = []
    if "appointment_date" in update_dict:
        log_parts.append("appointment date")
    if "status" in update_dict:
        log_parts.append(f"status to {appointment.status.value}")
    if "payment_id" in update_dict:
        log_parts.append("payment ID")
    if "notes" in update_dict:
        log_parts.append("notes")
    
    # Create log message
    if log_parts:
        action_msg = f"Updated appointment {appointment_id} (Patient {appointment.patient_id}): " + ", ".join(log_parts)
    else:
        action_msg = f"Updated appointment {appointment_id} (Patient {appointment.patient_id})"
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=appointment.created_by,
            action=action_msg,
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep appointment update
        db.rollback()
    
    return appointment

@router.delete("/appointments/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db)):
    """Delete an appointment"""
    appointment = db.query(models.Appointment).filter(
        models.Appointment.appointment_id == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    db.delete(appointment)
    db.commit()
    
    # Log the action with error handling
    try:
        log_action = models.WorkflowLog(
            user_id=appointment.created_by,
            action=f"Deleted appointment {appointment_id} (Patient {appointment.patient_id})",
            timestamp=datetime.utcnow()
        )
        db.add(log_action)
        db.commit()
    except Exception as e:
        # Log error but don't fail the request
        import logging
        logging.error(f"Failed to create workflow log: {str(e)}")
        # Rollback log transaction but keep appointment deletion
        db.rollback()
    
    return {"message": "Appointment deleted successfully", "appointment_id": appointment_id}

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

