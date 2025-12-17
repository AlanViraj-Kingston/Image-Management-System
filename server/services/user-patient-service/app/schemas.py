from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
from app.models import UserType, StaffRole

# User Schemas
class UserBase(BaseModel):
    name: str
    email: EmailStr  # Email address (validated format)
    phone: Optional[str] = None
    address: Optional[str] = None

class UserCreate(UserBase):
    user_type: UserType

class UserResponse(UserBase):
    """Response schema for user data - excludes sensitive password_hash field"""
    user_id: int
    is_active: bool
    user_type: UserType

    class Config:
        from_attributes = True
        # Explicitly exclude password_hash from responses for security
        # Even though it's not in the schema, this ensures it's never returned

# Password schemas (separate from UserBase to exclude password from responses)
class UserWithPassword(UserBase):
    password: str  # Plain password (only used in requests, never in responses)

# Patient Schemas
class PatientCreate(UserWithPassword):
    """Schema for patient registration - includes email and password"""
    date_of_birth: date
    conditions: Optional[str] = None

class PatientResponse(UserResponse):
    patient_id: int
    date_of_birth: Optional[date] = None
    conditions: Optional[str] = None

    class Config:
        from_attributes = True

# Medical Staff Schemas
class MedicalStaffCreate(UserWithPassword):
    """Schema for medical staff registration - includes email and password"""
    department: str
    role: StaffRole

class MedicalStaffResponse(UserResponse):
    staff_id: int
    department: Optional[str] = None
    role: Optional[StaffRole] = None

    class Config:
        from_attributes = True

# Login Schema
class UserLogin(BaseModel):
    """Schema for user login - uses email and password for authentication"""
    email: EmailStr  # User logs in with email
    password: str   # Plain password (will be verified against hashed password in database)

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class UserActivate(BaseModel):
    user_id: int
    is_active: bool


