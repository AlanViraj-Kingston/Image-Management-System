# Storage Analysis
## Image Management System - HealthBridge

This document analyzes all storage mechanisms and patterns used throughout the project, covering database storage, file storage, browser storage, and in-memory storage.

---

## 1. DATABASE STORAGE (PostgreSQL)

### 1.1 Database Architecture

**Technology:** PostgreSQL 15 (Relational Database Management System)

**Location:** `server/docker-compose.yml`, All `database.py` files

**Configuration:**
```yaml
# server/docker-compose.yml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_USER: ${POSTGRES_USER:-postgres}
    POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
    POSTGRES_DB: ${POSTGRES_DB:-medical_db}
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

**Connection:**
```python
# server/services/*/app/database.py
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

**How it works:**
- **Persistent Storage**: Data is stored in PostgreSQL database
- **Volume Mounting**: Database data persists in Docker volume `postgres_data`
- **Connection Pooling**: SQLAlchemy manages connection pools
- **Transaction Management**: ACID-compliant transactions

---

### 1.2 Database Tables and Storage Structure

#### User & Patient Service Tables

**Location:** `server/services/user-patient-service/app/models.py`

**Tables:**

1. **`users` Table** - Base user information
```python
class User(Base):
    __tablename__ = "users"
    
    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)  # Encrypted storage
    phone = Column(String)
    address = Column(String)
    is_active = Column(Boolean, default=True)
    user_type = Column(SQLEnum(UserType), nullable=False)
```

**Storage Details:**
- **Primary Key**: `user_id` (auto-incrementing integer)
- **Indexes**: `user_id`, `email` (for fast lookups)
- **Encrypted Data**: `password_hash` (bcrypt hashed, never plain text)
- **Enum Storage**: `user_type` stored as enum type

2. **`patients` Table** - Patient-specific information
```python
class Patient(User):
    __tablename__ = "patients"
    
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    patient_id = Column(Integer, unique=True, index=True)
    date_of_birth = Column(Date)
    conditions = Column(String)  # JSON or comma-separated string
```

**Storage Details:**
- **Inheritance**: Inherits from `users` table (joined table inheritance)
- **Foreign Key**: Links to `users.user_id`
- **Date Storage**: `date_of_birth` stored as DATE type
- **Text Storage**: `conditions` stored as VARCHAR/TEXT

3. **`medical_staff` Table** - Staff-specific information
```python
class MedicalStaff(User):
    __tablename__ = "medical_staff"
    
    user_id = Column(Integer, ForeignKey("users.user_id"), primary_key=True)
    staff_id = Column(Integer, unique=True, index=True)
    department = Column(String)
    role = Column(SQLEnum(StaffRole))
```

**Storage Details:**
- **Inheritance**: Inherits from `users` table
- **Enum Storage**: `role` stored as enum (doctor, radiologist, clerk, admin)

---

#### Financial Service Tables

**Location:** `server/services/financial-service/app/models.py`

**Table: `billing_details`**
```python
class BillingDetails(Base):
    __tablename__ = "billing_details"
    
    billing_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    appointment_id = Column(Integer, nullable=True, index=True)
    procedure = Column(String, nullable=False)
    base_cost = Column(Float, nullable=False)
    status = Column(SQLEnum(BillingStatus), default=BillingStatus.UNPAID)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    report_id = Column(Integer, nullable=True)
```

**Storage Details:**
- **Numeric Storage**: `base_cost` stored as FLOAT/REAL
- **Timestamp Storage**: `created_at`, `updated_at` with automatic updates
- **Indexes**: Multiple indexes for fast queries (`patient_id`, `appointment_id`)
- **Enum Storage**: `status` stored as enum type

---

#### Diagnosis & Workflow Service Tables

**Location:** `server/services/diagnosis-workflow-service/app/models.py`

**Tables:**

1. **`diagnosis_reports` Table**
```python
class DiagnosisReport(Base):
    __tablename__ = "diagnosis_reports"
    
    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    staff_id = Column(Integer, nullable=False)
    image_id = Column(Integer, nullable=True)
    findings = Column(String, nullable=True)
    diagnosis = Column(String, nullable=True)
    recommendations = Column(String, nullable=True)
    status = Column(SQLEnum(ReportStatus), default=ReportStatus.PENDING)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Storage Details:**
- **Text Storage**: `findings`, `diagnosis`, `recommendations` stored as TEXT/VARCHAR
- **Nullable Fields**: Many fields are optional (nullable=True)
- **Timestamp Tracking**: `updated_date` automatically updated

2. **`medical_tests` Table**
```python
class MedicalTest(Base):
    __tablename__ = "medical_tests"
    
    test_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)
    radiologist_id = Column(Integer, nullable=True, index=True)
    appointment_id = Column(Integer, nullable=True, index=True)
    test_type = Column(SQLEnum(ScanType), nullable=False)
    status = Column(SQLEnum(TestStatus), default=TestStatus.SCAN_TO_BE_TAKEN)
    report_id = Column(Integer, nullable=True)
    image_id = Column(Integer, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Storage Details:**
- **Multiple Indexes**: Indexed on `patient_id`, `doctor_id`, `radiologist_id`, `appointment_id`
- **Enum Storage**: `test_type` and `status` stored as enums
- **Relationship Storage**: Links to appointments, reports, and images via IDs

3. **`workflow_logs` Table**
```python
class WorkflowLog(Base):
    __tablename__ = "workflow_logs"
    
    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    action = Column(String, nullable=False)
```

**Storage Details:**
- **Audit Trail**: Stores all workflow actions with timestamps
- **Text Storage**: `action` stores descriptive text of actions
- **Indexed**: `user_id` indexed for fast user activity queries

4. **`appointments` Table**
```python
class Appointment(Base):
    __tablename__ = "appointments"
    
    appointment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    doctor_id = Column(Integer, nullable=False, index=True)
    appointment_date = Column(DateTime, nullable=False)
    status = Column(SQLEnum(AppointmentStatus), default=AppointmentStatus.SCHEDULED)
    payment_id = Column(Integer, nullable=True)
    created_by = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_date = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

**Storage Details:**
- **DateTime Storage**: `appointment_date` stored as TIMESTAMP
- **Text Storage**: `notes` stored as TEXT/VARCHAR
- **Status Tracking**: `status` enum tracks appointment lifecycle

---

#### Imaging Service Tables

**Location:** `server/services/imaging-service/app/models.py`

**Table: `medical_images`**
```python
class ImageMedical(Base):
    __tablename__ = "medical_images"
    
    image_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, nullable=False, index=True)
    image_type = Column(SQLEnum(ImageType), nullable=False)
    uploaded_by = Column(Integer, nullable=False)
    img_url = Column(String, nullable=False)  # Path to file storage
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)  # Size in bytes
    uploaded_at = Column(String)  # ISO format datetime string
```

**Storage Details:**
- **Metadata Storage**: Stores file metadata, not the actual file
- **Path Storage**: `img_url` stores relative path to actual file
- **Size Tracking**: `file_size` stored as integer (bytes)
- **String Timestamp**: `uploaded_at` stored as ISO format string

---

### 1.3 Database Storage Operations

**Location:** All `routes.py` files

**Create Operations:**
```python
# Create new record
new_patient = models.Patient(
    name=patient.name,
    email=patient.email,
    password_hash=hashed_password,
    # ... other fields
)
db.add(new_patient)  # Add to session
db.commit()          # Persist to database
db.refresh(new_patient)  # Reload from database
```

**Read Operations:**
```python
# Query single record
user = db.query(models.User).filter(
    models.User.user_id == user_id
).first()

# Query multiple records
patients = db.query(models.Patient).all()

# Query with filters
tests = db.query(models.MedicalTest).filter(
    models.MedicalTest.patient_id == patient_id
).order_by(models.MedicalTest.created_date.desc()).all()
```

**Update Operations:**
```python
# Update existing record
user.is_active = True
db.commit()
db.refresh(user)
```

**Delete Operations:**
```python
# Delete record
db.delete(billing)
db.commit()
```

**How it works:**
- **Session Management**: SQLAlchemy sessions manage database connections
- **Transaction Safety**: `commit()` ensures ACID compliance
- **Lazy Loading**: Queries are executed only when needed
- **Connection Pooling**: Reuses database connections efficiently

---

## 2. FILE STORAGE

### 2.1 Local File System Storage

**Location:** `server/services/imaging-service/app/file_storage.py`

**Storage Path:**
```python
# Base upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "medical_images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
```

**Directory Structure:**
```
uploads/
└── medical_images/
    ├── patient_1/
    │   ├── xray/
    │   │   └── 20240101_120000_image.jpg
    │   ├── mri/
    │   └── ct/
    ├── patient_2/
    │   └── xray/
    └── ...
```

**Storage Functions:**

1. **Save File**
```python
def save_file(file_data: bytes, file_path: str, filename: str) -> str:
    """Save a file to local storage"""
    full_dir = UPLOAD_DIR / file_path
    ensure_directory_exists(full_dir)
    
    full_path = full_dir / filename
    with open(full_path, 'wb') as f:
        f.write(file_data)
    
    return f"{file_path}{filename}"  # Return relative path
```

**How it works:**
- **Binary Storage**: Files stored as binary data (`'wb'` mode)
- **Directory Creation**: Automatically creates directory structure
- **Path Management**: Returns relative path for database storage
- **File Organization**: Organized by patient ID and image type

2. **Get File Path**
```python
def get_file_path(relative_path: str) -> Path:
    """Get the full file path from a relative path"""
    return UPLOAD_DIR / relative_path
```

3. **Get File URL**
```python
def get_file_url(relative_path: str, base_host: str = None) -> str:
    """Get the URL to access a file"""
    url_path = relative_path.replace("\\", "/")
    host = base_host or IMAGING_SERVICE_HOST
    return f"{host}{BASE_URL_PATH}/{url_path}"
```

4. **Delete File**
```python
def delete_file(relative_path: str) -> bool:
    """Delete a file from local storage"""
    file_path = get_file_path(relative_path)
    if file_path.exists():
        file_path.unlink()  # Delete file
        # Try to remove empty parent directories
        parent = file_path.parent
        if parent != UPLOAD_DIR and not any(parent.iterdir()):
            parent.rmdir()
        return True
    return False
```

**Storage Characteristics:**
- **Persistent**: Files persist on disk
- **Organized**: Hierarchical directory structure
- **Accessible**: Files served via HTTP endpoints
- **Cleanup**: Automatic directory cleanup on deletion

---

### 2.2 MinIO Object Storage (Alternative)

**Location:** `server/services/imaging-service/app/minio_client.py`

**Configuration:**
```python
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "medical-images")

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)
```

**Docker Configuration:**
```yaml
# server/docker-compose.yml
minio:
  image: minio/minio:latest
  environment:
    MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
    MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin}
  volumes:
    - minio_data:/data
  command: server /data --console-address ":9001"
```

**Storage Functions:**

1. **Upload File**
```python
def upload_file(file_data: bytes, object_name: str, content_type: str = "application/octet-stream"):
    """Upload a file to MinIO"""
    ensure_bucket_exists()
    file_stream = BytesIO(file_data)
    minio_client.put_object(
        MINIO_BUCKET_NAME,
        object_name,
        file_stream,
        length=len(file_data),
        content_type=content_type
    )
    return f"{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
```

2. **Get Presigned URL**
```python
def get_file_url(object_name: str, expires_in_seconds: int = 3600):
    """Get a presigned URL for a file"""
    url = minio_client.presigned_get_object(
        MINIO_BUCKET_NAME,
        object_name,
        expires=expires_in_seconds
    )
    return url
```

3. **Delete File**
```python
def delete_file(object_name: str):
    """Delete a file from MinIO"""
    minio_client.remove_object(MINIO_BUCKET_NAME, object_name)
    return True
```

**Storage Characteristics:**
- **S3-Compatible**: Uses S3 API for object storage
- **Scalable**: Can scale horizontally
- **Presigned URLs**: Time-limited access URLs
- **Persistent**: Data stored in Docker volume `minio_data`

**Note:** The project currently uses local file storage, but MinIO infrastructure is available as an alternative.

---

### 2.3 File Storage Workflow

**Location:** `server/services/imaging-service/app/routes.py`

**Upload Process:**
```python
@router.post("/images/upload")
async def add_image(
    patient_id: int = Form(...),
    image_type: models.ImageType = Form(...),
    uploaded_by: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1. Read file data
    file_data = await file.read()
    file_size = len(file_data)
    
    # 2. Generate unique filename
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{timestamp}_{safe_filename}"
    
    # 3. Create file path structure
    file_path = f"patient_{patient_id}/{image_type.value}/"
    
    # 4. Save file to local storage
    relative_path = save_file(file_data, file_path, unique_filename)
    
    # 5. Save metadata to database
    new_image = models.ImageMedical(
        patient_id=patient_id,
        image_type=image_type,
        uploaded_by=uploaded_by,
        img_url=relative_path,  # Store relative path
        file_name=file.filename,
        file_size=file_size,
        uploaded_at=datetime.now().isoformat()
    )
    db.add(new_image)
    db.commit()
    
    # 6. Generate URL for response
    img_url = get_file_url(relative_path, base_host=base_url)
    return ImageUploadResponse(image_id=new_image.image_id, img_url=img_url)
```

**Storage Strategy:**
- **Dual Storage**: File stored on disk, metadata in database
- **Path Reference**: Database stores relative path, not full path
- **Unique Naming**: Timestamp-based unique filenames
- **Organization**: Files organized by patient and type

---

## 3. BROWSER STORAGE (localStorage)

### 3.1 Authentication Token Storage

**Location:** `client/src/services/authService.js`

**Storage Operations:**

1. **Store Token and User Data**
```javascript
async login(email, password) {
  const response = await api.post('/api/v1/users/login', {
    email: email,
    password: password,
  });
  
  // Store in localStorage
  if (response.data.access_token) {
    localStorage.setItem('access_token', response.data.access_token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
}
```

2. **Retrieve Token**
```javascript
// In API interceptors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

3. **Retrieve User Data**
```javascript
getStoredUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}
```

4. **Check Authentication**
```javascript
isAuthenticated() {
  return !!localStorage.getItem('access_token');
}
```

5. **Clear Storage (Logout)**
```javascript
logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}
```

**Storage Keys:**
- `access_token`: JWT authentication token
- `user`: Serialized user object (JSON string)

**Storage Characteristics:**
- **Persistent**: Data persists across browser sessions
- **Domain-Specific**: Only accessible by same origin
- **String Storage**: All values stored as strings (JSON.stringify/parse)
- **Size Limit**: ~5-10MB per domain (browser-dependent)

---

### 3.2 Error Handling and Cleanup

**Location:** `client/src/services/api.js`

**Automatic Cleanup on 401:**
```javascript
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear storage and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

**How it works:**
- **Automatic Cleanup**: Removes invalid tokens on authentication errors
- **Security**: Prevents stale tokens from being used
- **User Experience**: Redirects to login on authentication failure

---

### 3.3 User Data Updates

**Location:** `client/src/components/PatientDetails.jsx`

**Update Stored User:**
```javascript
// After updating patient info
const updatedUser = { ...user, ...response.data };
localStorage.setItem('user', JSON.stringify(updatedUser));
```

**Storage Pattern:**
- **Synchronous Updates**: localStorage updated immediately after API calls
- **State Synchronization**: Keeps localStorage in sync with application state

---

## 4. IN-MEMORY STORAGE (React State)

### 4.1 Component State Storage

**Location:** All React components

**State Management:**
```javascript
// useState hook for local state
const [appointments, setAppointments] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');
const [formData, setFormData] = useState({
  patient_id: '',
  doctor_id: '',
  appointment_date: '',
});
```

**Storage Characteristics:**
- **Temporary**: Lost on component unmount
- **Component-Scoped**: Each component has its own state
- **Reactive**: Changes trigger re-renders
- **Fast Access**: In-memory access (no I/O)

---

### 4.2 Context-Based State Storage

**Location:** `client/src/context/AuthContext.jsx`

**Global State:**
```javascript
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Initialize from localStorage
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  
  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**Storage Characteristics:**
- **Global Access**: Available to all components
- **Persistent**: Initialized from localStorage
- **Shared State**: Single source of truth for user data
- **Provider Pattern**: Context provider manages state

---

## 5. STORAGE PATTERNS AND STRATEGIES

### 5.1 Multi-Tier Storage Architecture

```
┌─────────────────────────────────────────┐
│         Client (Browser)                │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │ localStorage │  │  React State    │ │
│  │ (Persistent) │  │  (Temporary)    │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
                    │
                    │ HTTP API
                    ▼
┌─────────────────────────────────────────┐
│         Server (Backend)                 │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  PostgreSQL  │  │  File Storage   │ │
│  │  (Metadata)  │  │  (Binary Data)  │ │
│  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────┘
```

**Storage Tiers:**
1. **Browser Storage**: Authentication tokens, user preferences
2. **React State**: Temporary UI state, form data
3. **Database**: Structured data, metadata, relationships
4. **File System**: Binary files, images, documents

---

### 5.2 Data Flow Patterns

**Read Pattern:**
```
User Request → API Call → Database Query → Return Data → Update State → Render UI
```

**Write Pattern:**
```
User Action → Update State → API Call → Database Write → File Storage (if needed) → Update State → Render UI
```

**Authentication Pattern:**
```
Login → API Call → Verify Credentials → Generate Token → Store in localStorage → Update Context → Redirect
```

---

### 5.3 Storage Best Practices Observed

1. **Separation of Concerns**
   - Metadata in database
   - Files in file system
   - Tokens in browser storage

2. **Security**
   - Passwords never stored in plain text (bcrypt hashing)
   - Tokens stored securely in localStorage
   - File paths stored, not full system paths

3. **Performance**
   - Indexes on frequently queried columns
   - Lazy loading for large datasets
   - Caching in React state

4. **Data Integrity**
   - Foreign key relationships (conceptual)
   - Transaction management (ACID)
   - Validation before storage

5. **Scalability**
   - Microservices with separate databases
   - File storage can be moved to object storage (MinIO)
   - Stateless API design

---

## 6. STORAGE STATISTICS

### Database Storage
- **Total Tables**: 8 tables across 4 services
- **Total Columns**: ~50+ columns
- **Indexes**: ~30+ indexes for performance
- **Relationships**: Multiple foreign key relationships

### File Storage
- **Storage Type**: Local file system (with MinIO option)
- **Organization**: Hierarchical by patient and type
- **Metadata**: Stored in database table

### Browser Storage
- **Storage Type**: localStorage
- **Keys Used**: 2 (`access_token`, `user`)
- **Data Format**: JSON strings
- **Persistence**: Across browser sessions

### In-Memory Storage
- **State Variables**: ~100+ useState hooks across components
- **Context Providers**: 1 (AuthContext)
- **Temporary Data**: Form data, UI state, API responses

---

## 7. STORAGE OPERATIONS SUMMARY

| Operation | Database | File System | localStorage | React State |
|-----------|----------|-------------|--------------|-------------|
| **Create** | `db.add()` + `db.commit()` | `save_file()` | `setItem()` | `setState()` |
| **Read** | `db.query().first()` | `get_file_path()` | `getItem()` | `useState()` |
| **Update** | Modify + `db.commit()` | Overwrite file | `setItem()` | `setState()` |
| **Delete** | `db.delete()` + `db.commit()` | `delete_file()` | `removeItem()` | `setState(null)` |
| **List** | `db.query().all()` | Directory listing | N/A | Array state |

---

## 8. KEY STORAGE FEATURES

### 8.1 Data Persistence
- **Database**: Permanent storage with ACID guarantees
- **File System**: Persistent file storage
- **localStorage**: Persistent browser storage
- **React State**: Temporary (lost on refresh)

### 8.2 Data Types Stored
- **Structured Data**: Users, appointments, tests, reports, billing
- **Binary Data**: Medical images (X-Ray, MRI, CT, Ultrasound)
- **Authentication Data**: JWT tokens, user sessions
- **Temporary Data**: Form inputs, UI state, loading states

### 8.3 Storage Locations
- **Backend**: PostgreSQL database, local file system, MinIO (optional)
- **Frontend**: Browser localStorage, React component state, Context state

---

## 9. STORAGE SECURITY CONSIDERATIONS

1. **Password Storage**: Hashed with bcrypt (never plain text)
2. **Token Storage**: JWT tokens in localStorage (consider httpOnly cookies for production)
3. **File Access**: Files served via authenticated endpoints
4. **Data Validation**: Pydantic schemas validate before storage
5. **SQL Injection**: Prevented by SQLAlchemy ORM
6. **XSS Protection**: JSON.stringify prevents XSS in localStorage

---

This comprehensive storage analysis demonstrates a well-architected multi-tier storage system with proper separation of concerns, security measures, and scalability considerations.

