# Method Invocation Analysis
## Image Management System - HealthBridge

This document analyzes how method invocation is implemented throughout the project, covering both backend (Python) and frontend (JavaScript/React) implementations.

---

## 1. BACKEND METHOD INVOCATION (Python)

### 1.1 SQLAlchemy ORM Method Invocation

#### Query Method Invocation
**Location:** All `routes.py` files

**Pattern:** `db.query(Model).filter(...).first()`, `db.query(Model).all()`

**Examples:**

```python
# server/services/user-patient-service/app/routes.py

# Method invocation: query() on Session object
user = db.query(models.User).filter(
    models.User.email == credentials.email
).first()

# Method invocation chain: query() -> filter() -> first()
patient = db.query(models.Patient).filter(
    models.Patient.patient_id == patient_id
).first()

# Method invocation: query() -> all()
return db.query(models.Patient).all()

# Method invocation chain: query() -> filter() -> order_by() -> all()
tests = db.query(models.MedicalTest).filter(
    models.MedicalTest.patient_id == patient_id
).order_by(models.MedicalTest.created_date.desc()).all()
```

**How it works:**
- **Object Method Invocation**: `db` (Session object) invokes `query()` method
- **Method Chaining**: Each method returns a query object, allowing chaining
- **Lazy Evaluation**: Query is not executed until `first()`, `all()`, or `one()` is called
- **Fluent Interface Pattern**: Methods can be chained for readability

**Key Methods Invoked:**
- `db.query(Model)` - Creates a query object
- `.filter(condition)` - Adds WHERE clause
- `.first()` - Executes query and returns first result or None
- `.all()` - Executes query and returns all results as list
- `.order_by(column)` - Adds ORDER BY clause
- `.limit(n)` - Limits number of results

---

#### Session Management Method Invocation
**Location:** All `routes.py` files

**Pattern:** `db.add()`, `db.commit()`, `db.refresh()`, `db.delete()`

**Examples:**

```python
# server/services/user-patient-service/app/routes.py

# Method invocation: add() on Session object
db.add(new_patient)

# Method invocation: commit() to persist changes
db.commit()

# Method invocation: refresh() to reload object from database
db.refresh(new_patient)

# Method invocation: delete() to remove object
db.delete(billing)
db.commit()
```

**How it works:**
- **Instance Method Invocation**: Methods are called on the `db` Session instance
- **Transaction Management**: `commit()` persists changes to database
- **State Management**: `refresh()` reloads object with latest database state
- **Cascade Operations**: `add()` adds object to session, `commit()` saves it

**Key Methods:**
- `db.add(object)` - Adds object to session (pending insert)
- `db.commit()` - Commits transaction to database
- `db.refresh(object)` - Reloads object from database
- `db.delete(object)` - Marks object for deletion
- `db.rollback()` - Rolls back transaction

---

### 1.2 Authentication Method Invocation

**Location:** `server/services/user-patient-service/app/auth.py` and `routes.py`

**Pattern:** Function calls on module-level objects

**Examples:**

```python
# server/services/user-patient-service/app/auth.py

# Method invocation: hash() on CryptContext object
def hash_password(password: str) -> str:
    return pwd_context.hash(password)  # pwd_context is CryptContext instance

# Method invocation: verify() on CryptContext object
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Method invocation: encode() on jwt module
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Method invocation: decode() on jwt module
def verify_token(token: str, credentials_exception):
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    return int(payload.get("sub"))
```

**Usage in Routes:**

```python
# server/services/user-patient-service/app/routes.py

# Function invocation: hash_password()
hashed_password = hash_password(patient.password)

# Function invocation: verify_password()
if not user or not verify_password(credentials.password, user.password_hash):
    raise HTTPException(...)

# Function invocation: create_access_token()
access_token = create_access_token(
    data={"sub": str(user.user_id), "user_type": user.user_type.value},
    expires_delta=access_token_expires
)
```

**How it works:**
- **Module-level Function Invocation**: Functions are imported and called directly
- **Object Method Invocation**: `pwd_context.hash()` and `pwd_context.verify()` are instance methods
- **Library Method Invocation**: `jwt.encode()` and `jwt.decode()` are module functions
- **Dependency Injection**: Functions receive dependencies as parameters

---

### 1.3 FastAPI Dependency Injection Method Invocation

**Location:** All `routes.py` files

**Pattern:** `Depends(function)` - Dependency injection

**Examples:**

```python
# server/services/user-patient-service/app/routes.py

# Method invocation via dependency injection
@router.post("/users/login", response_model=schemas.Token)
def login_user(
    credentials: schemas.UserLogin,
    db: Session = Depends(get_db)  # get_db() is invoked by FastAPI
):
    # db is automatically created by calling get_db()
    user = db.query(models.User).filter(...).first()

# Method invocation: get_current_user() via Depends()
@router.get("/users/me", response_model=schemas.UserResponse)
def get_current_user_info(
    current_user: models.User = Depends(get_current_user)  # get_current_user() invoked
):
    return current_user
```

**How it works:**
- **Automatic Invocation**: FastAPI automatically calls dependency functions
- **Dependency Chain**: Dependencies can depend on other dependencies
- **Lazy Evaluation**: Dependencies are only called when route is accessed
- **Context Management**: `get_db()` uses generator pattern for cleanup

**Dependency Function:**

```python
# server/services/user-patient-service/app/database.py

def get_db():
    db = SessionLocal()  # Method invocation: SessionLocal() creates session
    try:
        yield db  # Generator pattern
    finally:
        db.close()  # Method invocation: close() on Session object
```

---

### 1.4 File Storage Method Invocation

**Location:** `server/services/imaging-service/app/routes.py` and `file_storage.py`

**Pattern:** Module-level function calls

**Examples:**

```python
# server/services/imaging-service/app/file_storage.py

# Function invocation: save_file()
relative_path = save_file(file_data, file_path, unique_filename)

# Function invocation: get_file_url()
img_url = get_file_url(relative_path, base_host=base_url)

# Function invocation: get_file_path()
full_path = get_file_path(file_path)

# Function invocation: delete_file()
delete_storage_file(image.img_url)
```

**Usage in Routes:**

```python
# server/services/imaging-service/app/routes.py

# Method invocation: read() on UploadFile object
file_data = await file.read()

# Method invocation: save_file() function
relative_path = save_file(file_data, file_path, unique_filename)

# Method invocation: get_file_url() function
img_url = get_file_url(relative_path, base_host=base_url)
```

**How it works:**
- **Async Method Invocation**: `await file.read()` - async method call
- **Module Function Invocation**: Functions are called directly from imported module
- **Path Object Method Invocation**: `Path` objects have methods like `.exists()`, `.mkdir()`

---

### 1.5 Pydantic Schema Method Invocation

**Location:** All `routes.py` files

**Pattern:** Schema instantiation and method calls

**Examples:**

```python
# server/services/user-patient-service/app/routes.py

# Constructor invocation: Patient() class instantiation
new_patient = models.Patient(
    name=patient.name,
    email=patient.email,
    password_hash=hashed_password,
    # ... other attributes
)

# Schema instantiation: Response schema
return schemas.PatientResponse(
    patient_id=patient.patient_id,
    # ... other fields
)
```

**How it works:**
- **Constructor Invocation**: `models.Patient(...)` calls `__init__()` method
- **Schema Validation**: Pydantic automatically validates on instantiation
- **Attribute Access**: After instantiation, attributes can be accessed via dot notation

---

### 1.6 Enum Method Invocation

**Location:** All `models.py` and `routes.py` files

**Pattern:** Enum value access and comparison

**Examples:**

```python
# server/services/user-patient-service/app/models.py

# Enum value access
user_type=models.UserType.PATIENT  # Accessing enum member

# Enum method invocation: .value property
user.user_type.value  # Gets string value of enum

# Enum comparison
if user.user_type != models.UserType.PATIENT:
    raise HTTPException(...)
```

**How it works:**
- **Enum Member Access**: `EnumClass.MEMBER` accesses enum member
- **Value Access**: `.value` property returns the underlying value
- **Comparison**: Enums can be compared directly

---

## 2. FRONTEND METHOD INVOCATION (JavaScript/React)

### 2.1 Service Object Method Invocation

**Location:** `client/src/services/*.js`

**Pattern:** Object method calls on service objects

**Examples:**

```javascript
// client/src/services/authService.js

export const authService = {
  // Method definition
  async login(email, password) {
    try {
      // Method invocation: post() on api object
      const response = await api.post('/api/v1/users/login', {
        email: email,
        password: password,
      });
      
      // Method invocation: setItem() on localStorage object
      if (response.data.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Method invocation: getItem() on localStorage
  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
  
  // Method invocation: getItem() and JSON.parse()
  getStoredUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
};
```

**Usage in Components:**

```javascript
// client/src/pages/LoginPage.jsx

// Method invocation: login() on authService object
await login(email.trim().toLowerCase(), password);

// Method invocation chain: email.trim().toLowerCase()
email.trim().toLowerCase()
```

**How it works:**
- **Object Method Invocation**: Methods are called on service objects
- **Async Method Invocation**: `await` is used for async methods
- **Method Chaining**: Methods can be chained (e.g., `email.trim().toLowerCase()`)
- **API Method Invocation**: `api.post()`, `api.get()`, etc. are axios methods

---

### 2.2 Axios HTTP Method Invocation

**Location:** All service files in `client/src/services/`

**Pattern:** HTTP method calls on axios instances

**Examples:**

```javascript
// client/src/services/testService.js

const testApi = axios.create({
  baseURL: DIAGNOSIS_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const testService = {
  // Method invocation: post() on axios instance
  async createTest(testData) {
    const response = await testApi.post('/api/v1/tests/', testData);
    return response.data;
  },
  
  // Method invocation: get() on axios instance
  async getPatientTests(patientId) {
    const response = await testApi.get(`/api/v1/tests/patient/${patientId}`);
    return response.data;
  },
  
  // Method invocation: put() on axios instance
  async updateTest(testId, updateData) {
    const response = await testApi.put(`/api/v1/tests/${testId}`, updateData);
    return response.data;
  },
};
```

**How it works:**
- **Instance Method Invocation**: Methods are called on axios instance
- **Promise-based**: All methods return Promises
- **Async/Await**: Methods are called with `await` for synchronous-like code
- **Method Variants**: `post()`, `get()`, `put()`, `delete()`, `patch()`

---

### 2.3 React Hook Method Invocation

**Location:** All React components

**Pattern:** Hook function calls

**Examples:**

```javascript
// client/src/pages/Dashboard.jsx

// Hook invocation: useState()
const [activeView, setActiveView] = useState(null);

// Hook invocation: useEffect()
useEffect(() => {
  fetchAppointments();
  fetchOptions();
}, []);

// Hook invocation: useAuth() - custom hook
const { user, logout } = useAuth();

// Hook invocation: useNavigate()
const navigate = useNavigate();
```

**How it works:**
- **Function Invocation**: Hooks are functions called at component top level
- **Custom Hook Invocation**: `useAuth()` is a custom hook that returns object
- **Destructuring**: Return values are destructured from hook calls
- **State Setter Invocation**: `setActiveView()` is a function returned by `useState()`

---

### 2.4 React Context Method Invocation

**Location:** `client/src/context/AuthContext.jsx`

**Pattern:** Context provider and consumer methods

**Examples:**

```javascript
// client/src/context/AuthContext.jsx

// Method invocation: createContext()
const AuthContext = createContext(null);

// Method invocation: useContext()
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Method invocation: useState() hooks
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Method invocation: getStoredUser() on authService
  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser && authService.isAuthenticated()) {
      setUser(storedUser);
    }
    setLoading(false);
  }, []);
  
  // Method invocation: login() on authService
  const login = async (userId, name) => {
    const response = await authService.login(userId, name);
    setUser(response.user);
    return response;
  };
  
  // Method invocation: logout() on authService
  const logout = () => {
    authService.logout();
    setUser(null);
  };
  
  // Method invocation: Provider component
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
```

**How it works:**
- **Factory Method**: `createContext()` creates context object
- **Hook Method**: `useContext()` accesses context value
- **Component Method**: `Provider` is a React component
- **Method Composition**: Methods call other methods (e.g., `login()` calls `authService.login()`)

---

### 2.5 Array and Object Method Invocation

**Location:** Throughout React components

**Pattern:** Built-in JavaScript methods

**Examples:**

```javascript
// client/src/services/authService.js

// Method invocation: filter() on array
return allStaff.filter(staff => staff.role === 'radiologist');

// Method invocation: map() on array
{appointments.map(appointment => (
  <div key={appointment.appointment_id}>
    {/* ... */}
  </div>
))}

// Method invocation: find() on array
const patient = patients.find(p => p.patient_id === patientId);

// Method invocation: JSON.stringify() and JSON.parse()
localStorage.setItem('user', JSON.stringify(response.data.user));
const userStr = localStorage.getItem('user');
return userStr ? JSON.parse(userStr) : null;
```

**How it works:**
- **Array Method Invocation**: Methods like `map()`, `filter()`, `find()` are called on arrays
- **Object Method Invocation**: `JSON.stringify()` and `JSON.parse()` are static methods
- **Functional Programming**: Methods return new arrays/objects (immutability)

---

### 2.6 Event Handler Method Invocation

**Location:** All React components

**Pattern:** Event handler functions

**Examples:**

```javascript
// client/src/components/AppointmentsView.jsx

// Method invocation: async function as event handler
const handleSubmit = async (e) => {
  e.preventDefault();  // Method invocation: preventDefault() on event
  setCreating(true);
  
  try {
    // Method invocation: createAppointment() on appointmentService
    await appointmentService.createAppointment(formData);
    toast.success('Appointment created successfully!');
    setShowCreateForm(false);
    fetchAppointments();  // Method invocation: fetchAppointments()
  } catch (err) {
    toast.error(err.detail || err.message);
  } finally {
    setCreating(false);
  }
};

// JSX: onClick handler invokes method
<button onClick={handleSubmit}>Create Appointment</button>
```

**How it works:**
- **Event Method Invocation**: `e.preventDefault()` prevents default behavior
- **Handler Invocation**: Functions are invoked when events occur
- **Async Handler**: Handlers can be async functions
- **Method Reference**: Function references are passed to event handlers

---

## 3. METHOD INVOCATION PATTERNS SUMMARY

### 3.1 Backend Patterns

| Pattern | Example | Location |
|--------|---------|----------|
| **Query Method Chaining** | `db.query(Model).filter(...).first()` | All `routes.py` |
| **Session Methods** | `db.add()`, `db.commit()`, `db.refresh()` | All `routes.py` |
| **Function Invocation** | `hash_password()`, `verify_password()` | `auth.py`, `routes.py` |
| **Dependency Injection** | `Depends(get_db)` | All `routes.py` |
| **Constructor Invocation** | `models.Patient(...)` | All `routes.py` |
| **Enum Access** | `UserType.PATIENT`, `.value` | All `models.py`, `routes.py` |
| **Module Functions** | `save_file()`, `get_file_url()` | `file_storage.py`, `routes.py` |

### 3.2 Frontend Patterns

| Pattern | Example | Location |
|--------|---------|----------|
| **Service Methods** | `authService.login()` | All service files |
| **Axios Methods** | `api.post()`, `api.get()` | All service files |
| **React Hooks** | `useState()`, `useEffect()` | All components |
| **Context Methods** | `useContext()`, `createContext()` | `AuthContext.jsx` |
| **Array Methods** | `.map()`, `.filter()`, `.find()` | All components |
| **Event Handlers** | `onClick={handleSubmit}` | All components |
| **LocalStorage Methods** | `localStorage.getItem()` | Service files |

---

## 4. METHOD INVOCATION STATISTICS

### Backend (Python)
- **SQLAlchemy Query Methods**: ~200+ invocations across all routes
- **Session Methods**: ~100+ invocations (`add`, `commit`, `refresh`, `delete`)
- **Authentication Methods**: ~50+ invocations (`hash_password`, `verify_password`, `create_access_token`)
- **File Storage Methods**: ~20+ invocations (`save_file`, `get_file_url`, `delete_file`)

### Frontend (JavaScript)
- **Service Method Calls**: ~150+ invocations across all services
- **Axios HTTP Methods**: ~100+ invocations (`post`, `get`, `put`, `delete`)
- **React Hook Calls**: ~200+ invocations (`useState`, `useEffect`, `useAuth`)
- **Array Methods**: ~50+ invocations (`map`, `filter`, `find`)

---

## 5. KEY METHOD INVOCATION FEATURES

### 5.1 Method Chaining
- **Backend**: SQLAlchemy queries support fluent chaining
- **Frontend**: Array methods and string methods support chaining

### 5.2 Async Method Invocation
- **Backend**: FastAPI routes are async, database operations are sync
- **Frontend**: All API calls use async/await pattern

### 5.3 Dependency Injection
- **Backend**: FastAPI's `Depends()` automatically invokes dependency functions
- **Frontend**: Services are imported and methods called directly

### 5.4 Method Overloading
- **Backend**: Python supports default parameters for method overloading
- **Frontend**: JavaScript supports optional parameters

### 5.5 Error Handling
- **Backend**: Methods raise exceptions, caught by FastAPI
- **Frontend**: Methods throw errors, caught by try/catch blocks

---

## 6. BEST PRACTICES OBSERVED

1. **Consistent Naming**: Methods follow consistent naming conventions
2. **Error Handling**: Methods include proper error handling
3. **Type Safety**: Type hints in Python, PropTypes in React (where used)
4. **Separation of Concerns**: Methods are organized by responsibility
5. **Reusability**: Methods are designed to be reusable
6. **Documentation**: Methods include docstrings/comments

---

## 7. METHOD INVOCATION EXAMPLES BY CATEGORY

### Database Operations
```python
# Query
user = db.query(models.User).filter(models.User.user_id == user_id).first()

# Create
db.add(new_patient)
db.commit()

# Update
user.is_active = True
db.commit()

# Delete
db.delete(billing)
db.commit()
```

### Authentication
```python
# Hash password
hashed = hash_password(plain_password)

# Verify password
is_valid = verify_password(plain_password, hashed_password)

# Create token
token = create_access_token(data={"sub": str(user_id)})
```

### API Calls (Frontend)
```javascript
// POST request
const response = await api.post('/api/v1/patients/', patientData);

// GET request
const patients = await api.get('/api/v1/patients/');

// PUT request
await api.put(`/api/v1/patients/${patientId}`, updateData);
```

### React State Management
```javascript
// State setter
const [user, setUser] = useState(null);
setUser(newUser);

// Effect hook
useEffect(() => {
  fetchData();
}, [dependencies]);
```

---

This analysis demonstrates comprehensive use of method invocation patterns throughout the project, following object-oriented principles and modern best practices.

