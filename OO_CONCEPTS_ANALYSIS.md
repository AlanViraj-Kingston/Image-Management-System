# Object-Oriented Concepts Analysis
## Image Management System - HealthBridge

This document highlights where and how Object-Oriented (OO) concepts have been implemented throughout the project.

---

## 1. INHERITANCE

### 1.1 SQLAlchemy Model Inheritance (Polymorphic Inheritance)
**Location:** `server/services/user-patient-service/app/models.py`

**Implementation:**
```python
# Base User Table (Abstract-like)
class User(Base):
    __tablename__ = "users"
    # ... common attributes ...
    
    __mapper_args__ = {
        "polymorphic_identity": UserType.STAFF,
        "polymorphic_on": user_type,
    }

# Patient Table (Inherits from User)
class Patient(User):
    __tablename__ = "patients"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    # ... patient-specific attributes ...
    __mapper_args__ = {"polymorphic_identity": UserType.PATIENT}

# Medical Staff Table (Inherits from User)
class MedicalStaff(User):
    __tablename__ = "medical_staff"
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    # ... staff-specific attributes ...
    __mapper_args__ = {"polymorphic_identity": UserType.STAFF}
```

**How it works:**
- **Single Table Inheritance Pattern**: `User` is the base class with common attributes (name, email, password_hash, etc.)
- **Polymorphic Identity**: Each subclass (`Patient`, `MedicalStaff`) has a unique `polymorphic_identity` that distinguishes them
- **Polymorphic Discriminator**: The `user_type` column acts as the discriminator to determine which subclass an instance belongs to
- **Benefits**: 
  - Code reusability (common user attributes defined once)
  - Type safety (SQLAlchemy automatically handles type casting)
  - Database efficiency (shared table structure)

---

### 1.2 Pydantic Schema Inheritance
**Location:** `server/services/user-patient-service/app/schemas.py`

**Implementation:**
```python
# Base schema with common fields
class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None

# Inherits from UserBase, adds user_type
class UserCreate(UserBase):
    user_type: UserType

# Inherits from UserBase, adds password
class UserWithPassword(UserBase):
    password: str

# Inherits from UserWithPassword, adds patient-specific fields
class PatientCreate(UserWithPassword):
    date_of_birth: date
    conditions: Optional[str] = None

# Inherits from UserResponse (which inherits from UserBase)
class PatientResponse(UserResponse):
    patient_id: int
    date_of_birth: Optional[date] = None
    conditions: Optional[str] = None
```

**How it works:**
- **Multi-level Inheritance**: `UserBase` → `UserWithPassword` → `PatientCreate`
- **Schema Composition**: Different schemas inherit common fields and add specific ones
- **Benefits**:
  - DRY (Don't Repeat Yourself) principle
  - Consistent validation across related schemas
  - Easy to maintain and extend

**Similar patterns found in:**
- `server/services/financial-service/app/schemas.py` - `BillingDetailsCreate`, `BillingDetailsUpdate`, `BillingDetailsResponse`
- `server/services/diagnosis-workflow-service/app/schemas.py` - Multiple schema hierarchies
- `server/services/imaging-service/app/schemas.py` - `ImageMedicalCreate`, `ImageMedicalResponse`

---

## 2. ENCAPSULATION

### 2.1 Class Attributes and Methods
**Location:** All model classes in `models.py` files

**Implementation:**
```python
class User(Base):
    __tablename__ = "users"  # Private-like attribute (convention: double underscore)
    
    # Public attributes (accessible via instances)
    user_id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)  # Protected: never exposed in responses
    
    # Class-level configuration
    __mapper_args__ = {...}  # Encapsulated ORM configuration
```

**How it works:**
- **Data Hiding**: `password_hash` is stored but never returned in API responses (see `UserResponse` schema)
- **Access Control**: Attributes are accessed through SQLAlchemy ORM, providing controlled access
- **Configuration Encapsulation**: `__mapper_args__` encapsulates ORM-specific settings

---

### 2.2 Service Layer Encapsulation
**Location:** `server/services/imaging-service/app/file_storage.py` and `minio_client.py`

**Implementation:**
```python
# file_storage.py - Encapsulates file operations
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "medical_images"  # Module-level constant

def save_file(file_data: bytes, file_path: str, filename: str) -> str:
    """Encapsulates file saving logic"""
    full_dir = UPLOAD_DIR / file_path
    ensure_directory_exists(full_dir)
    # ... implementation details hidden ...

def get_file_path(relative_path: str) -> Path:
    """Encapsulates path resolution logic"""
    return UPLOAD_DIR / relative_path
```

**How it works:**
- **Function Encapsulation**: File operations are wrapped in functions, hiding implementation details
- **Module-level Constants**: `UPLOAD_DIR` is encapsulated at module level
- **Interface Abstraction**: External code doesn't need to know about directory structure

---

### 2.3 Authentication Encapsulation
**Location:** `server/services/user-patient-service/app/auth.py`

**Implementation:**
```python
# Encapsulated password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Encapsulated JWT configuration
SECRET_KEY = "your-secret-key-change-this-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def hash_password(password: str) -> str:
    """Encapsulates password hashing implementation"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Encapsulates password verification logic"""
    return pwd_context.verify(plain_password, hashed_password)
```

**How it works:**
- **Security Encapsulation**: Password hashing details are hidden from callers
- **Configuration Encapsulation**: JWT settings are centralized
- **Implementation Hiding**: Callers don't need to know about bcrypt or JWT internals

---

## 3. ABSTRACTION

### 3.1 Base Class Abstraction
**Location:** `server/services/*/app/database.py`

**Implementation:**
```python
# Abstract base class for all models
Base = declarative_base()

# All models inherit from this abstract base
class User(Base):
    # ...

class BillingDetails(Base):
    # ...

class DiagnosisReport(Base):
    # ...
```

**How it works:**
- **Abstract Base Pattern**: `Base` provides common ORM functionality to all models
- **Interface Definition**: All models must follow SQLAlchemy's declarative pattern
- **Consistency**: Ensures all models have the same base capabilities

---

### 3.2 Enum Abstraction
**Location:** Multiple `models.py` files

**Implementation:**
```python
class UserType(str, enum.Enum):
    PATIENT = "patient"
    STAFF = "staff"

class StaffRole(str, enum.Enum):
    DOCTOR = "doctor"
    RADIOLOGIST = "radiologist"
    CLERK = "clerk"
    ADMIN = "admin"

class BillingStatus(str, enum.Enum):
    UNPAID = "unpaid"
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
```

**How it works:**
- **Type Safety**: Enums restrict values to predefined options
- **Abstraction**: Represents domain concepts (statuses, roles) as objects
- **Benefits**: 
  - Prevents invalid values
  - Self-documenting code
  - IDE autocomplete support

---

### 3.3 Pydantic BaseModel Abstraction
**Location:** All `schemas.py` files

**Implementation:**
```python
from pydantic import BaseModel

class UserBase(BaseModel):
    # Abstract base for all user-related schemas
    name: str
    email: EmailStr
    # ...

class PatientCreate(UserBase):
    # Concrete implementation
    date_of_birth: date
```

**How it works:**
- **Data Validation Abstraction**: `BaseModel` provides automatic validation
- **Serialization Abstraction**: Handles JSON conversion automatically
- **Type Safety**: Type hints provide compile-time safety

---

## 4. POLYMORPHISM

### 4.1 SQLAlchemy Polymorphic Identity
**Location:** `server/services/user-patient-service/app/models.py`

**Implementation:**
```python
class User(Base):
    __mapper_args__ = {
        "polymorphic_identity": UserType.STAFF,
        "polymorphic_on": user_type,  # Discriminator column
    }

class Patient(User):
    __mapper_args__ = {"polymorphic_identity": UserType.PATIENT}

class MedicalStaff(User):
    __mapper_args__ = {"polymorphic_identity": UserType.STAFF}
```

**How it works:**
- **Runtime Polymorphism**: SQLAlchemy automatically instantiates the correct subclass based on `user_type`
- **Single Interface**: Code can work with `User` objects, but get `Patient` or `MedicalStaff` instances
- **Example Usage:**
  ```python
  user = db.query(User).filter(User.user_id == 1).first()
  # user could be Patient or MedicalStaff instance
  # Access is polymorphic - same interface, different behavior
  ```

---

### 4.2 Schema Polymorphism
**Location:** `server/services/user-patient-service/app/schemas.py`

**Implementation:**
```python
# Base response can represent different user types
class UserResponse(UserBase):
    user_id: int
    user_type: UserType  # Determines which subclass to use

class PatientResponse(UserResponse):
    patient_id: int
    # Additional patient fields

class MedicalStaffResponse(UserResponse):
    staff_id: int
    # Additional staff fields
```

**How it works:**
- **Response Polymorphism**: Same endpoint can return different response types
- **Type-based Behavior**: `user_type` determines which fields are available
- **Flexible API**: One endpoint handles multiple user types

---

## 5. CLASSES AND OBJECTS

### 5.1 SQLAlchemy ORM Classes (Domain Models)
**Location:** All `models.py` files

**Classes Defined:**
1. **User-Patient Service:**
   - `User` (base class)
   - `Patient` (inherits from User)
   - `MedicalStaff` (inherits from User)
   - `UserType` (Enum)
   - `StaffRole` (Enum)

2. **Financial Service:**
   - `BillingDetails`
   - `BillingStatus` (Enum)

3. **Diagnosis-Workflow Service:**
   - `DiagnosisReport`
   - `MedicalTest`
   - `WorkflowLog`
   - `Appointment`
   - `ReportStatus` (Enum)
   - `ScanType` (Enum)
   - `TestStatus` (Enum)
   - `AppointmentStatus` (Enum)

4. **Imaging Service:**
   - `ImageMedical`
   - `ImageType` (Enum)

**How they work:**
- Each class represents a database table
- Instances represent database rows
- Methods and properties provide object-oriented access to data
- Relationships are defined through foreign keys (conceptually, though not enforced for microservices)

---

### 5.2 Pydantic Schema Classes (Data Transfer Objects)
**Location:** All `schemas.py` files

**Classes Defined:**
- **Create Schemas**: `UserCreate`, `PatientCreate`, `MedicalStaffCreate`, `BillingDetailsCreate`, etc.
- **Update Schemas**: `PatientUpdate`, `BillingDetailsUpdate`, `DiagnosisReportUpdate`, etc.
- **Response Schemas**: `UserResponse`, `PatientResponse`, `BillingDetailsResponse`, etc.

**How they work:**
- **Request/Response Objects**: Represent data structures for API communication
- **Validation**: Automatically validate input data
- **Serialization**: Convert between Python objects and JSON
- **Type Safety**: Type hints ensure correct data types

---

### 5.3 Database Configuration Classes
**Location:** All `database.py` files

**Implementation:**
```python
# SessionLocal is a class factory (callable class)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base is a class that other classes inherit from
Base = declarative_base()
```

**How it works:**
- **Factory Pattern**: `SessionLocal()` creates new database session objects
- **Base Class**: `Base` is the parent class for all ORM models
- **Singleton-like Pattern**: `engine` is created once and reused

---

### 5.4 FastAPI Application Class
**Location:** `server/api-gateway.py` and all `main.py` files

**Implementation:**
```python
app = FastAPI(
    title="HealthBridge - API Gateway",
    description="Central gateway to access all microservices",
    version="1.0.0"
)
```

**How it works:**
- **Application Object**: `app` is an instance of the `FastAPI` class
- **Configuration**: Class instantiation with configuration parameters
- **Method Decorators**: Routes are added as methods using decorators (`@app.get()`, `@app.post()`, etc.)

---

## 6. ADDITIONAL OO PATTERNS

### 6.1 Dependency Injection
**Location:** FastAPI route handlers

**Implementation:**
```python
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    # Dependencies are injected automatically
    # ...

@app.get("/users/me")
def read_users_me(current_user: models.User = Depends(get_current_user)):
    # current_user is injected by FastAPI
    return current_user
```

**How it works:**
- **Constructor Injection**: Dependencies are injected via function parameters
- **Automatic Resolution**: FastAPI resolves dependencies automatically
- **Loose Coupling**: Routes don't need to know how to create dependencies

---

### 6.2 Context Manager Pattern
**Location:** `server/services/*/app/database.py`

**Implementation:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db  # Generator function acts as context manager
    finally:
        db.close()
```

**How it works:**
- **Resource Management**: Ensures database connections are properly closed
- **Exception Safety**: `finally` block guarantees cleanup
- **Generator Pattern**: `yield` makes it work with FastAPI's dependency injection

---

### 6.3 Factory Pattern
**Location:** `server/services/imaging-service/app/minio_client.py`

**Implementation:**
```python
# MinIO client is created as a singleton-like object
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

# Functions act as factory methods for operations
def upload_file(file_data: bytes, object_name: str, content_type: str = "application/octet-stream"):
    # Factory method for creating upload operations
    # ...
```

**How it works:**
- **Client Factory**: `Minio()` constructor creates client instances
- **Operation Factories**: Functions create specific operation objects/behaviors

---

## 7. FRONTEND OO CONCEPTS (React)

### 7.1 Component Classes (Functional Components with Hooks)
**Location:** `client/src/components/` and `client/src/pages/`

**Note:** While React uses functional components (not class components), the concept of components as reusable objects still applies.

**Implementation:**
```javascript
// Components are like classes - they encapsulate state and behavior
const Dashboard = () => {
  const { user, logout } = useAuth();  // State/context access
  const [activeView, setActiveView] = useState(null);  // Local state
  
  // Methods (functions within component)
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // Render method (return statement)
  return (/* JSX */);
};
```

**How it works:**
- **Encapsulation**: Each component encapsulates its own state and logic
- **Reusability**: Components can be reused with different props
- **Composition**: Components can be composed together

---

### 7.2 Context API (State Management)
**Location:** `client/src/context/AuthContext.jsx`

**Implementation:**
```javascript
const AuthContext = createContext(null);  // Context object (like a class)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);  // Encapsulated state
  
  // Methods
  const login = async (userId, name) => { /* ... */ };
  const logout = () => { /* ... */ };
  
  // Public interface (value object)
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**How it works:**
- **Singleton Pattern**: Context provides a single source of truth
- **Encapsulation**: State and methods are encapsulated in the provider
- **Public Interface**: `value` object exposes the public API

---

## SUMMARY TABLE

| OO Concept | Location | Example |
|------------|----------|---------|
| **Inheritance** | `models.py`, `schemas.py` | `Patient(User)`, `PatientCreate(UserWithPassword)` |
| **Encapsulation** | All classes | Private attributes (`__tablename__`), hidden implementation |
| **Abstraction** | `Base` class, Enums, `BaseModel` | `declarative_base()`, Enum classes |
| **Polymorphism** | SQLAlchemy models, Schemas | Polymorphic identity, schema inheritance |
| **Classes & Objects** | All `models.py`, `schemas.py` | Domain models, DTOs |
| **Dependency Injection** | FastAPI routes | `Depends()` decorator |
| **Factory Pattern** | Database, MinIO client | `SessionLocal()`, `Minio()` |
| **Context Manager** | Database sessions | `get_db()` generator |

---

## KEY TAKEAWAYS

1. **Strong OO Foundation**: The project extensively uses OO principles, especially in the backend
2. **ORM-Based Models**: SQLAlchemy provides a rich OO interface to database tables
3. **Schema Inheritance**: Pydantic schemas use inheritance for code reuse and consistency
4. **Polymorphic Models**: User hierarchy demonstrates polymorphic inheritance
5. **Encapsulation**: Security-sensitive data (passwords) and implementation details are properly encapsulated
6. **Abstraction**: Base classes and enums provide clean abstractions over implementation details
7. **Modern Patterns**: Dependency injection and context managers provide modern OO patterns

---

## RECOMMENDATIONS FOR ENHANCEMENT

1. **Add Abstract Base Classes**: Consider using Python's `abc` module for true abstract classes
2. **Service Layer Classes**: Consider creating service classes to encapsulate business logic
3. **Repository Pattern**: Implement repository classes to abstract database operations
4. **Strategy Pattern**: Use strategy pattern for different storage backends (MinIO vs local file storage)

