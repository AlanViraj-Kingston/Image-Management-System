from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.file_storage import save_file, get_file_url, delete_file as delete_storage_file, get_file_path, file_exists
from typing import List
from datetime import datetime
import os
import mimetypes

router = APIRouter(prefix="/api/v1", tags=["Imaging Service"])

@router.post(
    "/images/upload",
    response_model=schemas.ImageUploadResponse,
    summary="Upload a medical image",
    description="Upload a medical image file (X-Ray, MRI, CT, Ultrasound, etc.) to local storage and save metadata to database"
)
async def add_image(
    request: Request,
    patient_id: int = Form(..., description="ID of the patient this image belongs to"),
    image_type: models.ImageType = Form(..., description="Type of medical image (xray, mri, ct, ultrasound, other)"),
    uploaded_by: int = Form(..., description="Staff ID of the person uploading the image"),
    file: UploadFile = File(..., description="Medical image file to upload"),
    db: Session = Depends(get_db)
):
    """
    Upload a new medical image.
    
    - **patient_id**: The ID of the patient this image belongs to
    - **image_type**: Type of medical image (xray, mri, ct, ultrasound, other)
    - **uploaded_by**: Staff ID of the person uploading the image
    - **file**: The image file to upload
    
    Returns image metadata including URL for immediate access.
    """
    try:
        # Read file data
        file_data = await file.read()
        file_size = len(file_data)
        
        # Generate unique filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        # Sanitize filename
        safe_filename = "".join(c for c in file.filename if c.isalnum() or c in "._-")
        unique_filename = f"{timestamp}_{safe_filename}"
        
        # Create file path structure
        file_path = f"patient_{patient_id}/{image_type.value}/"
        
        # Save file to local storage
        relative_path = save_file(file_data, file_path, unique_filename)
        
        # Save to database (store relative path)
        new_image = models.ImageMedical(
            patient_id=patient_id,
            image_type=image_type,
            uploaded_by=uploaded_by,
            img_url=relative_path,  # Store relative path in database
            file_name=file.filename,
            file_size=file_size,
            uploaded_at=datetime.now().isoformat()
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        
        # Generate full URL for response
        # Use request base URL if available, otherwise use default
        if request:
            base_url = str(request.base_url).rstrip('/')
        else:
            base_url = None
        img_url = get_file_url(relative_path, base_host=base_url)
        
        return schemas.ImageUploadResponse(
            image_id=new_image.image_id,
            img_url=img_url,
            presigned_url=img_url,  # For compatibility, use same URL
            message="Image uploaded successfully"
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error uploading image: {str(e)}")

@router.get(
    "/images/{image_id}",
    response_model=schemas.ImageMedicalResponse,
    summary="Get image by ID",
    description="Retrieve image metadata by image ID"
)
def get_image(image_id: int, db: Session = Depends(get_db)):
    """Get image information by ID"""
    image = db.query(models.ImageMedical).filter(models.ImageMedical.image_id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    return image

@router.get(
    "/images/patient/{patient_id}",
    response_model=List[schemas.ImageMedicalResponse],
    summary="Get all patient images",
    description="Retrieve all medical images for a specific patient"
)
def get_patient_images(patient_id: int, db: Session = Depends(get_db)):
    """Get all images for a specific patient"""
    images = db.query(models.ImageMedical).filter(
        models.ImageMedical.patient_id == patient_id
    ).all()
    return images

@router.get(
    "/images/{image_id}/url",
    summary="Get image URL",
    description="Get URL for accessing an image"
)
def get_image_url(
    image_id: int,
    request: Request,
    expires_in: int = 3600,  # Kept for API compatibility, but not used for local storage
    db: Session = Depends(get_db)
):
    """
    Get a URL for accessing an image.
    
    - **image_id**: ID of the image
    - **expires_in**: Not used for local storage (kept for API compatibility)
    """
    image = db.query(models.ImageMedical).filter(models.ImageMedical.image_id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # Get the base URL from the request
        base_url = str(request.base_url).rstrip('/')
        # img_url stores the relative path
        file_url = get_file_url(image.img_url, base_host=base_url)
        return {
            "image_id": image_id,
            "presigned_url": file_url,
            "expires_in": expires_in
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating URL: {str(e)}")

@router.get(
    "/images/file/{file_path:path}",
    summary="Serve image file",
    description="Serve an image file from local storage"
)
def serve_image_file(file_path: str):
    """Serve an image file"""
    try:
        full_path = get_file_path(file_path)
        if not full_path.exists():
            raise HTTPException(status_code=404, detail="File not found")
        
        # Detect MIME type
        media_type, _ = mimetypes.guess_type(str(full_path))
        if not media_type:
            media_type = "image/jpeg"  # Default fallback
        
        return FileResponse(
            full_path,
            media_type=media_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error serving file: {str(e)}")

@router.delete(
    "/images/{image_id}",
    summary="Delete an image",
    description="Delete a medical image from both local storage and database"
)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image from storage and database"""
    image = db.query(models.ImageMedical).filter(models.ImageMedical.image_id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # img_url stores the relative path
        delete_storage_file(image.img_url)
        
        # Delete from database
        db.delete(image)
        db.commit()
        
        return {"message": "Image deleted successfully", "image_id": image_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting image: {str(e)}")

@router.get(
    "/images/",
    response_model=List[schemas.ImageMedicalResponse],
    summary="Get all images",
    description="Retrieve all medical images in the system"
)
def get_all_images(db: Session = Depends(get_db)):
    """Get all medical images"""
    return db.query(models.ImageMedical).all()

