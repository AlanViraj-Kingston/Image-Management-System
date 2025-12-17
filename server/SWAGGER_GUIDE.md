# Swagger API Documentation Guide

This guide explains how to access and use the Swagger/OpenAPI documentation for all services in the Medical Image Management System.

## Quick Access

### 🚀 API Gateway (Recommended Entry Point)

**URL**: http://localhost:8000

The API Gateway provides a beautiful HTML dashboard with direct links to all service documentation. This is the easiest way to access all Swagger UIs.

### Individual Service Swagger UIs

| Service | Port | Swagger UI | ReDoc | OpenAPI JSON |
|---------|------|------------|-------|--------------|
| **API Gateway** | 8000 | http://localhost:8000 | - | http://localhost:8000/services |
| **User & Patient Service** | 8001 | http://localhost:8001/docs | http://localhost:8001/redoc | http://localhost:8001/openapi.json |
| **Imaging Service** | 8002 | http://localhost:8002/docs | http://localhost:8002/redoc | http://localhost:8002/openapi.json |
| **Diagnosis & Workflow Service** | 8003 | http://localhost:8003/docs | http://localhost:8003/redoc | http://localhost:8003/openapi.json |
| **Financial Service** | 8004 | http://localhost:8004/docs | http://localhost:8004/redoc | http://localhost:8004/openapi.json |

## Using Swagger UI

### 1. Accessing Swagger UI

1. Start all services: `docker-compose up -d`
2. Navigate to any service's Swagger UI (e.g., http://localhost:8001/docs)
3. You'll see all available endpoints organized by tags

### 2. Testing Endpoints

#### Example: Creating a Patient

1. Go to http://localhost:8001/docs
2. Find the `POST /api/v1/patients/` endpoint
3. Click "Try it out"
4. Fill in the request body:
```json
{
  "name": "John Doe",
  "phone": "123-456-7890",
  "address": "123 Main St",
  "date_of_birth": "1990-01-01",
  "conditions": "None"
}
```
5. Click "Execute"
6. View the response

#### Example: Uploading an Image

1. Go to http://localhost:8002/docs
2. Find the `POST /api/v1/images/upload` endpoint
3. Click "Try it out"
4. Fill in the form fields:
   - `patient_id`: 1
   - `image_type`: xray
   - `uploaded_by`: 1
   - `file`: Click "Choose File" and select an image
5. Click "Execute"
6. View the response with image URL

### 3. Understanding Swagger UI Features

#### Endpoint Information
- **Summary**: Brief description of what the endpoint does
- **Description**: Detailed explanation
- **Parameters**: Required and optional parameters
- **Request Body**: Expected JSON structure
- **Responses**: Possible response codes and structures

#### Interactive Testing
- **Try it out**: Enables interactive testing
- **Execute**: Sends the request
- **Responses**: Shows actual API responses
- **cURL**: Provides cURL command for the request

#### Schema Documentation
- Click on any model/schema to see its structure
- View required vs optional fields
- See data types and constraints

## Service-Specific Endpoints

### User & Patient Service (8001)

**Key Endpoints:**
- `POST /api/v1/users/register` - Register a new user
- `POST /api/v1/patients/` - Create a patient
- `POST /api/v1/staff/` - Create medical staff
- `GET /api/v1/users/{user_id}` - Get user information
- `GET /api/v1/patients/{patient_id}` - Get patient information

**Tags:**
- User & Patient Service

### Imaging Service (8002)

**Key Endpoints:**
- `POST /api/v1/images/upload` - Upload medical image (with file upload)
- `GET /api/v1/images/{image_id}` - Get image metadata
- `GET /api/v1/images/patient/{patient_id}` - Get all patient images
- `GET /api/v1/images/{image_id}/url` - Get presigned URL

**Tags:**
- Imaging Service

**Note**: File uploads work directly in Swagger UI - just click "Choose File" button.

### Diagnosis & Workflow Service (8003)

**Key Endpoints:**
- `POST /api/v1/reports/` - Generate diagnosis report
- `GET /api/v1/reports/{report_id}` - Get report
- `PUT /api/v1/reports/{report_id}/confirm` - Confirm report
- `POST /api/v1/logs/` - Add workflow log
- `GET /api/v1/logs/` - Get workflow logs

**Tags:**
- Diagnosis & Workflow Service

### Financial Service (8004)

**Key Endpoints:**
- `POST /api/v1/billing/` - Add billing details
- `GET /api/v1/billing/patient/{patient_id}` - Get patient billings
- `GET /api/v1/billing/patient/{patient_id}/total` - Calculate total cost
- `PUT /api/v1/billing/{billing_id}/pay` - Mark as paid

**Tags:**
- Financial Service

## OpenAPI Specification

Each service exposes its OpenAPI specification at `/openapi.json`. This can be:
- Imported into Postman
- Used with code generators
- Integrated with API testing tools
- Used for API documentation generation

### Example: Download OpenAPI Spec

```bash
# User & Patient Service
curl http://localhost:8001/openapi.json > user-service-openapi.json

# Imaging Service
curl http://localhost:8002/openapi.json > imaging-service-openapi.json
```

## ReDoc Alternative

ReDoc provides an alternative documentation view:
- More readable for documentation purposes
- Better for printing/sharing
- Cleaner interface for browsing

Access at: `http://localhost:<PORT>/redoc`

## Tips for Using Swagger

1. **Start with API Gateway**: Use http://localhost:8000 for easy navigation
2. **Use Tags**: Endpoints are organized by tags for easy navigation
3. **Check Schemas**: Click on response models to understand data structures
4. **Copy cURL**: Use the "Copy cURL" feature to get command-line examples
5. **Test Workflows**: Test complete workflows (create patient → upload image → create report → add billing)
6. **Error Handling**: Check error responses to understand validation requirements

## Troubleshooting

### Swagger UI Not Loading

1. Check if service is running: `docker-compose ps`
2. Check service logs: `docker-compose logs <service-name>`
3. Verify port is accessible: `curl http://localhost:<PORT>/health`

### File Upload Not Working

1. Ensure you're using the correct endpoint (POST with multipart/form-data)
2. Check file size limits
3. Verify MinIO is running and accessible

### CORS Issues

If accessing from a different origin, you may need to configure CORS in the FastAPI apps.

## Advanced Usage

### Importing into Postman

1. Get OpenAPI JSON: `http://localhost:<PORT>/openapi.json`
2. In Postman: Import → Link → Paste URL
3. All endpoints will be imported as a collection

### Code Generation

Use OpenAPI generators to create client SDKs:
- Swagger Codegen
- OpenAPI Generator
- Various language-specific tools

Example:
```bash
npx @openapitools/openapi-generator-cli generate \
  -i http://localhost:8001/openapi.json \
  -g python \
  -o ./client-sdk
```

## Summary

- **API Gateway**: http://localhost:8000 (Best starting point)
- **All Swagger UIs**: Available at `/docs` on each service port
- **All ReDoc**: Available at `/redoc` on each service port
- **OpenAPI Specs**: Available at `/openapi.json` on each service port

Happy API testing! 🚀


