from pydantic import BaseModel
from typing import Optional
from app.models import ImageType

class ImageMedicalCreate(BaseModel):
    patient_id: int
    image_type: ImageType
    uploaded_by: int
    file_name: str
    file_size: Optional[int] = None

class ImageMedicalResponse(BaseModel):
    image_id: int
    patient_id: int
    image_type: ImageType
    uploaded_by: int
    img_url: str
    file_name: str
    file_size: Optional[int] = None
    uploaded_at: Optional[str] = None

    class Config:
        from_attributes = True

class ImageUploadResponse(BaseModel):
    image_id: int
    img_url: str
    presigned_url: Optional[str] = None
    message: str


