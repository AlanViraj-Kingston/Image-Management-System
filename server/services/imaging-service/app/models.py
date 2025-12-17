from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from app.database import Base
import enum

class ImageType(str, enum.Enum):
    XRAY = "xray"
    MRI = "mri"
    CT = "ct"
    ULTRASOUND = "ultrasound"
    OTHER = "other"

class ImageMedical(Base):
    __tablename__ = "medical_images"

    image_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    # Reference to patient (no foreign key constraint for microservices independence)
    patient_id = Column(Integer, nullable=False, index=True)
    image_type = Column(SQLEnum(ImageType), nullable=False)
    # Reference to medical staff (no foreign key constraint for microservices independence)
    uploaded_by = Column(Integer, nullable=False)
    img_url = Column(String, nullable=False)  # URL to the image in MinIO
    file_name = Column(String, nullable=False)
    file_size = Column(Integer)  # Size in bytes
    uploaded_at = Column(String)  # ISO format datetime string


