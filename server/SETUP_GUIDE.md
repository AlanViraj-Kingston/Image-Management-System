# Step-by-Step Setup Guide

## Step 1: Create Environment File

Create a `.env` file in the project root directory with the following content:

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

**Note**: When running in Docker, use `postgres` as the hostname. For local development, use `localhost`.

## Step 2: Build and Start Services

### Option A: Start All Services with Docker Compose (Recommended)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
docker-compose down -v
```

### Option B: Start Services Individually

```bash
# Start infrastructure first
docker-compose up postgres minio -d

# Then start each service
docker-compose up user-patient-service -d
docker-compose up imaging-service -d
docker-compose up diagnosis-workflow-service -d
docker-compose up financial-service -d
```

## Step 3: Verify Services are Running

Check service health:

```bash
# User & Patient Service
curl http://localhost:8001/health

# Imaging Service
curl http://localhost:8002/health

# Diagnosis & Workflow Service
curl http://localhost:8003/health

# Financial Service
curl http://localhost:8004/health
```

## Step 4: Access Service Documentation

Each service provides interactive API documentation:

- **User & Patient Service**: http://localhost:8001/docs
- **Imaging Service**: http://localhost:8002/docs
- **Diagnosis & Workflow Service**: http://localhost:8003/docs
- **Financial Service**: http://localhost:8004/docs

## Step 5: Test the System

### 1. Create a Patient

```bash
curl -X POST "http://localhost:8001/api/v1/patients/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "phone": "123-456-7890",
    "address": "123 Main St",
    "date_of_birth": "1990-01-01",
    "conditions": "None"
  }'
```

### 2. Create Medical Staff

```bash
curl -X POST "http://localhost:8001/api/v1/staff/" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Jane Smith",
    "phone": "123-456-7891",
    "address": "456 Oak Ave",
    "department": "Radiology",
    "role": "doctor"
  }'
```

### 3. Upload a Medical Image

```bash
curl -X POST "http://localhost:8002/api/v1/images/upload?patient_id=1&image_type=xray&uploaded_by=1" \
  -F "file=@/path/to/image.jpg"
```

### 4. Create a Diagnosis Report

```bash
curl -X POST "http://localhost:8003/api/v1/reports/" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "staff_id": 1,
    "image_id": 1,
    "findings": "Normal chest X-ray",
    "diagnosis": "No abnormalities detected",
    "status": "finalized"
  }'
```

### 5. Create Billing Details

```bash
curl -X POST "http://localhost:8004/api/v1/billing/" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "procedure": "Chest X-Ray",
    "base_cost": 150.00,
    "status": "pending",
    "report_id": 1
  }'
```

## Troubleshooting

### Database Connection Issues

If services can't connect to PostgreSQL:

1. Check if PostgreSQL is running:
```bash
docker-compose ps postgres
```

2. Verify DATABASE_URL in `.env` file
3. Check PostgreSQL logs:
```bash
docker-compose logs postgres
```

### MinIO Connection Issues

If imaging service can't connect to MinIO:

1. Check if MinIO is running:
```bash
docker-compose ps minio
```

2. Access MinIO console at http://localhost:9001
3. Verify MINIO_ENDPOINT in `.env` file (use `minio:9000` for Docker, `localhost:9000` for local)

### Service Won't Start

1. Check service logs:
```bash
docker-compose logs <service-name>
```

2. Verify all environment variables are set
3. Ensure ports are not already in use:
```bash
netstat -an | findstr "8001 8002 8003 8004"
```

### Database Tables Not Created

Tables are created automatically on first service startup. If tables don't exist:

1. Restart the service:
```bash
docker-compose restart <service-name>
```

2. Check database connection in service logs

## Development Workflow

### Making Changes

1. Edit service code in `services/<service-name>/app/`
2. Rebuild the service:
```bash
docker-compose build <service-name>
docker-compose up -d <service-name>
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f <service-name>
```

### Database Access

Connect to PostgreSQL:

```bash
docker-compose exec postgres psql -U postgres -d medical_db
```

### MinIO Console

Access MinIO web console:
- URL: http://localhost:9001
- Username: minioadmin (or MINIO_ROOT_USER from .env)
- Password: minioadmin (or MINIO_ROOT_PASSWORD from .env)

## Next Steps

1. Review API documentation at `/docs` endpoints
2. Test all endpoints using the interactive Swagger UI
3. Implement authentication/authorization (if needed)
4. Add service-to-service communication (if needed)
5. Set up monitoring and logging
6. Configure production environment variables


