from minio import Minio
from minio.error import S3Error
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# MinIO configuration
MINIO_ENDPOINT = os.getenv("MINIO_ENDPOINT", "localhost:9000")
MINIO_ACCESS_KEY = os.getenv("MINIO_ROOT_USER", "minioadmin")
MINIO_SECRET_KEY = os.getenv("MINIO_ROOT_PASSWORD", "minioadmin")
MINIO_BUCKET_NAME = os.getenv("MINIO_BUCKET_NAME", "medical-images")
MINIO_SECURE = os.getenv("MINIO_SECURE", "false").lower() == "true"

# Initialize MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=MINIO_SECURE
)

def ensure_bucket_exists():
    """Ensure the bucket exists, create if it doesn't"""
    try:
        if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
            minio_client.make_bucket(MINIO_BUCKET_NAME)
            print(f"Bucket '{MINIO_BUCKET_NAME}' created successfully")
    except S3Error as e:
        print(f"Error creating bucket: {e}")
        raise

def upload_file(file_data: bytes, object_name: str, content_type: str = "application/octet-stream"):
    """Upload a file to MinIO"""
    try:
        ensure_bucket_exists()
        from io import BytesIO
        file_stream = BytesIO(file_data)
        minio_client.put_object(
            MINIO_BUCKET_NAME,
            object_name,
            file_stream,
            length=len(file_data),
            content_type=content_type
        )
        return f"{MINIO_ENDPOINT}/{MINIO_BUCKET_NAME}/{object_name}"
    except S3Error as e:
        print(f"Error uploading file: {e}")
        raise

def get_file_url(object_name: str, expires_in_seconds: int = 3600):
    """Get a presigned URL for a file"""
    try:
        url = minio_client.presigned_get_object(
            MINIO_BUCKET_NAME,
            object_name,
            expires=expires_in_seconds
        )
        return url
    except S3Error as e:
        print(f"Error generating URL: {e}")
        raise

def delete_file(object_name: str):
    """Delete a file from MinIO"""
    try:
        minio_client.remove_object(MINIO_BUCKET_NAME, object_name)
        return True
    except S3Error as e:
        print(f"Error deleting file: {e}")
        raise


