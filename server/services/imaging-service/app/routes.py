from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.minio_client import upload_file, get_file_url, delete_file
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/v1", tags=["Imaging Service"])

@router.post(
    "/images/upload",
    response_model=schemas.ImageUploadResponse,
    summary="Upload a medical image",
    description="Upload a medical image file (X-Ray, MRI, CT, Ultrasound, etc.) to MinIO storage and save metadata to database"
)
async def add_image(
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
    
    Returns image metadata including presigned URL for immediate access.
    """
    try:
        # Read file data
        file_data = await file.read()
        file_size = len(file_data)
        
        # Generate unique object name
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        object_name = f"patient_{patient_id}/{image_type.value}/{timestamp}_{file.filename}"
        
        # Upload to MinIO
        img_url = upload_file(
            file_data,
            object_name,
            content_type=file.content_type or "application/octet-stream"
        )
        
        # Save to database
        new_image = models.ImageMedical(
            patient_id=patient_id,
            image_type=image_type,
            uploaded_by=uploaded_by,
            img_url=img_url,
            file_name=file.filename,
            file_size=file_size,
            uploaded_at=datetime.now().isoformat()
        )
        db.add(new_image)
        db.commit()
        db.refresh(new_image)
        
        # Generate presigned URL for immediate access
        presigned_url = get_file_url(object_name)
        
        return schemas.ImageUploadResponse(
            image_id=new_image.image_id,
            img_url=img_url,
            presigned_url=presigned_url,
            message="Image uploaded successfully"
        )
    except Exception as e:
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
    summary="Get presigned URL",
    description="Generate a presigned URL for secure, time-limited access to an image"
)
def get_image_url(
    image_id: int,
    expires_in: int = 3600,
    db: Session = Depends(get_db)
):
    """
    Get a presigned URL for accessing an image.
    
    - **image_id**: ID of the image
    - **expires_in**: URL expiration time in seconds (default: 3600 = 1 hour)
    """
    image = db.query(models.ImageMedical).filter(models.ImageMedical.image_id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    # Extract object name from URL
    object_name = image.img_url.split(f"/{image.img_url.split('/')[-2]}/")[-1] if "/" in image.img_url else image.img_url
    
    try:
        presigned_url = get_file_url(object_name, expires_in_seconds=expires_in)
        return {
            "image_id": image_id,
            "presigned_url": presigned_url,
            "expires_in": expires_in
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating URL: {str(e)}")

@router.delete(
    "/images/{image_id}",
    summary="Delete an image",
    description="Delete a medical image from both MinIO storage and database"
)
def delete_image(image_id: int, db: Session = Depends(get_db)):
    """Delete an image from storage and database"""
    image = db.query(models.ImageMedical).filter(models.ImageMedical.image_id == image_id).first()
    if not image:
        raise HTTPException(status_code=404, detail="Image not found")
    
    try:
        # Extract object name from URL
        object_name = image.img_url.split(f"/{image.img_url.split('/')[-2]}/")[-1] if "/" in image.img_url else image.img_url
        delete_file(object_name)
        
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

