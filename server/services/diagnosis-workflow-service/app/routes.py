from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from typing import List, Optional
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["Diagnosis & Workflow Service"])

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

