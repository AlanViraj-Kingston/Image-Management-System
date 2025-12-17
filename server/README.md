# HealthBridge

A service-oriented architecture (SOA) implementation for managing medical images, diagnoses, workflows, and billing in a healthcare system.

## Architecture Overview

This system is built using a microservices architecture with 4 main services:

1. **User & Patient Service** (Port 8001) - Manages Users, Patients, and Medical Staff
2. **Imaging Service** (Port 8002) - Manages Medical Images with MinIO storage
3. **Diagnosis & Workflow Service** (Port 8003) - Manages Diagnosis Reports and Workflow Logs
4. **Financial Service** (Port 8004) - Manages Billing Details

## Technology Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL
- **Object Storage**: MinIO
- **Containerization**: Docker & Docker Compose
- **ORM**: SQLAlchemy
- **Validation**: Pydantic

## Prerequisites

- Docker and Docker Compose installed
- Python 3.11+ (for local development)

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```env
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
```

### 2. Start Services with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- MinIO object storage (ports 9000, 9001)
- All 4 microservices (ports 8001-8004)

### 3. Access Services

- **API Gateway** (Central Hub): http://localhost:8000
- **User & Patient Service**: http://localhost:8001
- **Imaging Service**: http://localhost:8002
- **Diagnosis & Workflow Service**: http://localhost:8003
- **Financial Service**: http://localhost:8004
- **MinIO Console**: http://localhost:9001 (login with MINIO_ROOT_USER/MINIO_ROOT_PASSWORD)

### 4. API Documentation

**Quick Access via API Gateway:**
- **API Gateway Dashboard**: http://localhost:8000 (Beautiful HTML interface with links to all services)

**Individual Service Documentation:**
Each service provides interactive API documentation:
- **Swagger UI**: `http://localhost:<PORT>/docs`
- **ReDoc**: `http://localhost:<PORT>/redoc`
- **OpenAPI JSON**: `http://localhost:<PORT>/openapi.json`

**Direct Links:**
- User & Patient Service Swagger: http://localhost:8001/docs
- Imaging Service Swagger: http://localhost:8002/docs
- Diagnosis & Workflow Service Swagger: http://localhost:8003/docs
- Financial Service Swagger: http://localhost:8004/docs

## Project Structure

```
Image-Management-System/
├── docker-compose.yml          # Docker Compose configuration
├── .env.example                 # Environment variables template
├── .gitignore
├── README.md
└── services/
    ├── user-patient-service/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── __init__.py
    │       ├── main.py
    │       ├── database.py
    │       ├── models.py
    │       ├── schemas.py
    │       └── routes.py
    ├── imaging-service/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── __init__.py
    │       ├── main.py
    │       ├── database.py
    │       ├── models.py
    │       ├── schemas.py
    │       ├── routes.py
    │       └── minio_client.py
    ├── diagnosis-workflow-service/
    │   ├── Dockerfile
    │   ├── requirements.txt
    │   └── app/
    │       ├── __init__.py
    │       ├── main.py
    │       ├── database.py
    │       ├── models.py
    │       ├── schemas.py
    │       └── routes.py
    └── financial-service/
        ├── Dockerfile
        ├── requirements.txt
        └── app/
            ├── __init__.py
            ├── main.py
            ├── database.py
            ├── models.py
            ├── schemas.py
            └── routes.py
```

## API Endpoints Overview

### User & Patient Service (8001)

- `POST /api/v1/users/register` - Register a new user
- `GET /api/v1/users/{user_id}` - Get user information
- `GET /api/v1/users` - Get all users
- `PUT /api/v1/users/{user_id}/activate` - Activate user
- `PUT /api/v1/users/{user_id}/deactivate` - Deactivate user
- `POST /api/v1/patients/` - Create a patient
- `GET /api/v1/patients/{patient_id}` - Get patient information
- `POST /api/v1/staff/` - Create medical staff
- `GET /api/v1/staff/{staff_id}` - Get staff information

### Imaging Service (8002)

- `POST /api/v1/images/upload` - Upload a medical image
- `GET /api/v1/images/{image_id}` - Get image information
- `GET /api/v1/images/patient/{patient_id}` - Get all patient images
- `GET /api/v1/images/{image_id}/url` - Get presigned URL for image
- `DELETE /api/v1/images/{image_id}` - Delete an image

### Diagnosis & Workflow Service (8003)

- `POST /api/v1/reports/` - Generate a diagnosis report
- `GET /api/v1/reports/{report_id}` - Get a report
- `GET /api/v1/reports/patient/{patient_id}` - Get patient reports
- `PUT /api/v1/reports/{report_id}/confirm` - Confirm/finalize report
- `POST /api/v1/logs/` - Add workflow log
- `GET /api/v1/logs/` - Get workflow logs
- `GET /api/v1/logs/user/{user_id}` - Get user logs

### Financial Service (8004)

- `POST /api/v1/billing/` - Add billing details
- `GET /api/v1/billing/` - Get all billings
- `GET /api/v1/billing/patient/{patient_id}` - Get patient billings
- `GET /api/v1/billing/patient/{patient_id}/total` - Calculate total cost
- `PUT /api/v1/billing/{billing_id}/pay` - Mark billing as paid

## Database Schema

The system uses a shared PostgreSQL database with the following main tables:

- `users` - Base user table (polymorphic)
- `patients` - Patient-specific information
- `medical_staff` - Staff-specific information
- `medical_images` - Medical image metadata
- `diagnosis_reports` - Diagnosis reports
- `workflow_logs` - System workflow logs
- `billing_details` - Billing information

## Development

### Running Services Locally

1. Start PostgreSQL and MinIO:
```bash
docker-compose up postgres minio -d
```

2. Run each service locally:
```bash
cd services/user-patient-service
pip install -r requirements.txt
uvicorn app.main:app --port 8001 --reload
```

### Database Migrations

Tables are automatically created on service startup using SQLAlchemy's `create_all()`. For production, consider using Alembic for migrations.

## MinIO Setup

MinIO is used for storing medical images. The bucket is automatically created when the imaging service starts.

- **Access Key**: Set in `.env` as `MINIO_ROOT_USER`
- **Secret Key**: Set in `.env` as `MINIO_ROOT_PASSWORD`
- **Console**: http://localhost:9001

## Health Checks

Each service provides a health check endpoint:
- `GET /health` - Returns service health status

## Notes

- All services share the same PostgreSQL database
- Services communicate via REST APIs
- MinIO is used for object storage (S3-compatible)
- All services use environment variables from the root `.env` file

## License

This project is for educational purposes.
