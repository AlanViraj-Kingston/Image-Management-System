from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.database import get_db
from app import models, schemas
from app.auth import (
    create_access_token, 
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES,
    hash_password,
    verify_password
)
from typing import List

router = APIRouter(prefix="/api/v1", tags=["User & Patient Service"])

# ============ USER ROUTES ============
# Note: User is an abstract class. Users must be registered as either Patient or MedicalStaff.
# Use /patients/ or /staff/ endpoints for registration.

@router.post("/users/login", response_model=schemas.Token)
def login_user(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """
    Login a user (implements User.login() from UML).
    
    Authentication Process:
    1. Find user by email address
    2. Verify the provided password matches the stored password hash
    3. Check if user account is active
    4. Generate and return JWT access token
    
    Security:
    - Passwords are never stored in plain text
    - Password verification uses bcrypt (secure against timing attacks)
    - Returns generic error message to prevent user enumeration
    """
    # Step 1: Find user by email (email is unique, so this will find at most one user)
    user = db.query(models.User).filter(
        models.User.email == credentials.email
    ).first()
    
    # Step 2: Verify credentials (use generic error to prevent user enumeration)
    # We check password even if user doesn't exist to prevent timing attacks
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Step 3: Check if account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    
    # Step 4: Create JWT access token
    # Token contains user_id and user_type for authorization purposes
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.user_id), "user_type": user.user_type.value},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """Get current authenticated user's information (requires authentication)"""
    return current_user

@router.get("/users/{user_id}", response_model=schemas.UserResponse)
def get_user_info(user_id: int, db: Session = Depends(get_db)):
    """Get user information"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    """Get all users"""
    return db.query(models.User).all()

@router.put("/users/{user_id}/activate")
def activate_user(user_id: int, db: Session = Depends(get_db)):
    """Activate a user account"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    db.refresh(user)
    return {"message": "User activated", "user_id": user_id, "is_active": user.is_active}

@router.put("/users/{user_id}/deactivate")
def deactivate_user(user_id: int, db: Session = Depends(get_db)):
    """Deactivate a user account"""
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    db.refresh(user)
    return {"message": "User deactivated", "user_id": user_id, "is_active": user.is_active}

# ============ PATIENT ROUTES ============
# Patient inherits from User (abstract class). Registration creates both User and Patient records.

@router.post("/patients/", response_model=schemas.PatientResponse)
def register_patient(patient: schemas.PatientCreate, db: Session = Depends(get_db)):
    """
    Register a new patient (implements User.register() from UML).
    
    Registration Process:
    1. Check if email already exists (emails must be unique)
    2. Hash the plain text password using bcrypt
    3. Create the base User record with hashed password
    4. Create the Patient-specific record
    5. Save both records to database
    
    Security:
    - Password is hashed before storage (never store plain text!)
    - Email uniqueness is enforced at database level
    - Password hash includes salt (different hash for same password)
    """
    # Step 1: Check if email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == patient.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Step 2: Hash the password before storing
    # hash_password() uses bcrypt to create a secure one-way hash
    # The hash includes a random salt, so the same password produces different hashes
    hashed_password = hash_password(patient.password)
    
    # Step 3: Create the Patient record directly (SQLAlchemy will automatically create the User record)
    # With joined table inheritance, creating a Patient automatically creates the parent User record
    # Store the hashed password, NOT the plain text password
    new_patient = models.Patient(
        name=patient.name,
        email=patient.email,  # Email for login
        password_hash=hashed_password,  # Store hashed password, never plain text!
        phone=patient.phone,
        address=patient.address,
        user_type=models.UserType.PATIENT,
        is_active=True,
        date_of_birth=patient.date_of_birth,
        conditions=patient.conditions
    )
    db.add(new_patient)
    
    # Step 4: Commit the record to database (both User and Patient records are created)
    db.commit()
    db.refresh(new_patient)
    return new_patient

@router.get("/patients/user/{user_id}", response_model=schemas.PatientResponse)
def get_patient_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Get patient information by user_id"""
    # First check if user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user is a patient
    if user.user_type != models.UserType.PATIENT:
        raise HTTPException(
            status_code=400, 
            detail=f"User with ID {user_id} is not a patient"
        )
    
    # Get patient record
    patient = db.query(models.Patient).filter(models.Patient.user_id == user_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found")
    return patient

@router.get("/patients/{patient_id}", response_model=schemas.PatientResponse)
def get_patient_info(patient_id: int, db: Session = Depends(get_db)):
    """Get patient information"""
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.get("/patients/", response_model=List[schemas.PatientResponse])
def get_all_patients(db: Session = Depends(get_db)):
    """Get all patients"""
    return db.query(models.Patient).all()

@router.put("/patients/{patient_id}", response_model=schemas.PatientResponse)
def update_patient_info(patient_id: int, patient_update: schemas.PatientUpdate, db: Session = Depends(get_db)):
    """Update patient information"""
    patient = db.query(models.Patient).filter(models.Patient.patient_id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update user info
    user = db.query(models.User).filter(models.User.user_id == patient.user_id).first()
    user.name = patient_update.name
    user.phone = patient_update.phone
    user.address = patient_update.address
    
    # Update patient info
    patient.date_of_birth = patient_update.date_of_birth
    patient.conditions = patient_update.conditions
    
    db.commit()
    db.refresh(patient)
    return patient

# ============ MEDICAL STAFF ROUTES ============
# MedicalStaff inherits from User (abstract class). Registration creates both User and MedicalStaff records.

@router.post("/staff/", response_model=schemas.MedicalStaffResponse)
def register_medical_staff(staff: schemas.MedicalStaffCreate, db: Session = Depends(get_db)):
    """
    Register a new medical staff member (implements User.register() from UML).
    
    Registration Process:
    1. Check if email already exists (emails must be unique)
    2. Hash the plain text password using bcrypt
    3. Create the base User record with hashed password
    4. Create the MedicalStaff-specific record
    5. Save both records to database
    
    Security:
    - Password is hashed before storage (never store plain text!)
    - Email uniqueness is enforced at database level
    - Password hash includes salt (different hash for same password)
    """
    # Step 1: Check if email already exists
    existing_user = db.query(models.User).filter(
        models.User.email == staff.email
    ).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Step 2: Hash the password before storing
    # hash_password() uses bcrypt to create a secure one-way hash
    # The hash includes a random salt, so the same password produces different hashes
    hashed_password = hash_password(staff.password)
    
    # Step 3: Create the MedicalStaff record directly (SQLAlchemy will automatically create the User record)
    # With joined table inheritance, creating a MedicalStaff automatically creates the parent User record
    # Store the hashed password, NOT the plain text password
    new_staff = models.MedicalStaff(
        name=staff.name,
        email=staff.email,  # Email for login
        password_hash=hashed_password,  # Store hashed password, never plain text!
        phone=staff.phone,
        address=staff.address,
        user_type=models.UserType.STAFF,
        is_active=True,
        department=staff.department,
        role=staff.role
    )
    db.add(new_staff)
    
    # Step 4: Commit the record to database (both User and MedicalStaff records are created)
    db.commit()
    db.refresh(new_staff)
    return new_staff

@router.get("/staff/user/{user_id}", response_model=schemas.MedicalStaffResponse)
def get_staff_by_user_id(user_id: int, db: Session = Depends(get_db)):
    """Get medical staff information by user_id"""
    staff = db.query(models.MedicalStaff).filter(models.MedicalStaff.user_id == user_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Medical staff not found")
    return staff

@router.get("/staff/{staff_id}", response_model=schemas.MedicalStaffResponse)
def get_staff_info(staff_id: int, db: Session = Depends(get_db)):
    """Get medical staff information"""
    staff = db.query(models.MedicalStaff).filter(models.MedicalStaff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Medical staff not found")
    return staff

@router.get("/staff/", response_model=List[schemas.MedicalStaffResponse])
def get_all_staff(db: Session = Depends(get_db)):
    """Get all medical staff"""
    return db.query(models.MedicalStaff).all()

@router.put("/staff/{staff_id}", response_model=schemas.MedicalStaffResponse)
def update_staff_info(staff_id: int, staff_update: schemas.MedicalStaffCreate, db: Session = Depends(get_db)):
    """Update medical staff information"""
    staff = db.query(models.MedicalStaff).filter(models.MedicalStaff.staff_id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="Medical staff not found")
    
    # Update user info
    user = db.query(models.User).filter(models.User.user_id == staff.user_id).first()
    user.name = staff_update.name
    user.phone = staff_update.phone
    user.address = staff_update.address
    
    # Update staff info
    staff.department = staff_update.department
    staff.role = staff_update.role
    
    db.commit()
    db.refresh(staff)
    return staff


