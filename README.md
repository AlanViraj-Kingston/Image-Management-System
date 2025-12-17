# Medical Image Management System

A comprehensive healthcare management system built with a microservices architecture for managing medical images, patient records, diagnoses, workflows, and billing. This system demonstrates Service-Oriented Architecture (SOA) principles with a modern React frontend and FastAPI backend services.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Services](#services)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The Medical Image Management System is designed for hospitals and healthcare facilities to:
- Manage patient and medical staff registrations
- Upload and store medical images (X-Ray, MRI, CT, Ultrasound)
- Generate and manage diagnosis reports
- Track workflow activities and system logs
- Handle billing and payment tracking

The system follows a microservices architecture pattern, with each service handling a specific domain of functionality.

## 🏗️ Architecture

The system is built using a **Service-Oriented Architecture (SOA)** with the following components:

```
┌─────────────────┐
│   React Client  │  (Port 3000)
│   (Frontend)    │
└────────┬────────┘
         │
         │ HTTP/REST
         │
┌────────▼─────────────────────────────────────┐
│         API Gateway (Port 8000)                │
└────────┬──────────────────────────────────────┘
         │
    ┌────┴────┬──────────────┬──────────────┐
    │         │              │              │
┌───▼───┐ ┌──▼───┐ ┌────────▼──┐ ┌────────▼──┐
│ User  │ │Image │ │ Diagnosis │ │ Financial │
│Service│ │Service│ │  Service  │ │  Service  │
│ 8001  │ │ 8002 │ │   8003    │ │   8004    │
└───┬───┘ └──┬───┘ └─────┬─────┘ └─────┬─────┘
    │        │           │             │
    └────────┴───────────┴─────────────┘
              │
    ┌─────────┴──────────┐
    │                    │
┌───▼────┐        ┌─────▼─────┐
│PostgreSQL│      │   MinIO   │
│Database │      │  Storage   │
└─────────┘      └────────────┘
```

## 💻 Technology Stack

### Backend
- **FastAPI** - Modern Python web framework for building APIs
- **SQLAlchemy** - Python ORM for database operations
- **PostgreSQL** - Relational database management system
- **MinIO** - S3-compatible object storage for medical images
- **Uvicorn** - ASGI server for running FastAPI applications
- **Pydantic** - Data validation using Python type annotations
- **Python-JOSE** - JWT token generation and validation
- **Passlib & Bcrypt** - Password hashing and security
- **Docker & Docker Compose** - Containerization and orchestration

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client for API requests

## 🔧 Services

### 1. User & Patient Service (Port 8001)
Manages user authentication, patient registration, and medical staff management.

**Key Features:**
- User authentication with JWT tokens
- Patient registration and profile management
- Medical staff registration and management
- User activation/deactivation
- Password hashing with bcrypt

**Main Endpoints:**
- `POST /api/v1/users/login` - User login
- `GET /api/v1/users/me` - Get current user info
- `POST /api/v1/patients/` - Register new patient
- `POST /api/v1/staff/` - Register medical staff
- `GET /api/v1/patients/{id}` - Get patient information
- `GET /api/v1/staff/{id}` - Get staff information

### 2. Imaging Service (Port 8002)
Handles medical image uploads, storage, and retrieval using MinIO.

**Key Features:**
- Upload medical images (X-Ray, MRI, CT, Ultrasound)
- Store images in MinIO object storage
- Generate presigned URLs for secure image access
- Retrieve image metadata
- Delete images

**Main Endpoints:**
- `POST /api/v1/images/upload` - Upload medical image
- `GET /api/v1/images/{id}` - Get image information
- `GET /api/v1/images/patient/{patient_id}` - Get all patient images
- `GET /api/v1/images/{id}/url` - Get presigned URL
- `DELETE /api/v1/images/{id}` - Delete image

### 3. Diagnosis & Workflow Service (Port 8003)
Manages diagnosis reports and workflow logging.

**Key Features:**
- Generate diagnosis reports
- Confirm/finalize reports
- Track workflow activities
- View reports by patient or staff
- Comprehensive logging system

**Main Endpoints:**
- `POST /api/v1/reports/` - Generate diagnosis report
- `GET /api/v1/reports/{id}` - Get report
- `GET /api/v1/reports/patient/{patient_id}` - Get patient reports
- `PUT /api/v1/reports/{id}/confirm` - Confirm report
- `POST /api/v1/logs/` - Add workflow log
- `GET /api/v1/logs/` - Get workflow logs

### 4. Financial Service (Port 8004)
Handles billing details and payment tracking.

**Key Features:**
- Create and manage billing records
- Track billing status (pending, paid, overdue)
- Calculate total costs per patient
- Link billing to diagnosis reports
- Payment tracking

**Main Endpoints:**
- `POST /api/v1/billing/` - Create billing record
- `GET /api/v1/billing/` - Get all billings
- `GET /api/v1/billing/patient/{patient_id}` - Get patient billings
- `GET /api/v1/billing/patient/{patient_id}/total` - Calculate total cost
- `PUT /api/v1/billing/{id}/pay` - Mark as paid

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker Desktop** (for running services in containers)
- **Docker Compose** (comes with Docker Desktop)
- **Node.js** (v16 or higher) - for running the React client
- **npm** or **yarn** - package manager for Node.js
- **Python 3.11+** (optional, for local development without Docker)

## 🚀 Quick Start

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd Image-Management-System
```

### Step 2: Set Up Backend Services

1. Navigate to the server directory:
```bash
cd server
```

2. Create a `.env` file:
```bash
# On Linux/Mac
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/medical_db

# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=medical_db

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET_NAME=medical-images
EOF
```

```powershell
# On Windows PowerShell
@"
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/medical_db

# PostgreSQL Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=medical_db

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET_NAME=medical-images
"@ | Out-File -FilePath .env -Encoding utf8
```

3. Start all backend services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- MinIO object storage (ports 9000, 9001)
- API Gateway (port 8000)
- All 4 microservices (ports 8001-8004)

### Step 3: Set Up Frontend Client

1. Navigate to the client directory:
```bash
cd ../client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults to localhost:8001):
```bash
VITE_API_BASE_URL=http://localhost:8001
```

4. Start the development server:
```bash
npm run dev
```

The React application will be available at `http://localhost:3000`

## 🏃 Running the Application

### Backend Services

#### Start All Services
```bash
cd server
docker-compose up -d
```

#### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-patient-service
```

#### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

#### Restart a Service
```bash
docker-compose restart user-patient-service
```

#### Rebuild After Code Changes
```bash
# Rebuild specific service
docker-compose build user-patient-service
docker-compose up -d user-patient-service

# Rebuild all services
docker-compose build
docker-compose up -d
```

#### Check Service Status
```bash
docker-compose ps
```

### Frontend Client

#### Development Mode
```bash
cd client
npm run dev
```
Access at: `http://localhost:3000`

#### Production Build
```bash
npm run build
```
Output will be in the `dist` directory.

#### Preview Production Build
```bash
npm run preview
```

#### Run Linter
```bash
npm run lint
```

## 📚 API Documentation

### API Gateway (Central Hub)
- **URL**: http://localhost:8000
- Beautiful HTML interface with links to all service documentation

### Individual Service Documentation

Each service provides interactive API documentation:

#### Swagger UI
- User & Patient Service: http://localhost:8001/docs
- Imaging Service: http://localhost:8002/docs
- Diagnosis & Workflow Service: http://localhost:8003/docs
- Financial Service: http://localhost:8004/docs

#### ReDoc
- User & Patient Service: http://localhost:8001/redoc
- Imaging Service: http://localhost:8002/redoc
- Diagnosis & Workflow Service: http://localhost:8003/redoc
- Financial Service: http://localhost:8004/redoc

#### OpenAPI JSON
- Available at: `http://localhost:<PORT>/openapi.json`

### Health Checks

Test service health:
```bash
curl http://localhost:8001/health  # User & Patient Service
curl http://localhost:8002/health  # Imaging Service
curl http://localhost:8003/health  # Diagnosis Service
curl http://localhost:8004/health  # Financial Service
```

### MinIO Console

- **URL**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin

## 📁 Project Structure

```
Image-Management-System/
├── client/                          # React frontend application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── PatientRegistrationForm.jsx
│   │   │   ├── StaffRegistrationForm.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/                 # React context providers
│   │   │   └── AuthContext.jsx
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   └── RegisterPage.jsx
│   │   ├── services/                # API services
│   │   │   ├── api.js
│   │   │   └── authService.js
│   │   ├── App.jsx                  # Main app component
│   │   ├── main.jsx                 # Entry point
│   │   └── index.css                # Global styles
│   ├── public/                      # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Backend services
│   ├── docker-compose.yml           # Docker Compose configuration
│   ├── Dockerfile.gateway           # API Gateway Dockerfile
│   ├── api-gateway.py               # API Gateway service
│   ├── requirements.txt             # Common Python dependencies
│   ├── .env                         # Environment variables (create this)
│   │
│   └── services/
│       ├── user-patient-service/    # User & Patient Service
│       │   ├── Dockerfile
│       │   ├── requirements.txt
│       │   └── app/
│       │       ├── main.py          # FastAPI app
│       │       ├── routes.py       # API routes
│       │       ├── models.py        # SQLAlchemy models
│       │       ├── schemas.py       # Pydantic schemas
│       │       ├── database.py      # Database configuration
│       │       └── auth.py         # Authentication utilities
│       │
│       ├── imaging-service/        # Imaging Service
│       │   ├── Dockerfile
│       │   ├── requirements.txt
│       │   └── app/
│       │       ├── main.py
│       │       ├── routes.py
│       │       ├── models.py
│       │       ├── schemas.py
│       │       ├── database.py
│       │       └── minio_client.py  # MinIO integration
│       │
│       ├── diagnosis-workflow-service/  # Diagnosis Service
│       │   ├── Dockerfile
│       │   ├── requirements.txt
│       │   └── app/
│       │       ├── main.py
│       │       ├── routes.py
│       │       ├── models.py
│       │       ├── schemas.py
│       │       └── database.py
│       │
│       └── financial-service/        # Financial Service
│           ├── Dockerfile
│           ├── requirements.txt
│           └── app/
│               ├── main.py
│               ├── routes.py
│               ├── models.py
│               ├── schemas.py
│               └── database.py
│
└── README.md                        # This file
```

## 🛠️ Development

### Running Services Locally (Without Docker)

1. Start PostgreSQL and MinIO:
```bash
cd server
docker-compose up postgres minio -d
```

2. Install Python dependencies:
```bash
cd services/user-patient-service
pip install -r requirements.txt
```

3. Run service locally:
```bash
uvicorn app.main:app --port 8001 --reload
```

### Database Migrations

Tables are automatically created on service startup using SQLAlchemy's `create_all()`. For production, consider using Alembic for migrations.

### Environment Variables

#### Backend (.env in server directory)
```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/medical_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=medical_db
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_ENDPOINT=minio:9000
MINIO_BUCKET_NAME=medical-images
```

#### Frontend (.env in client directory)
```env
VITE_API_BASE_URL=http://localhost:8001
```

### CORS Configuration

The User & Patient Service has CORS middleware configured to allow requests from the React development server (`http://localhost:3000`). If you need to add CORS to other services, add the following to their `main.py`:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🐛 Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Windows:**
```powershell
netstat -ano | findstr "8001"
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
lsof -ti:8001 | xargs kill -9
```

### Services Won't Start

1. Check Docker Desktop is running
2. Check logs: `docker-compose logs <service-name>`
3. Verify `.env` file exists and has correct values
4. Try rebuilding: `docker-compose build --no-cache`

### Database Connection Issues

1. Wait a few seconds for PostgreSQL to fully start
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify `DATABASE_URL` in `.env` uses `postgres` as hostname (not `localhost`)

### CORS Errors

If you see CORS errors in the browser:
1. Ensure the backend service has CORS middleware configured
2. Check that the frontend is making requests to the correct URL
3. Verify the `allow_origins` includes your frontend URL

### Clean Start (Remove Everything)

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Then start fresh
docker-compose up -d --build
```

### Frontend Build Issues

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
```

## 📝 Notes

- All services share the same PostgreSQL database
- Services communicate via REST APIs
- MinIO is used for object storage (S3-compatible)
- JWT tokens are used for authentication
- Passwords are hashed using bcrypt
- All services use environment variables from the root `.env` file
- The API Gateway provides a central entry point for service discovery

## 📄 License

This project is for educational purposes as part of a Software Architectures course assignment.

## 🤝 Contributing

This is an academic project. For questions or issues, please refer to the course instructor or teaching assistants.

---

**Happy Coding! 🚀**

