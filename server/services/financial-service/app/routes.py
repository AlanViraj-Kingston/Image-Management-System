from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["Financial Service"])

@router.post("/billing/", response_model=schemas.BillingDetailsResponse)
def add_billing(billing: schemas.BillingDetailsCreate, db: Session = Depends(get_db)):
    """Add new billing details"""
    new_billing = models.BillingDetails(
        patient_id=billing.patient_id,
        appointment_id=billing.appointment_id,
        procedure=billing.procedure,
        base_cost=billing.base_cost,
        status=billing.status,
        report_id=billing.report_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(new_billing)
    db.commit()
    db.refresh(new_billing)
    return new_billing

@router.get("/billing/", response_model=List[schemas.BillingDetailsResponse])
def get_all_billings(
    status: models.BillingStatus | None = None,
    db: Session = Depends(get_db)
):
    """Get all billing details, optionally filtered by status"""
    query = db.query(models.BillingDetails)
    if status:
        query = query.filter(models.BillingDetails.status == status)
    return query.all()

@router.get("/billing/{billing_id}", response_model=schemas.BillingDetailsResponse)
def get_billing(billing_id: int, db: Session = Depends(get_db)):
    """Get billing details by ID"""
    billing = db.query(models.BillingDetails).filter(
        models.BillingDetails.billing_id == billing_id
    ).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    return billing

@router.get("/billing/patient/{patient_id}", response_model=List[schemas.BillingDetailsResponse])
def get_billing_per_patient(patient_id: int, db: Session = Depends(get_db)):
    """Get billing details for a specific patient"""
    billings = db.query(models.BillingDetails).filter(
        models.BillingDetails.patient_id == patient_id
    ).all()
    return billings

@router.get("/billing/patient/{patient_id}/total", response_model=schemas.BillingTotalResponse)
def calculate_total(patient_id: int, db: Session = Depends(get_db)):
    """Calculate total cost for a specific patient"""
    billings = db.query(models.BillingDetails).filter(
        models.BillingDetails.patient_id == patient_id
    ).all()
    
    total_cost = sum(billing.base_cost for billing in billings)
    pending_count = sum(1 for billing in billings if billing.status == models.BillingStatus.PENDING)
    paid_count = sum(1 for billing in billings if billing.status == models.BillingStatus.PAID)
    
    return schemas.BillingTotalResponse(
        patient_id=patient_id,
        total_cost=total_cost,
        billing_count=len(billings),
        pending_count=pending_count,
        paid_count=paid_count
    )

@router.put("/billing/{billing_id}", response_model=schemas.BillingDetailsResponse)
def update_billing(
    billing_id: int,
    billing_update: schemas.BillingDetailsUpdate,
    db: Session = Depends(get_db)
):
    """Update billing details"""
    billing = db.query(models.BillingDetails).filter(
        models.BillingDetails.billing_id == billing_id
    ).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    if billing_update.procedure is not None:
        billing.procedure = billing_update.procedure
    if billing_update.base_cost is not None:
        billing.base_cost = billing_update.base_cost
    if billing_update.status is not None:
        billing.status = billing_update.status
    
    billing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(billing)
    return billing

@router.put("/billing/{billing_id}/pay")
def mark_as_paid(billing_id: int, db: Session = Depends(get_db)):
    """Mark a billing as paid"""
    billing = db.query(models.BillingDetails).filter(
        models.BillingDetails.billing_id == billing_id
    ).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    billing.status = models.BillingStatus.PAID
    billing.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Billing marked as paid", "billing_id": billing_id}

@router.delete("/billing/{billing_id}")
def delete_billing(billing_id: int, db: Session = Depends(get_db)):
    """Delete billing details"""
    billing = db.query(models.BillingDetails).filter(
        models.BillingDetails.billing_id == billing_id
    ).first()
    if not billing:
        raise HTTPException(status_code=404, detail="Billing not found")
    
    db.delete(billing)
    db.commit()
    return {"message": "Billing deleted successfully", "billing_id": billing_id}

@router.get("/billing/statistics/summary")
def get_billing_statistics(db: Session = Depends(get_db)):
    """Get billing statistics summary"""
    all_billings = db.query(models.BillingDetails).all()
    
    total_paid = sum(
        billing.base_cost for billing in all_billings 
        if billing.status == models.BillingStatus.PAID
    )
    
    total_unpaid = sum(
        billing.base_cost for billing in all_billings 
        if billing.status in [models.BillingStatus.UNPAID, models.BillingStatus.PENDING]
    )
    
    return {
        "total_paid": total_paid,
        "total_unpaid": total_unpaid,
        "total_billings": len(all_billings),
        "paid_count": sum(1 for b in all_billings if b.status == models.BillingStatus.PAID),
        "unpaid_count": sum(1 for b in all_billings if b.status in [models.BillingStatus.UNPAID, models.BillingStatus.PENDING])
    }

@router.get("/billing/statistics/monthly-revenue")
def get_monthly_revenue(
    year: int = None,
    db: Session = Depends(get_db)
):
    """Get monthly revenue (paid amounts) for a specific year or current year"""
    from datetime import datetime
    from calendar import monthrange
    
    if year is None:
        year = datetime.now().year
    
    # Get all paid billings
    paid_billings = db.query(models.BillingDetails).filter(
        models.BillingDetails.status == models.BillingStatus.PAID
    ).all()
    
    # Group by month
    monthly_data = {}
    for month in range(1, 13):
        monthly_data[month] = 0.0
    
    for billing in paid_billings:
        if billing.created_at and billing.created_at.year == year:
            month = billing.created_at.month
            monthly_data[month] += billing.base_cost
    
    # Format as list of objects with month names
    month_names = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    
    revenue_data = [
        {
            "month": month_names[i],
            "month_number": i + 1,
            "revenue": monthly_data[i + 1]
        }
        for i in range(12)
    ]
    
    return {
        "year": year,
        "monthly_revenue": revenue_data,
        "total_revenue": sum(monthly_data.values())
    }

