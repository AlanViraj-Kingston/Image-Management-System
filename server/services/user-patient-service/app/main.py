from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app import routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="User & Patient Service",
    description="""
    Service for managing Users, Patients, and Medical Staff.
    
    ## Features
    * User registration and management
    * Patient creation and information management
    * Medical staff management
    * User activation/deactivation
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods including OPTIONS
    allow_headers=["*"],  # Allow all headers
)

# Include routers
app.include_router(routes.router)

@app.get("/", tags=["Service Info"])
def home():
    return {
        "service": "User & Patient Service",
        "status": "running",
        "version": "1.0.0",
        "docs": {
            "swagger_ui": "http://localhost:8001/docs",
            "redoc": "http://localhost:8001/redoc",
            "openapi_json": "http://localhost:8001/openapi.json"
        }
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

