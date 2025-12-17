from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

# ============ PASSWORD HASHING CONFIGURATION ============
# CryptContext handles password hashing and verification
# bcrypt is a secure hashing algorithm that's slow by design (prevents brute force attacks)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ============ JWT CONFIGURATION ============
SECRET_KEY = "your-secret-key-change-this-in-production"  # Should be in environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/users/login")

# ============ PASSWORD HASHING FUNCTIONS ============

def hash_password(password: str) -> str:
    """
    Hash a plain text password using bcrypt.
    
    This function takes a plain text password and returns a hashed version.
    The hash includes a salt (random data) to make it unique even for the same password.
    
    Args:
        password: Plain text password from user input
        
    Returns:
        Hashed password string (e.g., "$2b$12$...") that can be safely stored in database
        
    Security Note:
        - Never store plain text passwords in the database
        - The same password will produce different hashes (due to salt)
        - Hashing is one-way: you cannot reverse it to get the original password
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    This function compares a user-provided password with the stored hash.
    It uses bcrypt's verification which handles the salt automatically.
    
    Args:
        plain_password: Password provided by user during login
        hashed_password: Stored password hash from database
        
    Returns:
        True if passwords match, False otherwise
        
    Security Note:
        - This is safe against timing attacks
        - The comparison is constant-time to prevent information leakage
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str, credentials_exception):
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        return int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Dependency to get the current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user_id = verify_token(token, credentials_exception)
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    return user

def get_current_active_user(
    current_user: models.User = Depends(get_current_user)
) -> models.User:
    """Dependency to ensure the current user is active"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )
    return current_user

