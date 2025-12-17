# Quick Start Guide - Docker Services

## Prerequisites
- Docker Desktop installed and running
- Docker Compose installed (comes with Docker Desktop)

## Step 1: Create Environment File

Create a `.env` file in the `server` directory with the following content:

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

**On Windows PowerShell:**
```powershell
cd server
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

## Step 2: Navigate to Server Directory

```powershell
cd server
```

## Step 3: Start All Services

### Option A: Start in Background (Recommended)
```powershell
docker-compose up -d
```

### Option B: Start with Logs Visible
```powershell
docker-compose up
```
(Press `Ctrl+C` to stop, but services will continue running)

## Step 4: Verify Services are Running

Check if all containers are running:
```powershell
docker-compose ps
```

You should see all services with status "Up":
- ims-postgres
- ims-minio
- ims-api-gateway
- ims-user-patient-service
- ims-imaging-service
- ims-diagnosis-workflow-service
- ims-financial-service

## Step 5: Access the Services

### API Gateway (Main Entry Point)
- **URL**: http://localhost:8000
- Shows links to all service documentation

### Individual Services
- **User & Patient Service**: http://localhost:8001/docs
- **Imaging Service**: http://localhost:8002/docs
- **Diagnosis & Workflow Service**: http://localhost:8003/docs
- **Financial Service**: http://localhost:8004/docs

### MinIO Console (Object Storage)
- **URL**: http://localhost:9001
- **Username**: minioadmin
- **Password**: minioadmin

### Health Checks
Test if services are healthy:
```powershell
# User & Patient Service
curl http://localhost:8001/health

# Imaging Service
curl http://localhost:8002/health

# Diagnosis & Workflow Service
curl http://localhost:8003/health

# Financial Service
curl http://localhost:8004/health
```

## Useful Commands

### View Logs
```powershell
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f user-patient-service
```

### Stop Services
```powershell
# Stop all services
docker-compose down

# Stop and remove volumes (clean database)
docker-compose down -v
```

### Restart a Service
```powershell
docker-compose restart user-patient-service
```

### Rebuild After Code Changes
```powershell
# Rebuild specific service
docker-compose build user-patient-service
docker-compose up -d user-patient-service

# Rebuild all services
docker-compose build
docker-compose up -d
```

### Check Service Status
```powershell
docker-compose ps
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:
1. Check what's using the port: `netstat -ano | findstr "8001"`
2. Stop the conflicting service or change the port in `docker-compose.yml`

### Services Won't Start
1. Check Docker Desktop is running
2. Check logs: `docker-compose logs <service-name>`
3. Verify `.env` file exists and has correct values
4. Try rebuilding: `docker-compose build --no-cache`

### Database Connection Issues
1. Wait a few seconds for PostgreSQL to fully start
2. Check PostgreSQL logs: `docker-compose logs postgres`
3. Verify DATABASE_URL in `.env` uses `postgres` as hostname (not `localhost`)

### Clean Start (Remove Everything)
```powershell
# Stop and remove all containers, networks, and volumes
docker-compose down -v

# Remove all images (optional)
docker-compose down --rmi all

# Then start fresh
docker-compose up -d --build
```

## Next Steps

1. Open http://localhost:8000 in your browser to see the API Gateway
2. Click on any service's Swagger UI link to explore the API
3. Test the endpoints using the interactive documentation
4. Start developing your frontend/client application

# View all service logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart a specific service
docker-compose restart user-patient-service

# Check service status
docker-compose ps
