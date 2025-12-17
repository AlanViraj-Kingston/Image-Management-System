from fastapi import FastAPI
from app.database import engine, Base
from app import routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Diagnosis & Workflow Service",
    description="""
    Service for managing Diagnosis Reports and Workflow Logs.
    
    ## Features
    * Generate and manage diagnosis reports
    * Confirm/finalize reports
    * Track workflow activities
    * View reports by patient or staff
    * Comprehensive logging system
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Include routers
app.include_router(routes.router)

@app.get("/", tags=["Service Info"])
def home():
    return {
        "service": "Diagnosis & Workflow Service",
        "status": "running",
        "version": "1.0.0",
        "docs": {
            "swagger_ui": "http://localhost:8003/docs",
            "redoc": "http://localhost:8003/redoc",
            "openapi_json": "http://localhost:8003/openapi.json"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

