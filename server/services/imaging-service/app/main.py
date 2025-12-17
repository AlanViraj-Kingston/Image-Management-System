from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import routes
from app.minio_client import ensure_bucket_exists

# Create database tables
Base.metadata.create_all(bind=engine)

# Ensure MinIO bucket exists
try:
    ensure_bucket_exists()
except Exception as e:
    print(f"Warning: Could not initialize MinIO bucket: {e}")

app = FastAPI(
    title="Imaging Service",
    description="""
    Service for managing medical images with MinIO storage.
    
    ## Features
    * Upload medical images (X-Ray, MRI, CT, Ultrasound)
    * Retrieve image metadata and URLs
    * Generate presigned URLs for secure access
    * Delete images
    * MinIO object storage integration
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(routes.router)

@app.get("/", tags=["Service Info"])
def home():
    return {
        "service": "Imaging Service",
        "status": "running",
        "version": "1.0.0",
        "docs": {
            "swagger_ui": "http://localhost:8002/docs",
            "redoc": "http://localhost:8002/redoc",
            "openapi_json": "http://localhost:8002/openapi.json"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

