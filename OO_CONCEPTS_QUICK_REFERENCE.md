# OO Concepts Quick Reference Guide
## File-by-File Breakdown

This is a quick reference to find OO concepts in specific files.

---

## 🔵 INHERITANCE

### SQLAlchemy Model Inheritance
**File:** `server/services/user-patient-service/app/models.py`
- **Lines 16-32**: `User` base class with polymorphic configuration
- **Lines 35-44**: `Patient` class inheriting from `User`
- **Lines 47-56**: `MedicalStaff` class inheriting from `User`

### Pydantic Schema Inheritance
**File:** `server/services/user-patient-service/app/schemas.py`
- **Lines 7-11**: `UserBase` - base schema class
- **Lines 13-14**: `UserCreate` inherits from `UserBase`
- **Lines 16-20**: `UserResponse` inherits from `UserBase`
- **Lines 28-29**: `UserWithPassword` inherits from `UserBase`
- **Lines 32-35**: `PatientCreate` inherits from `UserWithPassword`
- **Lines 45-48**: `PatientResponse` inherits from `UserResponse`
- **Lines 54-57**: `MedicalStaffCreate` inherits from `UserWithPassword`
- **Lines 59-65**: `MedicalStaffResponse` inherits from `UserResponse`

**File:** `server/services/financial-service/app/schemas.py`
- **Lines 6-12**: `BillingDetailsCreate` inherits from `BaseModel`
- **Lines 14-17**: `BillingDetailsUpdate` inherits from `BaseModel`
- **Lines 19-31**: `BillingDetailsResponse` inherits from `BaseModel`

**File:** `server/services/diagnosis-workflow-service/app/schemas.py`
- **Lines 6-13**: `DiagnosisReportCreate` inherits from `BaseModel`
- **Lines 15-19**: `DiagnosisReportUpdate` inherits from `BaseModel`
- **Lines 21-33**: `DiagnosisReportResponse` inherits from `BaseModel`
- **Lines 50-56**: `MedicalTestCreate` inherits from `BaseModel`
- **Lines 58-64**: `MedicalTestUpdate` inherits from `BaseModel`
- **Lines 66-80**: `MedicalTestResponse` inherits from `BaseModel`
- **Lines 84-90**: `AppointmentCreate` inherits from `BaseModel`
- **Lines 92-96**: `AppointmentUpdate` inherits from `BaseModel`
- **Lines 98-111**: `AppointmentResponse` inherits from `BaseModel`

**File:** `server/services/imaging-service/app/schemas.py`
- **Lines 5-10**: `ImageMedicalCreate` inherits from `BaseModel`
- **Lines 12-23**: `ImageMedicalResponse` inherits from `BaseModel`
- **Lines 25-29**: `ImageUploadResponse` inherits from `BaseModel`

---

## 🟢 ENCAPSULATION

### Model Encapsulation
**File:** `server/services/user-patient-service/app/models.py`
- **Line 17**: `__tablename__` - encapsulated table name
- **Line 22**: `password_hash` - protected attribute (never exposed)
- **Lines 29-32**: `__mapper_args__` - encapsulated ORM configuration

**File:** `server/services/financial-service/app/models.py`
- **Lines 13-26**: `BillingDetails` class with encapsulated attributes
- **Line 22**: `status` - enum-encapsulated state

**File:** `server/services/diagnosis-workflow-service/app/models.py`
- **Lines 24-36**: `DiagnosisReport` class
- **Lines 38-51**: `MedicalTest` class
- **Lines 53-60**: `WorkflowLog` class
- **Lines 68-81**: `Appointment` class

**File:** `server/services/imaging-service/app/models.py`
- **Lines 12-24**: `ImageMedical` class

### Service Encapsulation
**File:** `server/services/imaging-service/app/file_storage.py`
- **Line 11**: `UPLOAD_DIR` - module-level constant (encapsulated)
- **Lines 24-46**: `save_file()` - encapsulates file saving logic
- **Lines 48-58**: `get_file_path()` - encapsulates path resolution
- **Lines 60-74**: `get_file_url()` - encapsulates URL generation
- **Lines 76-101**: `delete_file()` - encapsulates deletion logic

**File:** `server/services/imaging-service/app/minio_client.py`
- **Lines 12-16**: Configuration constants (encapsulated)
- **Lines 19-24**: `minio_client` - singleton-like object
- **Lines 26-34**: `ensure_bucket_exists()` - encapsulates bucket creation
- **Lines 36-52**: `upload_file()` - encapsulates upload logic
- **Lines 54-65**: `get_file_url()` - encapsulates URL generation
- **Lines 67-74**: `delete_file()` - encapsulates deletion logic

### Authentication Encapsulation
**File:** `server/services/user-patient-service/app/auth.py`
- **Line 14**: `pwd_context` - encapsulated password hashing context
- **Lines 17-19**: JWT configuration (encapsulated constants)
- **Lines 25-43**: `hash_password()` - encapsulates hashing implementation
- **Lines 45-63**: `verify_password()` - encapsulates verification logic
- **Lines 65-74**: `create_access_token()` - encapsulates token creation
- **Lines 76-85**: `verify_token()` - encapsulates token verification
- **Lines 87-106**: `get_current_user()` - encapsulates user retrieval

---

## 🟡 ABSTRACTION

### Base Class Abstraction
**File:** `server/services/user-patient-service/app/database.py`
- **Line 21**: `Base = declarative_base()` - abstract base for all models

**File:** `server/services/financial-service/app/database.py`
- **Line 21**: `Base = declarative_base()` - abstract base

**File:** `server/services/diagnosis-workflow-service/app/database.py`
- **Line 21**: `Base = declarative_base()` - abstract base

**File:** `server/services/imaging-service/app/database.py`
- **Line 21**: `Base = declarative_base()` - abstract base

### Enum Abstraction
**File:** `server/services/user-patient-service/app/models.py`
- **Lines 5-7**: `UserType` enum - abstracts user types
- **Lines 9-13**: `StaffRole` enum - abstracts staff roles

**File:** `server/services/financial-service/app/models.py`
- **Lines 6-11**: `BillingStatus` enum - abstracts billing states

**File:** `server/services/diagnosis-workflow-service/app/models.py`
- **Lines 7-11**: `ReportStatus` enum - abstracts report states
- **Lines 13-17**: `ScanType` enum - abstracts scan types
- **Lines 19-22**: `TestStatus` enum - abstracts test states
- **Lines 62-66**: `AppointmentStatus` enum - abstracts appointment states

**File:** `server/services/imaging-service/app/models.py`
- **Lines 5-10**: `ImageType` enum - abstracts image types

### Pydantic BaseModel Abstraction
**All `schemas.py` files:**
- All schema classes inherit from `pydantic.BaseModel`
- Provides automatic validation and serialization abstraction

---

## 🟣 POLYMORPHISM

### SQLAlchemy Polymorphic Identity
**File:** `server/services/user-patient-service/app/models.py`
- **Lines 29-32**: `User.__mapper_args__` - polymorphic configuration
- **Line 31**: `"polymorphic_on": user_type` - discriminator column
- **Line 44**: `Patient.__mapper_args__` - polymorphic identity for Patient
- **Line 56**: `MedicalStaff.__mapper_args__` - polymorphic identity for Staff

### Schema Polymorphism
**File:** `server/services/user-patient-service/app/schemas.py`
- **Lines 16-20**: `UserResponse` - can represent any user type
- **Lines 45-48**: `PatientResponse` - polymorphic variant
- **Lines 59-65**: `MedicalStaffResponse` - polymorphic variant

---

## 🔴 CLASSES AND OBJECTS

### Domain Model Classes
**File:** `server/services/user-patient-service/app/models.py`
- **Lines 16-32**: `User` class
- **Lines 35-44**: `Patient` class
- **Lines 47-56**: `MedicalStaff` class

**File:** `server/services/financial-service/app/models.py`
- **Lines 13-26**: `BillingDetails` class

**File:** `server/services/diagnosis-workflow-service/app/models.py`
- **Lines 24-36**: `DiagnosisReport` class
- **Lines 38-51**: `MedicalTest` class
- **Lines 53-60**: `WorkflowLog` class
- **Lines 68-81**: `Appointment` class

**File:** `server/services/imaging-service/app/models.py`
- **Lines 12-24**: `ImageMedical` class

### Data Transfer Object Classes
**All `schemas.py` files contain:**
- Create classes (for request data)
- Update classes (for partial updates)
- Response classes (for API responses)

### Database Configuration Classes
**All `database.py` files:**
- **Line 18**: `engine` - SQLAlchemy engine object
- **Line 19**: `SessionLocal` - sessionmaker class (factory)
- **Line 21**: `Base` - declarative base class

### FastAPI Application Objects
**File:** `server/api-gateway.py`
- **Lines 8-12**: `app` - FastAPI application instance

**All `main.py` files:**
- Similar FastAPI application instances

---

## 🟠 ADDITIONAL OO PATTERNS

### Dependency Injection
**File:** `server/services/user-patient-service/app/auth.py`
- **Lines 87-106**: `get_current_user()` - uses `Depends()` for DI
- **Lines 108-117**: `get_current_active_user()` - chained dependency

**All `routes.py` files:**
- Route handlers use `Depends(get_db)` for database injection
- Route handlers use `Depends(get_current_user)` for auth injection

### Context Manager Pattern
**All `database.py` files:**
- **Lines 24-29**: `get_db()` - generator function acts as context manager

### Factory Pattern
**All `database.py` files:**
- **Line 19**: `SessionLocal` - factory for creating database sessions

**File:** `server/services/imaging-service/app/minio_client.py`
- **Lines 19-24**: `Minio()` - factory for creating MinIO client

### Singleton-like Pattern
**File:** `server/services/imaging-service/app/minio_client.py`
- **Lines 19-24**: `minio_client` - module-level singleton instance

---

## 📊 STATISTICS

- **Total Model Classes**: 8 (User, Patient, MedicalStaff, BillingDetails, DiagnosisReport, MedicalTest, WorkflowLog, Appointment, ImageMedical)
- **Total Enum Classes**: 7 (UserType, StaffRole, BillingStatus, ReportStatus, ScanType, TestStatus, AppointmentStatus, ImageType)
- **Total Schema Classes**: ~30+ (across all services)
- **Inheritance Hierarchies**: 3 main hierarchies (User, Schemas, Base models)
- **Polymorphic Implementations**: 1 (User hierarchy)

---

## 🎯 KEY FILES TO EXAMINE

1. **Best Inheritance Example**: `server/services/user-patient-service/app/models.py`
2. **Best Encapsulation Example**: `server/services/user-patient-service/app/auth.py`
3. **Best Abstraction Example**: All `database.py` files with `Base` class
4. **Best Polymorphism Example**: `server/services/user-patient-service/app/models.py` (User hierarchy)
5. **Most Classes**: `server/services/diagnosis-workflow-service/app/models.py` (4 model classes)

