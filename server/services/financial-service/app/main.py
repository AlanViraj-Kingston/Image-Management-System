from fastapi import FastAPI
from app.database import engine, Base
from app import routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Financial Service",
    description="""
    Service for managing Billing Details.
    
    ## Features
    * Create and manage billing records
    * Track billing status (pending, paid, overdue)
    * Calculate total costs per patient
    * Link billing to diagnosis reports
    * Payment tracking
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
        "service": "Financial Service",
        "status": "running",
        "version": "1.0.0",
        "docs": {
            "swagger_ui": "http://localhost:8004/docs",
            "redoc": "http://localhost:8004/redoc",
            "openapi_json": "http://localhost:8004/openapi.json"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

