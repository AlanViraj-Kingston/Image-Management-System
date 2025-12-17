"""
API Gateway - Central entry point for all services
Provides a simple HTML page with links to all service Swagger UIs
"""
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI(
    title="Medical Image Management System - API Gateway",
    description="Central gateway to access all microservices",
    version="1.0.0"
)

SERVICES = {
    "User & Patient Service": {
        "port": 8001,
        "description": "Manages Users, Patients, and Medical Staff",
        "endpoints": [
            "User registration and management",
            "Patient creation and information",
            "Medical staff management"
        ]
    },
    "Imaging Service": {
        "port": 8002,
        "description": "Manages medical images with MinIO storage",
        "endpoints": [
            "Image upload and retrieval",
            "Presigned URL generation",
            "Image management"
        ]
    },
    "Diagnosis & Workflow Service": {
        "port": 8003,
        "description": "Manages Diagnosis Reports and Workflow Logs",
        "endpoints": [
            "Diagnosis report generation",
            "Workflow logging",
            "Report confirmation"
        ]
    },
    "Financial Service": {
        "port": 8004,
        "description": "Manages Billing Details",
        "endpoints": [
            "Billing creation and management",
            "Cost calculation",
            "Payment tracking"
        ]
    }
}

@app.get("/", response_class=HTMLResponse)
def gateway_home():
    """Main gateway page with links to all services"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Medical Image Management System - API Gateway</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
            }
            .container {
                background: white;
                border-radius: 10px;
                padding: 30px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            }
            h1 {
                color: #333;
                text-align: center;
                margin-bottom: 10px;
            }
            .subtitle {
                text-align: center;
                color: #666;
                margin-bottom: 30px;
            }
            .services-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            .service-card {
                border: 2px solid #e0e0e0;
                border-radius: 8px;
                padding: 20px;
                transition: all 0.3s ease;
                background: #f9f9f9;
            }
            .service-card:hover {
                border-color: #667eea;
                box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
                transform: translateY(-5px);
            }
            .service-title {
                font-size: 1.3em;
                font-weight: bold;
                color: #667eea;
                margin-bottom: 10px;
            }
            .service-description {
                color: #666;
                margin-bottom: 15px;
                font-size: 0.9em;
            }
            .service-endpoints {
                list-style: none;
                padding: 0;
                margin: 10px 0;
            }
            .service-endpoints li {
                padding: 5px 0;
                color: #555;
                font-size: 0.85em;
            }
            .service-endpoints li:before {
                content: "✓ ";
                color: #667eea;
                font-weight: bold;
            }
            .links {
                margin-top: 15px;
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }
            .btn {
                padding: 10px 20px;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                transition: all 0.3s ease;
                display: inline-block;
                text-align: center;
            }
            .btn-primary {
                background: #667eea;
                color: white;
            }
            .btn-primary:hover {
                background: #5568d3;
                transform: scale(1.05);
            }
            .btn-secondary {
                background: #764ba2;
                color: white;
            }
            .btn-secondary:hover {
                background: #5d3a7e;
                transform: scale(1.05);
            }
            .health-status {
                display: inline-block;
                padding: 5px 10px;
                border-radius: 20px;
                font-size: 0.8em;
                margin-left: 10px;
            }
            .status-healthy {
                background: #4caf50;
                color: white;
            }
            .footer {
                text-align: center;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🏥 Medical Image Management System</h1>
            <p class="subtitle">API Gateway - Access all microservices documentation</p>
            
            <div class="services-grid">
    """
    
    for service_name, service_info in SERVICES.items():
        port = service_info["port"]
        description = service_info["description"]
        endpoints = service_info["endpoints"]
        
        html_content += f"""
                <div class="service-card">
                    <div class="service-title">{service_name}</div>
                    <div class="service-description">{description}</div>
                    <ul class="service-endpoints">
        """
        
        for endpoint in endpoints:
            html_content += f"<li>{endpoint}</li>"
        
        html_content += f"""
                    </ul>
                    <div class="links">
                        <a href="http://localhost:{port}/docs" target="_blank" class="btn btn-primary">Swagger UI</a>
                        <a href="http://localhost:{port}/redoc" target="_blank" class="btn btn-secondary">ReDoc</a>
                    </div>
                    <div style="margin-top: 10px;">
                        <small>Port: {port} | <a href="http://localhost:{port}/health" target="_blank">Health Check</a></small>
                    </div>
                </div>
        """
    
    html_content += """
            </div>
            
            <div class="footer">
                <p>All services are running on separate ports. Click on Swagger UI or ReDoc to access interactive API documentation.</p>
                <p><strong>Quick Links:</strong> 
                    <a href="http://localhost:8001/docs">User Service</a> | 
                    <a href="http://localhost:8002/docs">Imaging Service</a> | 
                    <a href="http://localhost:8003/docs">Diagnosis Service</a> | 
                    <a href="http://localhost:8004/docs">Financial Service</a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content

@app.get("/services")
def list_services():
    """JSON endpoint listing all services"""
    return {
        "services": {
            name: {
                "port": info["port"],
                "description": info["description"],
                "swagger_ui": f"http://localhost:{info['port']}/docs",
                "redoc": f"http://localhost:{info['port']}/redoc",
                "openapi_json": f"http://localhost:{info['port']}/openapi.json",
                "health": f"http://localhost:{info['port']}/health"
            }
            for name, info in SERVICES.items()
        }
    }

@app.get("/health")
def gateway_health():
    """Gateway health check"""
    return {
        "status": "healthy",
        "gateway": "API Gateway",
        "services_count": len(SERVICES)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


