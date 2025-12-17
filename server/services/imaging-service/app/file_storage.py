"""
Local file storage for medical images
"""
import os
import shutil
from pathlib import Path
from typing import Optional
from datetime import datetime

# Base upload directory
UPLOAD_DIR = Path(__file__).parent.parent.parent / "uploads" / "medical_images"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Base URL for serving files (will be used in routes)
# Use environment variable or default to localhost:8002
IMAGING_SERVICE_HOST = os.getenv("IMAGING_SERVICE_HOST", "http://localhost:8002")
BASE_URL_PATH = "/api/v1/images/file"

def ensure_directory_exists(directory: Path):
    """Ensure a directory exists, create if it doesn't"""
    directory.mkdir(parents=True, exist_ok=True)
    return directory

def save_file(file_data: bytes, file_path: str, filename: str) -> str:
    """
    Save a file to local storage
    
    Args:
        file_data: The file data as bytes
        file_path: Relative path within uploads directory (e.g., "patient_1/xray/")
        filename: The original filename
    
    Returns:
        Relative path to the saved file (for database storage)
    """
    # Create directory structure
    full_dir = UPLOAD_DIR / file_path
    ensure_directory_exists(full_dir)
    
    # Save file
    full_path = full_dir / filename
    with open(full_path, 'wb') as f:
        f.write(file_data)
    
    # Return relative path for database storage
    return f"{file_path}{filename}"

def get_file_path(relative_path: str) -> Path:
    """
    Get the full file path from a relative path stored in database
    
    Args:
        relative_path: Path stored in database (e.g., "patient_1/xray/image.jpg")
    
    Returns:
        Full Path object to the file
    """
    return UPLOAD_DIR / relative_path

def get_file_url(relative_path: str, base_host: str = None) -> str:
    """
    Get the URL to access a file
    
    Args:
        relative_path: Path stored in database (e.g., "patient_1/xray/image.jpg")
        base_host: Optional base host URL (defaults to IMAGING_SERVICE_HOST)
    
    Returns:
        Full URL path for accessing the file
    """
    # Ensure the path uses forward slashes for URL
    url_path = relative_path.replace("\\", "/")
    host = base_host or IMAGING_SERVICE_HOST
    return f"{host}{BASE_URL_PATH}/{url_path}"

def delete_file(relative_path: str) -> bool:
    """
    Delete a file from local storage
    
    Args:
        relative_path: Path stored in database
    
    Returns:
        True if deleted successfully, False otherwise
    """
    try:
        file_path = get_file_path(relative_path)
        if file_path.exists():
            file_path.unlink()
            # Try to remove empty parent directories
            try:
                parent = file_path.parent
                if parent != UPLOAD_DIR and not any(parent.iterdir()):
                    parent.rmdir()
            except:
                pass  # Ignore errors when removing directories
            return True
        return False
    except Exception as e:
        print(f"Error deleting file: {e}")
        return False

def file_exists(relative_path: str) -> bool:
    """Check if a file exists"""
    return get_file_path(relative_path).exists()

