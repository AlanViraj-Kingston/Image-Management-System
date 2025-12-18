# Integration and Selection Analysis
## HealthBridge - Image Management System

Short analysis of integration patterns and selection logic used in the project.

---

## 1. INTEGRATION

### 1.1 Microservices Integration

**Architecture:** 4 independent services communicate via HTTP/REST

```
React Client → API Gateway → [User Service | Imaging Service | Diagnosis Service | Financial Service]
```

**Integration Points:**
- **API Gateway** (`server/api-gateway.py`): Central entry point, routes to services
- **Docker Network** (`ims-network`): Services communicate via service names
- **Shared Database**: All services connect to same PostgreSQL instance
- **REST APIs**: Frontend integrates via Axios HTTP calls

**Example:**
```python
# Frontend service integration
const response = await api.post('/api/v1/users/login', { email, password });
```

---

### 1.2 Frontend-Backend Integration

**Service Layer Pattern:**
- `authService.js` - User authentication
- `appointmentService.js` - Appointments
- `testService.js` - Medical tests
- `imageService.js` - Image uploads
- `billingService.js` - Billing

**Axios Interceptors:**
```javascript
// Auto-add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

---

### 1.3 Database Integration

**SQLAlchemy ORM:**
```python
# All services use same database connection pattern
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
```

**Dependency Injection:**
```python
@router.get("/users/{user_id}")
def get_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.User).filter(...).first()
```

---

## 2. SELECTION

### 2.1 Role-Based Selection (Frontend)

**Location:** `client/src/pages/Dashboard.jsx`

**User Type Selection:**
```javascript
const isPatient = user?.user_type === 'patient';
const isStaff = user?.user_type === 'staff';
const isRadiologist = staffRole === 'radiologist';
const isDoctor = staffRole === 'doctor';
const isClerk = staffRole === 'clerk';
const isAdmin = staffRole === 'admin';
```

**Conditional Rendering:**
```javascript
{isPatient && activeView === 'details' ? (
  <PatientDetails userId={user.user_id} />
) : isDoctor && activeView === 'appointments' ? (
  <DoctorAppointmentsView doctorId={user.user_id} />
) : isClerk && activeView === 'appointments' ? (
  <AppointmentsView clerkId={user.user_id} />
) : null}
```

---

### 2.2 Conditional Logic (Backend)

**Authentication Selection:**
```python
# server/services/user-patient-service/app/routes.py
if not user or not verify_password(credentials.password, user.password_hash):
    raise HTTPException(status_code=401, detail="Invalid credentials")

if not user.is_active:
    raise HTTPException(status_code=403, detail="Account deactivated")
```

**Status-Based Selection:**
```python
# server/services/diagnosis-workflow-service/app/routes.py
if test.status == models.TestStatus.SCAN_DONE:
    # Generate report
elif test.status == models.TestStatus.SCAN_IN_PROGRESS:
    # Update progress
else:
    # Handle pending
```

**Query Filtering:**
```python
query = db.query(models.BillingDetails)
if status:
    query = query.filter(models.BillingDetails.status == status)
return query.all()
```

---

### 2.3 Error Handling Selection

**Frontend:**
```javascript
try {
  const response = await api.post('/api/v1/patients/', data);
  toast.success('Success!');
} catch (error) {
  if (error.response?.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  } else {
    toast.error(error.message);
  }
}
```

**Backend:**
```python
try:
    db.add(new_record)
    db.commit()
except Exception as e:
    db.rollback()
    raise HTTPException(status_code=500, detail=str(e))
```

---

### 2.4 Data Selection Patterns

**Optional Field Selection:**
```python
# Update only provided fields
if update_data.name is not None:
    user.name = update_data.name
if update_data.phone is not None:
    user.phone = update_data.phone
```

**Enum Selection:**
```python
# Status selection
status = models.ReportStatus.FINALIZED if (findings or diagnosis) else models.ReportStatus.PENDING
```

**Array Filtering:**
```javascript
// Filter radiologists from all staff
const radiologists = allStaff.filter(staff => staff.role === 'radiologist');
```

---

## 3. KEY PATTERNS

| Pattern | Location | Example |
|---------|----------|---------|
| **Service Integration** | Frontend services | `api.post('/api/v1/users/login')` |
| **Role Selection** | Dashboard | `isDoctor && activeView === 'appointments'` |
| **Conditional Logic** | Routes | `if not user: raise HTTPException` |
| **Query Filtering** | Database queries | `query.filter(status == status)` |
| **Error Selection** | Error handlers | `if status === 401: redirect` |

---

## SUMMARY

- **Integration**: REST APIs, Docker networking, shared database
- **Selection**: Role-based UI, conditional logic, query filtering
- **Patterns**: Service layer, dependency injection, error handling

